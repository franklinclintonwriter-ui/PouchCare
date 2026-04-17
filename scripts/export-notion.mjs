#!/usr/bin/env node
/**
 * PouchCare OS — Notion Schema Exporter
 * Exports all 32 database schemas from Notion to /docs/database/
 *
 * Usage:
 *   NOTION_TOKEN=secret_xxx node scripts/export-notion.mjs
 *
 * Install dependency first:
 *   npm install @notionhq/client
 */

import { Client } from '@notionhq/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'database');

const TOKEN = process.env.NOTION_TOKEN;
if (!TOKEN) {
  console.error('❌  NOTION_TOKEN environment variable is required.');
  console.error('    Run: NOTION_TOKEN=secret_xxx node scripts/export-notion.mjs');
  process.exit(1);
}

const notion = new Client({ auth: TOKEN });

// ── All 32 PouchCare databases ─────────────────────────────────────────────
const DATABASES = {
  // Operations
  tasks:              'cec21e3f-8f74-478a-bc09-4b2c9c857b1a',
  projects:           'eff62166-9410-4003-9e1b-c5ab9967fe79',
  daily_reports:      'de9e86a9-88a3-442b-9b2c-8c1d9897e7ac',

  // HR
  team_members:       '0d134eb5-2331-460e-ab7e-afdd697c5e73',
  attendance:         '4cedf76d-03f7-403a-a741-13a25d63e20e',
  leave_management:   'e02f8aac-51be-4f06-868c-7d5e06e82085',
  performance:        '1a372770-7771-4956-8a8b-f76ffaaa0723',
  job_positions:      'e5ab872c-6b16-4ffd-93b7-9c8ad6b8043f',
  job_applications:   'eb77bfb3-51f1-449b-baf4-5b09c2de745a',
  payroll:            'fa5cd0d7-1dde-449a-adca-b7ff94ecedd6',

  // Company
  branches:           '5ec6f760-e090-494f-b692-cf3a2290c389',
  devices_whitelist:  '6d8d47a8-7ea7-4bd8-bfa3-fcf28f075258',

  // Finance
  invoices:           '68100508-c038-441c-a761-01732b0d9e43',
  expenses:           'f8415671-ef9a-49e7-bc88-f8b3694af6f6',
  monthly_revenue:    'c393fc70-d2ad-48f1-b614-82db2cf3e7ec',
  exchange_rates:     '37a59fee-123e-4e15-a3a7-6c9a58cad153',

  // CRM & Sales
  crm_leads:          'dd16ce93-ed97-4aaa-8746-37d9c2484ecf',
  sales_orders:       '414497b1-2580-43ec-83a9-dd58b4b4b2e8',
  client_accounts:    'a5bf99ca-dc62-47f0-b861-377bde87caf0',

  // Services
  services:           '215a8012-6c04-4fce-8dad-9f2b7bef15e7',
  backlink_packages:  'c0e93afb-d087-4b78-95b9-9f81d2eeaadb',

  // Digital Assets
  domains:            '863421f4-86ca-4215-a33a-bc2aa9f7356a',
  servers:            '340ae730-a281-42cd-a26b-0da94e1daf47',
  websites:           '73a8e615-6c73-4339-80a6-301b1e63fda5',

  // Client Portal
  portal_members:     'dae95cec-4aaa-4768-a077-c2140e088489',
  portal_orders:      '8540857c-12e0-4b86-8947-51b9ffac0099',
  wallet_transactions:'8640ea54-4306-4d05-a86b-82d10640a1a8',
  referrals:          'c29b785c-2a16-42fa-97c6-494dd6f16671',
  commissions:        '596e7b5e-f3cd-4ddb-a591-e04f28358012',
  payout_requests:    'd41dd8e1-7f78-447e-a484-086b572c4826',

  // System
  automations:        'ade0eeca-e148-4abd-9b2a-7bdeca268402',
};

