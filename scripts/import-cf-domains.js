/**
 * PouchCare OS — Cloudflare Domain Importer
 *
 * Imports all domains from one or more Cloudflare accounts into the `domains` table.
 * SAFE TO RUN MULTIPLE TIMES — uses ON CONFLICT DO UPDATE (upsert).
 *
 * Usage (inside pouchcare-api container):
 *   node /app/import-cf-domains.js
 *
 * Env vars used (auto-read from process.env):
 *   CF_ACCOUNTS  JSON array of { token, label } objects
 *                e.g. '[{"token":"xxx","label":"Main Account"},{"token":"yyy","label":"Client Account"}]'
 *
 *   CF_TOKEN_1   First account token  (alternative to CF_ACCOUNTS)
 *   CF_LABEL_1   First account label
 *   CF_TOKEN_2   Second account token
 *   CF_LABEL_2   Second account label
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────
function cuid() { return 'c' + crypto.randomBytes(11).toString('hex'); }

function cfGet(path, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.cloudflare.com',
      path: `/client/v4${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'pouchcare-domain-importer/1.0',
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Invalid JSON: ' + data.slice(0,200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function fetchAllZones(token, label) {
  const zones = [];
  let page = 1;
  while (true) {
    const r = await cfGet(`/zones?per_page=50&page=${page}`, token);
    if (!r.success) throw new Error(`CF API error [${label}]: ${JSON.stringify(r.errors)}`);
    zones.push(...r.result);
    if (r.result.length < 50) break;
    page++;
  }
  return zones;
}

// ── Detect niche from domain name ─────────────────────────────────────────────
function detectNiche(domain) {
  const d = domain.toLowerCase();
  if (/pouchcare/.test(d))                        return 'PouchCare';
  if (/game|games|gaming|win|play|club|app|fun/.test(d)) return 'Gaming';
  if (/seo|tech|digital|marketing|web/.test(d))  return 'Digital Marketing';
  if (/news|times|media|info/.test(d))            return 'Media / News';
  if (/shop|store|buy|sale/.test(d))              return 'E-Commerce';
  if (/blog|article|post/.test(d))                return 'Blog / Content';
  return 'Other';
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function importAccount(token, label, stats) {
  console.log(`\n── Fetching zones from: ${label} ──`);
  const zones = await fetchAllZones(token, label);
  console.log(`   Found ${zones.length} domains`);

  for (const z of zones) {
    const domainName = z.name.toLowerCase().trim();
    const cfStatus   = z.status === 'active' ? 'Active' : (z.status === 'pending' ? 'Pending' : 'Inactive');
    const existing   = await prisma.domain.findUnique({ where: { domainName } });

    const data = {
      status:           cfStatus,
      registrar:        'Cloudflare',
      niche:            detectNiche(domainName),
      notes:            `Imported from Cloudflare [${label}] — Zone ID: ${z.id}`,
      sslStatus:        z.meta?.ssl_universal === false ? 'None' : 'Active',
      lifecycleStatus:  z.status === 'active' ? 'ACTIVE' : 'INCOMPLETE',
    };

    if (existing) {
      await prisma.domain.update({ where: { domainName }, data });
      stats.updated++;
      console.log(`   [UPDATE] ${domainName}`);
    } else {
      await prisma.domain.create({
        data: {
          id:         cuid(),
          domainName,
          ...data,
        },
      });
      stats.created++;
      console.log(`   [NEW]    ${domainName}`);
    }
  }
}

async function main() {
  console.log('\n========================================');
  console.log(' PouchCare Domain Importer');
  console.log('========================================');

  // ── Resolve accounts ────────────────────────────────────────────────────────
  let accounts = [];

  if (process.env.CF_ACCOUNTS) {
    accounts = JSON.parse(process.env.CF_ACCOUNTS);
  } else {
    // Fall back to numbered env vars or hardcoded token
    for (let i = 1; i <= 10; i++) {
      const token = process.env[`CF_TOKEN_${i}`];
      const label = process.env[`CF_LABEL_${i}`] || `Account ${i}`;
      if (token) accounts.push({ token, label });
    }
    // Single default token
    if (accounts.length === 0 && process.env.CF_TOKEN) {
      accounts.push({ token: process.env.CF_TOKEN, label: process.env.CF_LABEL || 'Default Account' });
    }
  }

  if (accounts.length === 0) {
    console.error('\nERROR: No Cloudflare tokens found.');
    console.error('Set CF_TOKEN_1 / CF_LABEL_1 or CF_ACCOUNTS env variable.\n');
    process.exit(1);
  }

  const stats = { created: 0, updated: 0, errors: 0 };

  for (const acct of accounts) {
    try {
      await importAccount(acct.token, acct.label, stats);
    } catch (e) {
      console.error(`\nERROR importing [${acct.label}]: ${e.message}`);
      stats.errors++;
    }
  }

  const total = await prisma.domain.count();

  console.log('\n========================================');
  console.log(` Created  : ${stats.created}`);
  console.log(` Updated  : ${stats.updated}`);
  console.log(` Errors   : ${stats.errors}`);
  console.log(` Total DB : ${total} domains`);
  console.log('========================================\n');
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
