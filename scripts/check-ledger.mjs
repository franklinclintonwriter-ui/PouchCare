#!/usr/bin/env node
/**
 * Enterprise ledger guard.
 *
 * A merge request that changes application/package code must also update the
 * living progress ledger (`docs/PROGRESS.md`) — that file is how any session/agent
 * resumes the multi-PR enterprise rollout without losing context. Wired into
 * GitLab CI as the `quality:ledger` job (merge requests only).
 */
import { execSync } from 'node:child_process';

const target = process.env.CI_MERGE_REQUEST_TARGET_BRANCH_NAME || 'main';

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

let base;
try {
  base = sh(`git merge-base origin/${target} HEAD`);
} catch {
  base = `origin/${target}`;
}

const changed = sh(`git diff --name-only ${base} HEAD`)
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

const touchedCode = changed.some((f) => /^(apps|packages)\/.*\.(ts|tsx|js|jsx)$/.test(f));
const touchedLedger = changed.includes('docs/PROGRESS.md');

if (touchedCode && !touchedLedger) {
  console.error('✗ Ledger guard: code changed but docs/PROGRESS.md was not updated.');
  console.error("  Flip this PR's line and refresh the CURRENT STATE / RESUME HERE block in docs/PROGRESS.md.");
  process.exit(1);
}

console.log('✓ Ledger guard: ok');