// ── Helper: map Notion property type to our schema format ──────────────────
function extractProp(key, val) {
  const prop = { type: val.type };

  if (val.type === 'select' && val.select?.options) {
    prop.options = val.select.options.map(o => ({ name: o.name, color: o.color }));
  }
  if (val.type === 'multi_select' && val.multi_select?.options) {
    prop.options = val.multi_select.options.map(o => ({ name: o.name, color: o.color }));
  }
  if (val.type === 'status' && val.status?.options) {
    prop.options = val.status.options.map(o => ({ name: o.name, color: o.color }));
    prop.groups  = val.status.groups?.map(g => ({ name: g.name, color: g.color, options: g.option_ids }));
  }
  if (val.type === 'number' && val.number?.format) {
    prop.format = val.number.format;
  }
  if (val.type === 'formula' && val.formula?.expression) {
    prop.expression = val.formula.expression;
  }
  if (val.type === 'relation' && val.relation) {
    prop.database_id = val.relation.database_id;
    prop.type        = val.relation.type;  // single_property or dual_property
  }
  if (val.type === 'rollup' && val.rollup) {
    prop.relation_property_name = val.rollup.relation_property_name;
    prop.rollup_property_name   = val.rollup.rollup_property_name;
    prop.function               = val.rollup.function;
  }

  return prop;
}

// ── Export one database ────────────────────────────────────────────────────
async function exportDatabase(name, dbId) {
  try {
    const db = await notion.databases.retrieve({ database_id: dbId });

    const schema = {};
    for (const [key, val] of Object.entries(db.properties)) {
      schema[key] = extractProp(key, val);
    }

    const output = {
      name:        db.title?.[0]?.plain_text || name,
      key:         name,
      notion_id:   dbId,
      notion_url:  `https://www.notion.so/${dbId.replace(/-/g, '')}`,
      exported_at: new Date().toISOString(),
      property_count: Object.keys(schema).length,
      schema,
    };

    const jsonPath = path.join(OUT_DIR, `${name}.schema.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

    // Also write a quick SQL-style comment file
    const sqlLines = [`-- ${output.name} (${dbId})`, `-- ${Object.keys(schema).length} properties`, ''];
    for (const [col, def] of Object.entries(schema)) {
      const opts = def.options ? `  -- options: ${def.options.map(o => o.name).join(', ')}` : '';
      sqlLines.push(`"${col}"  ${def.type.toUpperCase()}${opts}`);
    }
    const sqlPath = path.join(OUT_DIR, `${name}.schema.sql`);
    fs.writeFileSync(sqlPath, sqlLines.join('\n'));

    console.log(`  ✅  ${name.padEnd(22)} — ${Object.keys(schema).length} columns`);
    return true;
  } catch (err) {
    console.error(`  ❌  ${name.padEnd(22)} — ${err.message}`);
    return false;
  }
}

// ── Generate index file ─────────────────────────────────────────────────────
function generateIndex(results) {
  const lines = [
    '# PouchCare OS — Database Index',
    '',
    `> Auto-generated on ${new Date().toISOString().slice(0,10)}`,
    '> Run `npm run export:notion` to refresh.',
    '',
    '| Key | Name | Columns | Notion |',
    '|-----|------|---------|--------|',
  ];

  for (const r of results) {
    if (r.success) {
      const data = JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${r.key}.schema.json`), 'utf8'));
      lines.push(`| \`${r.key}\` | ${data.name} | ${data.property_count} | [Open](${data.notion_url}) |`);
    } else {
      lines.push(`| \`${r.key}\` | ❌ Export failed | — | — |`);
    }
  }

  lines.push('');
  lines.push('## Schema Files');
  lines.push('- `.schema.json` — Full schema with options and metadata');
  lines.push('- `.schema.sql`  — Quick SQL-style column reference');

  fs.writeFileSync(path.join(OUT_DIR, 'README.md'), lines.join('\n'));
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔄  PouchCare Notion Schema Exporter');
  console.log('━'.repeat(50));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const entries = Object.entries(DATABASES);

  console.log(`\n📦  Exporting ${entries.length} databases...\n`);

  for (const [key, id] of entries) {
    const success = await exportDatabase(key, id);
    results.push({ key, success });
    // Respect Notion API rate limits (3 req/sec)
    await new Promise(r => setTimeout(r, 380));
  }

  generateIndex(results);

  const ok  = results.filter(r => r.success).length;
  const err = results.filter(r => !r.success).length;

  console.log('\n' + '━'.repeat(50));
  console.log(`✅  Done: ${ok} exported, ${err} failed`);
  console.log(`📁  Output: docs/database/`);
  if (err > 0) {
    console.log(`\n⚠️  Some exports failed. Check your NOTION_TOKEN has access to all databases.`);
  }
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
