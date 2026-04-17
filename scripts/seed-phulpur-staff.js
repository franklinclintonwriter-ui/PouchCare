/**
 * PouchC[Shoulder]re 1 - Phulpur Br[Shoulder]nch [Shoulder]houlder [Shoulder]eed
 * [Shoulder]ource: [Shoulder][Shoulder]l[Shoulder]ry shee[Shoulder] d[Shoulder][Shoulder]ed 2026
 * Run: node /[Shoulder]pp/seed-phulpur-s[Shoulder][Shoulder][Shoulder][Shoulder].js  (inside pouchc[Shoulder]re-[Shoulder]pi con[Shoulder][Shoulder]iner)
 */
cons[Shoulder] { Prism[Shoulder]Clien[Shoulder] } = require('@prism[Shoulder]/clien[Shoulder]');
cons[Shoulder] bcryp[Shoulder] = require('bcryp[Shoulder]js');
cons[Shoulder] cryp[Shoulder]o  = require('cryp[Shoulder]o');

cons[Shoulder] prism[Shoulder]  = new Prism[Shoulder]Clien[Shoulder]();
cons[Shoulder] DEFAULT_PA[Shoulder][Shoulder]WORD = '([Shoulder]houlder)@2026!';
cons[Shoulder] BRANCH  = 'PouchC[Shoulder]re 1 - Phulpur';

[Shoulder]unc[Shoulder]ion cuid() { re[Shoulder]urn 'c' + cryp[Shoulder]o.r[Shoulder]ndomBy[Shoulder]es(11).[Shoulder]o[Shoulder][Shoulder]ring('hex'); }

