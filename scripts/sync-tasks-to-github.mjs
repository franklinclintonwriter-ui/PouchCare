#!/usr/bin/env node
/**
 * PouchCare OS — Notion → GitHub Issues Sync
 * Creates GitHub Issues from Notion Build Tracker tasks
 *
 * Usage:
 *   NOTION_TOKEN=secret_xxx GITHUB_TOKEN=ghp_xxx GITHUB_REPO=user/repo \
 *     node scripts/sync-tasks-to-github.mjs
 *
 * Install dependencies first:
 *   npm install @notionhq/client @octokit/rest
 */

import { Client as NotionClient } from '@notionhq/client';
import { Octokit } from '@octokit/rest';

const NOTION_TOKEN  = process.env.NOTION_TOKEN;
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_REPO   = process.env.GITHUB_REPO;  // e.g. "abdullahbabu/pouchcare-os"

// Notion Build Tracker database ID
const BUILD_TRACKER_DB = '2046ddcc-0dcc-4cdc-af18-147320172331';

if (!NOTION_TOKEN || !GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('❌  Missing required environment variables:');
  if (!NOTION_TOKEN)  console.error('    NOTION_TOKEN');
  if (!GITHUB_TOKEN)  console.error('    GITHUB_TOKEN');
  if (!GITHUB_REPO)   console.error('    GITHUB_REPO (e.g. username/pouchcare-os)');
  process.exit(1);
}

const [owner, repo] = GITHUB_REPO.split('/');
if (!owner || !repo) {
  console.error('❌  GITHUB_REPO must be in format: username/repo-name');
  process.exit(1);
}

const notion = new NotionClient({ auth: NOTION_TOKEN });
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ── Phase → GitHub label color ─────────────────────────────────────────────
const PHASE_COLORS = {
  'Phase 0 — Setup & Infra':          '6B7280',
  'Phase 1 — API Core':               '3B82F6',
  'Phase 2 — Landing Site':           '10B981',
  'Phase 3 — Staff Office':           'F59E0B',
  'Phase 4 — Management Portal':      'F97316',
  'Phase 5 — Client Portal':          '8B5CF6',
  'Phase 6 — Polish & Launch':        'EF4444',
};

const APP_COLORS = {
  'API Backend':        '3B82F6',
  'Landing Site':       '10B981',
  'Management Portal':  'F97316',
  'Staff Office':       'F59E0B',
  'Client Portal':      '8B5CF6',
  'Shared Packages':    '6B7280',
  'DevOps / Infra':     '1F2937',
};

const PRIORITY_COLORS = {
  'Critical': 'EF4444',
  'High':     'F97316',
  'Medium':   'F59E0B',
  'Low':      '6B7280',
};

// ── Ensure a GitHub label exists ───────────────────────────────────────────
async function ensureLabel(name, color, description = '') {
  try {
    await octokit.rest.issues.getLabel({ owner, repo, name });
  } catch (e) {
    if (e.status === 404) {
      try {
        await octokit.rest.issues.createLabel({ owner, repo, name, color, description });
        console.log(`  🏷️  Created label: ${name}`);
      } catch (createErr) {
        // Label might already exist from concurrent run
      }
    }
  }
}

// ── Get a text value from Notion property ──────────────────────────────────
function getPropText(prop) {
  if (!prop) return '';
  if (prop.type === 'title')     return prop.title?.map(t => t.plain_text).join('') || '';
  if (prop.type === 'rich_text') return prop.rich_text?.map(t => t.plain_text).join('') || '';
  if (prop.type === 'select')    return prop.select?.name || '';
  if (prop.type === 'number')    return prop.number?.toString() || '';
  return '';
}

// ── Fetch all tasks from Notion Build Tracker ──────────────────────────────
async function fetchNotionTasks() {
  const tasks = [];
  let cursor = undefined;

  do {
    const response = await notion.databases.query({
      database_id: BUILD_TRACKER_DB,
      start_cursor: cursor,
      page_size: 100,
      sorts: [{ property: 'Phase', direction: 'ascending' }],
    });

    for (const page of response.results) {
      const p = page.properties;
      tasks.push({
        id:       page.id,
        url:      page.url,
        name:     getPropText(p['Task Name']),
        phase:    getPropText(p['Phase']),
        app:      getPropText(p['App']),
        status:   getPropText(p['Status']),
        priority: getPropText(p['Priority']),
        hours:    p['Estimated Hours']?.number || 0,
        notes:    getPropText(p['Notes']),
        taskId:   p['Task ID']?.unique_id?.number || 0,
      });
    }

    cursor = response.next_cursor;
  } while (cursor);

  return tasks;
}

// ── Create GitHub Issue from Notion task ──────────────────────────────────
async function createIssue(task) {
  const labels = [];
  if (task.phase)    labels.push(task.phase);
  if (task.app)      labels.push(task.app);
  if (task.priority) labels.push(`priority: ${task.priority}`);

  const body = [
    `**Notion Task:** BLD-${task.taskId}`,
    `**Phase:** ${task.phase}`,
    `**App:** ${task.app}`,
    `**Estimated:** ${task.hours}h`,
    task.notes ? `\n**Notes:** ${task.notes}` : '',
    '',
    `---`,
    `[View in Notion](${task.url})`,
  ].filter(Boolean).join('\n');

  const issue = await octokit.rest.issues.create({
    owner,
    repo,
    title: `[${task.app}] ${task.name}`,
    body,
    labels,
  });

  return issue.data.number;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔄  PouchCare — Syncing Notion Build Tasks → GitHub Issues');
  console.log('━'.repeat(60));
  console.log(`📦  Repo: ${GITHUB_REPO}\n`);

  // Create all labels first
  console.log('🏷️  Setting up GitHub labels...\n');

  for (const [name, color] of Object.entries(PHASE_COLORS)) {
    await ensureLabel(name, color, 'Build phase');
    await new Promise(r => setTimeout(r, 200));
  }
  for (const [name, color] of Object.entries(APP_COLORS)) {
    await ensureLabel(name, color, 'App');
    await new Promise(r => setTimeout(r, 200));
  }
  for (const [p, color] of Object.entries(PRIORITY_COLORS)) {
    await ensureLabel(`priority: ${p}`, color, 'Priority level');
    await new Promise(r => setTimeout(r, 200));
  }

  // Fetch tasks
  console.log('\n📋  Fetching tasks from Notion...');
  const tasks = await fetchNotionTasks();
  console.log(`    Found ${tasks.length} tasks\n`);

  // Create issues
  console.log('🐙  Creating GitHub Issues...\n');
  let created = 0, skipped = 0, failed = 0;

  for (const task of tasks) {
    if (!task.name) { skipped++; continue; }

    try {
      const issueNum = await createIssue(task);
      console.log(`  ✅  #${issueNum.toString().padStart(4)} — ${task.name.slice(0, 55)}`);
      created++;
      // GitHub rate limit: ~30 issues/min
      await new Promise(r => setTimeout(r, 2100));
    } catch (err) {
      console.error(`  ❌  Failed: ${task.name} — ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`✅  Done: ${created} created, ${skipped} skipped, ${failed} failed`);
  console.log(`🔗  View issues: https://github.com/${GITHUB_REPO}/issues`);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
