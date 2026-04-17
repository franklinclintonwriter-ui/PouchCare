/**
 * PouchCare OS — Cloudflare Domain Importer
 *
 * Imports all domains from one or more Cloudflare accounts into the `domains` table.
 * Fetches registration + expiry dates via RDAP (standard registry protocol, no auth needed).
 * SAFE TO RUN MULTIPLE TIMES — uses upsert (ON CONFLICT DO UPDATE).
 *
 * Usage inside pouchcare-api container:
 *   node /app/import-cf-domains.js
 *
 * Env vars:
 *   CF_TOKEN_1   First Cloudflare account OAuth/API token
 *   CF_LABEL_1   Label for that account  (e.g. "Main Account")
 *   CF_TOKEN_2   Second account token  (optional)
 *   CF_LABEL_2   Second account label
 *   ... up to CF_TOKEN_10 / CF_LABEL_10
 *
 *   Or pass a JSON array: CF_ACCOUNTS='[{"token":"...","label":"..."}]'
 */

const { PrismaClient } = require('@prisma/client');
const https  = require('https');
const http   = require('http');
const crypto = require('crypto');

const prisma = new PrismaClient();

// ── HTTP helper (follows one redirect) ───────────────────────────────────────
function getJson(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const opts = {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'pouchcare-domain-importer/2.0',
        ...extraHeaders,
      },
    };
    const req = lib.get(url, opts, (res) => {
      // Follow single redirect
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return getJson(res.headers.location, extraHeaders).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode === 404) { resolve(null); return; }
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => { req.destroy(); resolve(null); });
  });
}

// ── Cloudflare API ────────────────────────────────────────────────────────────
async function fetchAllZones(token, label) {
  const zones = [];
  let page = 1;
  while (true) {
    const r = await getJson(
      `https://api.cloudflare.com/client/v4/zones?per_page=50&page=${page}`,
      { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    );
    if (!r || !r.success) throw new Error(`CF API error [${label}]: ${JSON.stringify(r?.errors)}`);
    zones.push(...r.result);
    if (r.result.length < 50) break;
    page++;
  }
  return zones;
}

// ── RDAP (registration + expiry dates) ────────────────────────────────────────
// RDAP is the international standard for domain registration data (RFC 7483).
// rdap.org is a public bootstrap that redirects to the correct registry server.
const rdapCache = new Map();

async function fetchRdapDates(domain) {
  if (rdapCache.has(domain)) return rdapCache.get(domain);

  const url = `https://rdap.org/domain/${domain}`;
  const data = await getJson(url);
  const result = { registrationDate: null, expiryDate: null };

  if (data && Array.isArray(data.events)) {
    for (const ev of data.events) {
      if (/registr/i.test(ev.eventAction) && !result.registrationDate) {
        result.registrationDate = new Date(ev.eventDate);
      }
      if (/expir/i.test(ev.eventAction)) {
        result.expiryDate = new Date(ev.eventDate);
      }
    }
  }

  rdapCache.set(domain, result);
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function cuid() { return 'c' + crypto.randomBytes(11).toString('hex'); }

function detectNiche(domain) {
  const d = domain.toLowerCase();
  if (/pouchcare/.test(d))                                  return 'PouchCare';
  if (/game|games|gaming|win|play|club|fun|jeeto|casino/.test(d)) return 'Gaming';
  if (/seo|tech|digital|marketing|web/.test(d))            return 'Digital Marketing';
  if (/news|times|media|info/.test(d))                     return 'Media / News';
  if (/shop|store|buy|sale|deal/.test(d))                  return 'E-Commerce';
  if (/blog|article|post/.test(d))                         return 'Blog / Content';
  if (/app|download|mobi/.test(d))                         return 'App / Mobile';
  return 'Other';
}

// ── Import one account ────────────────────────────────────────────────────────
async function importAccount(token, label, stats) {
  console.log(`\n── Fetching zones: ${label} ──`);
  const zones = await fetchAllZones(token, label);
  console.log(`   ${zones.length} domains found`);

  for (const z of zones) {
    const domainName = z.name.toLowerCase().trim();
    const cfStatus   = z.status === 'active' ? 'Active'
                     : z.status === 'pending' ? 'Pending' : 'Inactive';

    // Fetch registration/expiry from RDAP
    process.stdout.write(`   Fetching RDAP: ${domainName} ... `);
    const rdap = await fetchRdapDates(domainName);
    const rdapStr = [
      rdap.registrationDate ? `reg:${rdap.registrationDate.toISOString().split('T')[0]}` : null,
      rdap.expiryDate       ? `exp:${rdap.expiryDate.toISOString().split('T')[0]}`       : null,
    ].filter(Boolean).join(' ');
    console.log(rdapStr || 'no RDAP data');

    const existing = await prisma.domain.findUnique({ where: { domainName } });

    // Build age from registration date (years)
    const domainAgeYears = rdap.registrationDate
      ? parseFloat(((Date.now() - rdap.registrationDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1))
      : null;

    const data = {
      status:             cfStatus,
      lifecycleStatus:    z.status === 'active' ? 'ACTIVE' : 'INCOMPLETE',
      registrar:          'Cloudflare',
      niche:              detectNiche(domainName),
      sslStatus:          z.meta?.ssl_universal === false ? 'None' : 'Active',
      registrationDate:   rdap.registrationDate ?? (z.created_on ? new Date(z.created_on) : null),
      expiryDate:         rdap.expiryDate        ?? null,
      domainAgeYears,
      notes:              `Cloudflare [${label}] — Zone: ${z.id}`,
    };

    if (existing) {
      await prisma.domain.update({ where: { domainName }, data });
      stats.updated++;
    } else {
      await prisma.domain.create({ data: { id: cuid(), domainName, ...data } });
      stats.created++;
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n========================================');
  console.log(' PouchCare Domain Importer v2');
  console.log(' Registration + Expiry via RDAP');
  console.log('========================================');

  let accounts = [];
  if (process.env.CF_ACCOUNTS) {
    accounts = JSON.parse(process.env.CF_ACCOUNTS);
  } else {
    for (let i = 1; i <= 10; i++) {
      const token = process.env[`CF_TOKEN_${i}`];
      const label = process.env[`CF_LABEL_${i}`] || `Account ${i}`;
      if (token) accounts.push({ token, label });
    }
    if (!accounts.length && process.env.CF_TOKEN) {
      accounts.push({ token: process.env.CF_TOKEN, label: process.env.CF_LABEL || 'Default' });
    }
  }

  if (!accounts.length) {
    console.error('\nERROR: No Cloudflare tokens found.');
    console.error('Set CF_TOKEN_1 / CF_LABEL_1 or CF_ACCOUNTS.\n');
    process.exit(1);
  }

  const stats = { created: 0, updated: 0, errors: 0 };

  for (const acct of accounts) {
    try { await importAccount(acct.token, acct.label, stats); }
    catch (e) { console.error(`\nERROR [${acct.label}]: ${e.message}`); stats.errors++; }
  }

  const total = await prisma.domain.count();
  const withExpiry = await prisma.domain.count({ where: { expiryDate: { not: null } } });
  const withReg    = await prisma.domain.count({ where: { registrationDate: { not: null } } });

  console.log('\n========================================');
  console.log(` Created          : ${stats.created}`);
  console.log(` Updated          : ${stats.updated}`);
  console.log(` Errors           : ${stats.errors}`);
  console.log(` Total in DB      : ${total} domains`);
  console.log(` With expiry date : ${withExpiry}`);
  console.log(` With reg date    : ${withReg}`);
  console.log('========================================\n');
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
