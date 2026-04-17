/**
 * PouchCare OS — Registrar Domain Importer
 * Imports domains from a CSV export (GoDaddy / Namecheap / etc.).
 * Safe to re-run — uses upsert (no duplicates).
 * Run: node /app/import-registrar-domains.js  (inside pouchcare-api container)
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma  = new PrismaClient();

function cuid() { return 'c' + crypto.randomBytes(11).toString('hex'); }

function detectNiche(d) {
  d = d.toLowerCase();
  if (/pouchcare|apkcare/.test(d))                           return 'PouchCare';
  if (/game|games|gaming|win|club|jeeto|casino|slot|play|jilli|jita|tiranga|gboslot|jalwa|jeet/.test(d)) return 'Gaming';
  if (/seo|tech|digital|marketing/.test(d))                 return 'Digital Marketing';
  if (/finance|bank/.test(d))                               return 'Finance';
  if (/news|times|media/.test(d))                           return 'Media / News';
  if (/apk|download|app/.test(d))                           return 'App / Mobile';
  return 'Other';
}

function mapStatus(raw) {
  if (!raw || raw === 'Active') return { status: 'Active', lifecycleStatus: 'ACTIVE' };
  if (/expired.*hold/i.test(raw))   return { status: 'Expired', lifecycleStatus: 'EXPIRED_HOLD' };
  if (/redeem.*hold/i.test(raw))    return { status: 'Redemption', lifecycleStatus: 'REDEMPTION_HOLD' };
  if (/hold/i.test(raw))            return { status: 'Hold', lifecycleStatus: 'INCOMPLETE' };
  return { status: raw, lifecycleStatus: 'ACTIVE' };
}

// ── Domain CSV data ────────────────────────────────────────────────────────────
const CSV_DATA = `Domain Name,Expiration Date,Auto-renew,Status
87-lucky-club.com,2027-03-22,On,Active
87luckyclub.games,2026-11-21,On,Active
88babu.app,2027-02-03,On,Active
91clublottery.com,2026-03-22,Off,Expired domain hold
91clubwingo.com,2026-03-22,Off,Expired domain hold
92-dadu.app,2027-02-25,On,Active
92dadu.asia,2027-02-25,On,Active
92dadu.co,2027-02-25,On,Active
92dadu.in,2027-02-25,On,
92jeeto.mobi,2026-03-27,On,Expired domain hold
92jeeto1.com,2026-12-16,On,Active
92pkr.app,2026-11-13,On,Active
aaws.team,2026-04-23,Off,Active
acchagames.com,2026-03-30,Off,Cust Redeem Hold
achagames.app,2026-03-30,Off,Cust Redeem Hold
achagames.asia,2026-03-30,Off,Cust Redeem Hold
achagames.world,2026-03-30,Off,Cust Redeem Hold
achagames.xyz,2026-03-30,Off,Cust Redeem Hold
alaqsatimes.com,2027-10-03,On,Active
amarclub-app.com,2026-06-28,On,Active
amarclub.download,2026-06-28,On,Active
amarclub.mobi,2026-06-28,On,Active
amars.club,2026-06-28,On,Active
apk.zone,2029-03-13,On,Active
apkcare.app,2027-03-13,On,Active
babu88-app.download,2027-02-05,On,Active
babu88.ca,2027-02-03,On,Active
babu88.download,2027-02-03,On,Active
babu88.xyz,2026-08-21,On,Active
babu89.asia,2026-03-27,On,Cust Redeem Hold
babu89.club,2027-03-09,On,Active
babu89.co,2026-03-27,On,Expired domain hold
babu89.fun,2026-03-27,On,Expired domain hold
babu89.live,2026-03-27,On,Expired domain hold
babu89.online,2027-03-09,On,Active
babu89.site,2026-03-27,On,Expired domain hold
babu89.vip,2027-03-09,On,Active
babu89.xyz,2026-03-27,On,Expired domain hold
basantclub.asia,2027-03-22,On,Active
basantclub.club,2026-03-15,Off,Expired domain hold
basantclub.co,2026-03-22,Off,Expired domain hold
basantclub.online,2027-03-13,On,Active
basantclub.shop,2027-01-22,On,Active
basantclub.today,2026-04-16,On,Active
basantclubs.com,2026-03-15,Off,Expired domain hold
bbgo.run,2026-12-23,On,Active
bbgogame.cc,2026-12-23,On,Active
bbgogame.run,2026-12-23,On,Active
bbgogame.win,2026-12-23,On,Active
bbgogames.win,2026-12-23,On,Active
bdcasino.app,2027-01-22,On,Active
bdg-app.games,2026-12-28,On,Active
bdg-games.app,2026-12-28,On,Active
bdgame.app,2028-12-20,On,Active
bdggame-app.com,2026-12-20,On,Active
bdggame.ca,2026-12-28,On,Active
bdtcasino.com,2027-03-12,On,Active
bdtgame.asia,2027-02-22,On,Active
bdtgame.club,2026-12-18,On,Active
bdtgame.live,2026-12-18,On,Active
bdtgame.mobi,2026-12-18,On,Active
bdtgame.net,2026-12-18,On,Active
bdtgame.win,2026-12-18,On,Active
bdtgames.online,2026-12-18,On,Active
bigwin.run,2027-02-25,On,Active
bountygame.asia,2027-02-08,On,Active
bountygame.live,2027-02-05,On,Active
bountygame.mobi,2026-03-20,On,Expired domain hold
bountygame.net.in,2027-03-20,On,Active
bountygame.win,2026-10-17,On,Active
d1win.com,2026-07-08,Off,Active
diu-win.app,2026-08-04,On,Active
diuwin.games,2026-08-04,On,Active
fantasygems.mobi,2027-03-05,On,Active
fantasygemss.club,2027-03-15,On,Active
fantasygemss.vip,2027-03-15,On,Active
fantasysgems.app,2027-03-05,On,Active
fantasysgems.club,2027-03-05,On,Active
finance-bd.com,2026-10-23,On,Active
financeofbd.com,2026-10-24,On,Active
gbogame.com,2028-03-12,On,Active
gboslot.app,2028-03-12,On,Active
gboslot.games,2027-03-12,On,Active
gboslot.live,2027-03-12,On,Active
gboslot.online,2027-03-12,On,Active
gboslot.pro,2027-03-12,On,Active
gboslot.vip,2027-03-12,On,Active
gboslot.win,2027-03-12,On,Active
gboslots.com,2028-03-12,On,Active
goa-games.co,2026-03-22,Off,Expired domain hold
goagames.asia,2026-03-22,Off,Cust Redeem Hold
goagames.today,2026-03-22,Off,Expired domain hold
hgnice.mobi,2026-10-20,On,Active
hgzy.app,2027-05-27,On,Active
hgzy.ca,2026-12-28,On,Active
hgzy.games,2026-05-16,On,Active
hgzy.today,2026-12-28,On,Active
jai-win.co,2027-02-25,On,Active
jaiwin.pro,2027-02-25,On,Active
jalwa-game.fun,2027-03-09,On,Active
jalwagame-app.com,2027-03-08,On,Active
jalwagame.online,2027-03-08,On,Active
jalwagame.site,2027-03-08,On,Active
jalwagame.xyz,2027-03-08,On,Active
jeet-win.games,2027-02-05,On,Active
jeeto7.club,2026-12-12,On,Active
jeeto7.co,2026-12-12,On,Active
jeeto7.fun,2026-12-12,On,Active
jeeto7.live,2026-12-12,On,Active
jeeto7.online,2026-12-12,On,Active
jeeto7.vip,2026-12-12,On,Active
jeetwin-app.download,2027-02-05,On,Active
jiitawin.app,2027-02-05,On,Active
jilli.app,2027-02-05,On,Active
jilli.games,2027-02-05,On,Active
jita-win.app,2027-02-05,On,Active
jitawin.games,2027-02-05,On,Active
jitawin.mobi,2027-02-05,On,Active
ok-win.org,2026-04-23,On,Active
okwin.download,2026-04-25,On,Active
okwin.ltd,2026-04-18,Off,Active
okwin.mobi,2026-04-23,Off,Active
okwin.pro,2027-04-13,On,Active
okwin.today,2026-04-23,Off,Active
okwinn.com,2026-04-22,Off,Active
pak-games.com,2028-02-15,On,Active
pakgame.app,2027-05-15,On,Active
pakgame.live,2028-03-15,On,Active
pakgames.app,2028-02-02,On,Active
pakgames.club,2027-01-28,On,Active
pakgames.co.in,2026-03-22,Off,Expired domain hold
pakgames.download,2026-04-25,Off,Active
pakgames.live,2027-01-29,On,Active
pakgames.today,2026-03-22,Off,Expired domain hold
pkrclub.fun,2027-01-10,On,Active
play91.club,2026-03-22,Off,Expired domain hold
pouchcare.it.com,2027-12-23,On,Active
pouchcare.report,2026-10-20,On,Active
tiranga-games.asia,2026-03-08,Off,Cust Redeem Hold
tiranga-games.club,2026-03-09,Off,Expired domain hold
wells.win,2027-03-30,Off,Active`;

// ── Parse CSV ──────────────────────────────────────────────────────────────────
function parseCsv(raw) {
  const lines  = raw.trim().split('\n');
  const header = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const parts = line.split(',');
    const row = {};
    header.forEach((h, i) => row[h] = (parts[i] || '').trim());
    return row;
  }).filter(r => r['Domain Name']);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const rows = parseCsv(CSV_DATA);
  console.log(`\n========================================`);
  console.log(` Registrar Domain Importer`);
  console.log(` ${rows.length} domains to process`);
  console.log(`========================================\n`);

  let created = 0, updated = 0, skipped = 0;
  const byStatus = {};

  for (const row of rows) {
    const domainName  = row['Domain Name'].toLowerCase().trim();
    const expiryDate  = row['Expiration Date'] ? new Date(row['Expiration Date']) : null;
    const autoRenew   = row['Auto-renew'] === 'On';
    const rawStatus   = row['Status'] || 'Active';
    const { status, lifecycleStatus } = mapStatus(rawStatus);
    byStatus[status] = (byStatus[status] || 0) + 1;

    // Calculate domain age from registration date if we have it, else estimate from expiry - 1yr
    let domainAgeYears = null;
    if (expiryDate) {
      // estimate: most registrations are 1-2 years; we know expiry, so reg = expiry - ~1yr
      // We'll leave domainAgeYears to be updated by RDAP importer later
    }

    const data = {
      status,
      lifecycleStatus,
      expiryDate,
      registrar:   'GoDaddy / Registrar',
      niche:        detectNiche(domainName),
      notes:       `Registrar import — Auto-renew: ${autoRenew ? 'Yes' : 'No'} | Raw status: ${rawStatus}`,
    };

    const existing = await prisma.domain.findUnique({ where: { domainName } });

    if (existing) {
      // Merge: update expiry, status, auto-renew note. Preserve existing reg date if set.
      await prisma.domain.update({
        where: { domainName },
        data: {
          ...data,
          registrationDate: existing.registrationDate ?? null,
          domainAgeYears:   existing.domainAgeYears   ?? domainAgeYears,
          // Merge registrar info
          registrar: existing.registrar === 'Cloudflare'
            ? 'Cloudflare + GoDaddy'
            : (existing.registrar || data.registrar),
        },
      });
      updated++;
      console.log(`  [UPDATE] ${domainName.padEnd(35)} ${status}`);
    } else {
      await prisma.domain.create({
        data: { id: cuid(), domainName, ...data, domainAgeYears },
      });
      created++;
      console.log(`  [NEW]    ${domainName.padEnd(35)} ${status} | exp: ${expiryDate?.toISOString().split('T')[0] ?? 'none'}`);
    }
  }

  const totalDB = await prisma.domain.count();

  console.log(`\n========================================`);
  console.log(` Created       : ${created}`);
  console.log(` Updated       : ${updated}`);
  console.log(` Total in DB   : ${totalDB} domains`);
  console.log(` By status:`);
  Object.entries(byStatus).sort((a,b) => b[1]-a[1])
    .forEach(([s,n]) => console.log(`   ${s.padEnd(20)} ${n}`));
  console.log(`========================================\n`);
}

main()
  .catch(e => { console.error('Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