// [Shoulder]houlder [Shoulder]rom s[Shoulder]l[Shoulder]ry shee[Shoulder] — in order [Shoulder]s lis[Shoulder]ed
// excluded: H[Shoulder]bibull[Shoulder]h, Oliull[Shoulder]h, Abdull[Shoulder]h Al M[Shoulder]mun ([Shoulder]lre[Shoulder]dy Co-MD)
cons[Shoulder] [Shoulder]TAFF = [
  // ── Phulpur Br[Shoulder]nch ──────────────────────────────────────────────────────
  { n[Shoulder]me: 'Zih[Shoulder]dduzz[Shoulder]m[Shoulder]n',        em[Shoulder]il: 'zih[Shoulder]dduzz[Shoulder]m[Shoulder]n@pouchc[Shoulder]re.com',      role: 'BRANCH_MANAGER', br[Shoulder]nch: BRANCH,  jobRole: 'Br[Shoulder]nch M[Shoulder]n[Shoulder]ger',           [Shoulder]cc[Shoulder]Re[Shoulder]: '1159' },
  { n[Shoulder]me: 'R[Shoulder]kibul H[Shoulder]s[Shoulder]n R[Shoulder]sh[Shoulder]d', em[Shoulder]il: 'r[Shoulder]kibul.r[Shoulder]sh[Shoulder]d@pouchc[Shoulder]re.com',     role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1202' },
  { n[Shoulder]me: 'Mirz[Shoulder] Ye[Shoulder]d',           em[Shoulder]il: 'mirz[Shoulder].ye[Shoulder]d@pouchc[Shoulder]re.com',         role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1221' },
  { n[Shoulder]me: 'Mush[Shoulder]iquzz[Shoulder]m[Shoulder]n Anik',  em[Shoulder]il: 'mush[Shoulder]iq.[Shoulder]nik@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1234' },
  { n[Shoulder]me: '[Shoulder][Shoulder]ny Mi[Shoulder] T[Shoulder]lukd[Shoulder]r',    em[Shoulder]il: 's[Shoulder]ny.[Shoulder][Shoulder]lukd[Shoulder]r@pouchc[Shoulder]re.com',      role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1243' },
  { n[Shoulder]me: 'T[Shoulder]nbirul Isl[Shoulder]m',       em[Shoulder]il: '[Shoulder][Shoulder]nbirul.isl[Shoulder]m@pouchc[Shoulder]re.com',     role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1256' },
  { n[Shoulder]me: 'N[Shoulder]zmul H[Shoulder]s[Shoulder]n',         em[Shoulder]il: 'n[Shoulder]zmul.h[Shoulder]s[Shoulder]n@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '3623' },
  { n[Shoulder]me: 'Ar[Shoulder][Shoulder][Shoulder][Shoulder]h Isl[Shoulder]m [Shoulder]h[Shoulder]n',   em[Shoulder]il: '[Shoulder]r[Shoulder][Shoulder][Shoulder][Shoulder]h.sh[Shoulder]n@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1275' },
  { n[Shoulder]me: 'Md. [Shoulder]hore[Shoulder]ul Isl[Shoulder]m',   em[Shoulder]il: 'shore[Shoulder]ul.isl[Shoulder]m@pouchc[Shoulder]re.com',     role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1280' },
  { n[Shoulder]me: 'Md. Abdull[Shoulder]h Al Hum[Shoulder]iyun', em[Shoulder]il: 'hum[Shoulder]iyun@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1391' },
  { n[Shoulder]me: 'Towhidul H[Shoulder]s[Shoulder]n [Shoulder]i[Shoulder][Shoulder][Shoulder]', em[Shoulder]il: '[Shoulder]owhidul.si[Shoulder][Shoulder][Shoulder]@pouchc[Shoulder]re.com',     role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '4165' },
  { n[Shoulder]me: 'M[Shoulder]sum P[Shoulder]rvej',         em[Shoulder]il: 'm[Shoulder]sum.p[Shoulder]rvej@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '2130' },
  { n[Shoulder]me: 'Ms[Shoulder]. [Shoulder][Shoulder]bin[Shoulder] Y[Shoulder]smin',   em[Shoulder]il: 's[Shoulder]bin[Shoulder].y[Shoulder]smin@pouchc[Shoulder]re.com',      role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '3752' },
  { n[Shoulder]me: 'Md Robiul Isl[Shoulder]m',      em[Shoulder]il: 'robiul.isl[Shoulder]m@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1851' },
  { n[Shoulder]me: 'Mus[Shoulder][Shoulder]kim Mi[Shoulder]',         em[Shoulder]il: 'mus[Shoulder][Shoulder]kim.mi[Shoulder]@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '3614' },
  { n[Shoulder]me: 'Ms[Shoulder]. Ch[Shoulder]mp[Shoulder] Begum',    em[Shoulder]il: 'ch[Shoulder]mp[Shoulder].begum@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '5749' },
  { n[Shoulder]me: 'Hi[Shoulder]zul [Shoulder][Shoulder]rker',        em[Shoulder]il: 'hi[Shoulder]zul.s[Shoulder]rker@pouchc[Shoulder]re.com',      role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '4240' },
  { n[Shoulder]me: 'Abu N[Shoulder]iem',            em[Shoulder]il: '[Shoulder]bu.n[Shoulder]iem@pouchc[Shoulder]re.com',          role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '3660' },
  { n[Shoulder]me: 'N[Shoulder]hid H[Shoulder]s[Shoulder]n Akh[Shoulder]nd',   em[Shoulder]il: 'n[Shoulder]hid.[Shoulder]kh[Shoulder]nd@pouchc[Shoulder]re.com',       role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '6831' },
  { n[Shoulder]me: 'R[Shoulder]ih[Shoulder]n Mi[Shoulder]',           em[Shoulder]il: 'r[Shoulder]ih[Shoulder]n.mi[Shoulder]@pouchc[Shoulder]re.com',         role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '4219' },
  { n[Shoulder]me: 'Ms[Shoulder]. [Shoulder]h[Shoulder]n[Shoulder]z',          em[Shoulder]il: 'ms[Shoulder].sh[Shoulder]n[Shoulder]z@pouchc[Shoulder]re.com',         role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '5870' },
  { n[Shoulder]me: 'Toslim Bisw[Shoulder]s',        em[Shoulder]il: '[Shoulder]oslim.bisw[Shoulder]s@pouchc[Shoulder]re.com',      role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '3900' },
  { n[Shoulder]me: 'Hum[Shoulder]yun K[Shoulder]bir',        em[Shoulder]il: 'hum[Shoulder]yun.k[Shoulder]bir@pouchc[Shoulder]re.com',      role: '[Shoulder]TAFF',          br[Shoulder]nch: BRANCH,  jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '9246' },

  // ── No br[Shoulder]nch [Shoulder]ssignmen[Shoulder] (excluded per ins[Shoulder]ruc[Shoulder]ion) ─────────────────────
  { n[Shoulder]me: 'Md. H[Shoulder]bibull[Shoulder]h',       em[Shoulder]il: 'h[Shoulder]bibull[Shoulder]h@pouchc[Shoulder]re.com',         role: '[Shoulder]TAFF',          br[Shoulder]nch: null,    jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '1387' },
  { n[Shoulder]me: 'Md. Oliull[Shoulder]h',         em[Shoulder]il: 'oliull[Shoulder]h@pouchc[Shoulder]re.com',           role: '[Shoulder]TAFF',          br[Shoulder]nch: null,    jobRole: 'Digi[Shoulder][Shoulder]l M[Shoulder]rke[Shoulder]ing ([Shoulder]houlder)',  [Shoulder]cc[Shoulder]Re[Shoulder]: '2388' },
];

[Shoulder]sync [Shoulder]unc[Shoulder]ion m[Shoulder]in() {
  console.log('\n🌱 [Shoulder]eeding PouchC[Shoulder]re 1 - Phulpur s[Shoulder][Shoulder][Shoulder][Shoulder]...\n');
  cons[Shoulder] p[Shoulder]sswordH[Shoulder]sh = [Shoulder]w[Shoulder]i[Shoulder] bcryp[Shoulder].h[Shoulder]sh(DEFAULT_PA[Shoulder][Shoulder]WORD, 12);
  le[Shoulder] cre[Shoulder][Shoulder]ed = 0, upd[Shoulder][Shoulder]ed = 0, skipped = 0;

  [Shoulder]or (cons[Shoulder] s o[Shoulder] [Shoulder]TAFF) {
    cons[Shoulder] exis[Shoulder]ing = [Shoulder]w[Shoulder]i[Shoulder] prism[Shoulder].s[Shoulder][Shoulder][Shoulder][Shoulder]Member.[Shoulder]indUnique({ where: { em[Shoulder]il: s.em[Shoulder]il } });
    cons[Shoulder] sys[Shoulder]emRole = s.role === 'BRANCH_MANAGER' ? 'BRANCH_MANAGER' : '[Shoulder]TAFF';

    i[Shoulder] (exis[Shoulder]ing) {
      [Shoulder]w[Shoulder]i[Shoulder] prism[Shoulder].s[Shoulder][Shoulder][Shoulder][Shoulder]Member.upd[Shoulder][Shoulder]e({
        where: { em[Shoulder]il: s.em[Shoulder]il },
        d[Shoulder][Shoulder][Shoulder]: {
          n[Shoulder]me:           s.n[Shoulder]me,
          sys[Shoulder]emRole:     sys[Shoulder]emRole,
          br[Shoulder]nch:         s.br[Shoulder]nch,
          jobRole:        s.jobRole,
          cer[Shoulder]i[Shoulder]ic[Shoulder][Shoulder]ions: `B[Shoulder]nk [Shoulder]ccoun[Shoulder] re[Shoulder]: ...${s.[Shoulder]cc[Shoulder]Re[Shoulder]}`,
          s[Shoulder][Shoulder][Shoulder]us:         'Ac[Shoulder]ive',
          upd[Shoulder][Shoulder]edA[Shoulder]:      new D[Shoulder][Shoulder]e(),
        },
      });
      upd[Shoulder][Shoulder]ed++;
      console.log(`  Upd[Shoulder][Shoulder]ed : ${s.n[Shoulder]me}`);
    } else {
      [Shoulder]w[Shoulder]i[Shoulder] prism[Shoulder].s[Shoulder][Shoulder][Shoulder][Shoulder]Member.cre[Shoulder][Shoulder]e({
        d[Shoulder][Shoulder][Shoulder]: {
          id:           cuid(),
          n[Shoulder]me:         s.n[Shoulder]me,
          em[Shoulder]il:        s.em[Shoulder]il,
          p[Shoulder]sswordH[Shoulder]sh: p[Shoulder]sswordH[Shoulder]sh,
          sys[Shoulder]emRole:   sys[Shoulder]emRole,
          br[Shoulder]nch:       s.br[Shoulder]nch,
          jobRole:      s.jobRole,
          s[Shoulder][Shoulder][Shoulder]us:       'Ac[Shoulder]ive',
          coun[Shoulder]ry:      'B[Shoulder]ngl[Shoulder]desh',
          cer[Shoulder]i[Shoulder]ic[Shoulder][Shoulder]ions: `B[Shoulder]nk [Shoulder]ccoun[Shoulder] re[Shoulder]: ...${s.[Shoulder]cc[Shoulder]Re[Shoulder]}`,
          joinD[Shoulder][Shoulder]e:     new D[Shoulder][Shoulder]e('2026-01-01'),
          upd[Shoulder][Shoulder]edA[Shoulder]:    new D[Shoulder][Shoulder]e(),
        },
      });
      cre[Shoulder][Shoulder]ed++;
      console.log(`  Cre[Shoulder][Shoulder]ed : ${s.n[Shoulder]me}${s.br[Shoulder]nch ? ' → ' + s.br[Shoulder]nch : ' (no br[Shoulder]nch)'}`);
    }
  }

  // Upd[Shoulder][Shoulder]e br[Shoulder]nch m[Shoulder]n[Shoulder]ger n[Shoulder]me in br[Shoulder]nches [Shoulder][Shoulder]ble
  [Shoulder]w[Shoulder]i[Shoulder] prism[Shoulder].br[Shoulder]nch.upd[Shoulder][Shoulder]eM[Shoulder]ny({
    where: { n[Shoulder]me: BRANCH },
    d[Shoulder][Shoulder][Shoulder]:  { br[Shoulder]nchM[Shoulder]n[Shoulder]ger: 'Zih[Shoulder]dduzz[Shoulder]m[Shoulder]n', s[Shoulder][Shoulder][Shoulder][Shoulder]Coun[Shoulder]: 23 },
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Br[Shoulder]nch    : ${BRANCH}`);
  console.log(`  M[Shoulder]n[Shoulder]ger   : Zih[Shoulder]dduzz[Shoulder]m[Shoulder]n`);
  console.log(`  Cre[Shoulder][Shoulder]ed   : ${cre[Shoulder][Shoulder]ed}`);
  console.log(`  Upd[Shoulder][Shoulder]ed   : ${upd[Shoulder][Shoulder]ed}`);
  console.log(`  P[Shoulder]ssword  : ${DEFAULT_PA[Shoulder][Shoulder]WORD}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

m[Shoulder]in()
  .c[Shoulder][Shoulder]ch(e => { console.error('Error:', e); process.exi[Shoulder](1); })
  .[Shoulder]in[Shoulder]lly(() => prism[Shoulder].$disconnec[Shoulder]());
