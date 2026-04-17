#!/usr/bin/env node
/**
 * Feature-flag rollout helper — Phase 5 staged-launch plan.
 *
 * Flips VITE_ADMIN_ENABLED in apps/management/.env files so the Admin Panel
 * can be enabled per environment without a code change. Uses a dated stage
 * label so the current stage is inspectable at `npm run flag:status`.
 *
 * Usage:
 *   node scripts/flag-rollout.mjs status [--env=production] [--json]
 *   node scripts/flag-rollout.mjs set --env=production --stage=owner-only [--dry-run] [--json]
 *
 * Global flags (--json, --help, --dry-run, --version) may appear before or after the subcommand.
 *
 * The flag itself is a boolean (VITE_ADMIN_ENABLED=true|false) consumed
 * at bootstrap in apps/management/src/main.tsx. Finer-grained role gating
 * already runs server-side via RBAC permission keys, so this flag acts as
 * the kill-switch + top-level rollout lever.
 *
 * The "stage" column is stored in a parallel env var (ADMIN_FLAG_STAGE) so
 * operators can trace when/why the flag was flipped from the deployed env.
 *
 * Exit codes: 0 success, 1 unknown/missing args, 2 bad --env, 3 bad --stage, 4 missing .env file (set)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const repoRoot = join(__filename, '..', '..')
const ENVS = ['development', 'staging', 'production']
const STAGES = ['off', 'owner-only', 'managers', 'all-staff']

/** @enum {number} */
const EXIT = {
  SUCCESS: 0,
  BAD_CMD_OR_ARGS: 1,
  BAD_ENV: 2,
  BAD_STAGE: 3,
  MISSING_FILE: 4,
}

function readPackageVersion() {
  try {
    const raw = readFileSync(join(repoRoot, 'package.json'), 'utf8')
    const v = JSON.parse(raw).version
    return typeof v === 'string' ? v : '0.0.0'
  } catch {
    return 'unknown'
  }
}

/** Repo-relative path with forward slashes (stable in JSON on all OSes). */
function posixPath(p) {
  return p.replace(/\\/g, '/')
}

function envFilePath(env) {
  return join(repoRoot, 'apps', 'management', `.env.${env}`)
}

/**
 * Parse argv: subcommand may appear before or after global flags.
 * @param {string[]} argv
 * @returns {{ cmd: string | null, opts: Record<string, string | boolean>, error?: string }}
 */
function parseCliArgv(argv) {
  /** @type {Record<string, string | boolean>} */
  const opts = {}
  let cmd = null
  for (const a of argv) {
    if (a === '--json') {
      opts.json = true
      continue
    }
    if (a === '--help') {
      opts.help = true
      continue
    }
    if (a === '--dry-run') {
      opts.dryRun = true
      continue
    }
    if (a === '--version') {
      opts.version = true
      continue
    }
    if (a.startsWith('--')) {
      const [k, v] = a.slice(2).split('=')
      if (k) opts[k] = v ?? true
      continue
    }
    if (a === 'status' || a === 'set') {
      if (cmd !== null && cmd !== a) {
        return {
          cmd: null,
          opts,
          error: `Conflicting commands: ${cmd} and ${a}`,
        }
      }
      cmd = a
      continue
    }
    return { cmd: null, opts, error: `Unexpected argument: ${a}` }
  }
  return { cmd, opts }
}

function readEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
    if (m) out[m[1]] = m[2]
  }
  return out
}

function writeEnvFile(path, current, patch) {
  const merged = { ...current, ...patch }
  const body =
    Object.entries(merged)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n') + '\n'
  writeFileSync(path, body)
}

/**
 * @param {number} code
 * @param {string} message
 * @param {boolean} useJson
 */
function fail(code, message, useJson) {
  if (useJson) {
    console.log(JSON.stringify({ ok: false, error: message, code }))
  } else {
    console.error(message)
  }
  process.exit(code)
}

function printHelp() {
  console.log(`flag-rollout — feature-flag rollout helper

Commands:
  status  Show current flag state per environment
  set     Update flag for one environment

Usage examples:
  npm run flag:status
  npm run flag:status -- --env=production --json
  node scripts/flag-rollout.mjs --json status
  npm run flag:set -- --env=staging --stage=managers --dry-run
  npm run flag:set -- --env=production --stage=all-staff --json

Options:
  --env=ENV       Target environment (development | staging | production)
  --stage=STAGE   Rollout stage (off | owner-only | managers | all-staff)
  --json          Emit machine-readable JSON instead of a table
  --dry-run       Preview changes without writing (set only)
  --help          Show this help
  --version       Print CLI version (from repo root package.json)

Exit codes:
  0  Success
  1  Unknown command or missing required arguments
  2  Invalid --env value
  3  Invalid --stage value
  4  Target apps/management/.env.<env> missing (set only)`)
}

/**
 * @param {string | undefined} envArg
 * @param {boolean} useJson
 */
function cmdStatus(envArg, useJson) {
  if (envArg && !ENVS.includes(envArg)) {
    fail(
      EXIT.BAD_ENV,
      `--env must be one of: ${ENVS.join(', ')}`,
      useJson,
    )
  }
  const targets = envArg ? [envArg] : ENVS
  /** @type {Array<Record<string, unknown>>} */
  const environments = []
  for (const env of targets) {
    const path = envFilePath(env)
    if (!existsSync(path)) {
      environments.push({ env, missing: true })
      continue
    }
    const vars = readEnvFile(path)
    const enabledStr = String(vars.VITE_ADMIN_ENABLED ?? 'false').toLowerCase()
    const enabled = enabledStr === 'true' || enabledStr === '1'
    environments.push({
      env,
      missing: false,
      enabled,
      stage: String(vars.ADMIN_FLAG_STAGE ?? 'off'),
      updatedAt: vars.ADMIN_FLAG_UPDATED_AT ?? null,
    })
  }
  if (useJson) {
    console.log(JSON.stringify({ ok: true, environments }))
    return
  }
  console.log('env'.padEnd(14) + 'enabled'.padEnd(10) + 'stage'.padEnd(16) + 'updatedAt')
  console.log('-'.repeat(60))
  for (const row of environments) {
    if (row.missing) {
      console.log(String(row.env).padEnd(14) + '(missing)')
      continue
    }
    console.log(
      String(row.env).padEnd(14) +
        String(row.enabled).padEnd(10) +
        String(row.stage).padEnd(16) +
        (row.updatedAt ?? '—'),
    )
  }
}

/**
 * @param {Record<string, string | boolean>} opts
 */
function cmdSet(opts) {
  const useJson = Boolean(opts.json)
  const dryRun = Boolean(opts.dryRun)
  const env = opts.env
  const stage = opts.stage
  if (typeof env !== 'string' || !env) {
    fail(
      EXIT.BAD_CMD_OR_ARGS,
      'set requires --env=ENV and --stage=STAGE',
      useJson,
    )
  }
  if (typeof stage !== 'string' || !stage) {
    fail(
      EXIT.BAD_CMD_OR_ARGS,
      'set requires --env=ENV and --stage=STAGE',
      useJson,
    )
  }
  if (!ENVS.includes(env)) {
    fail(EXIT.BAD_ENV, `--env must be one of: ${ENVS.join(', ')}`, useJson)
  }
  if (!STAGES.includes(stage)) {
    fail(
      EXIT.BAD_STAGE,
      `--stage must be one of: ${STAGES.join(', ')}`,
      useJson,
    )
  }
  const path = envFilePath(env)
  const fileExists = existsSync(path)
  const relPath = posixPath(relative(repoRoot, path))
  if (!dryRun && !fileExists) {
    fail(
      EXIT.MISSING_FILE,
      `Missing env file: ${relPath} (create it before using set)`,
      useJson,
    )
  }
  const current = readEnvFile(path)
  const patch = {
    VITE_ADMIN_ENABLED: stage === 'off' ? 'false' : 'true',
    ADMIN_FLAG_STAGE: stage,
    ADMIN_FLAG_UPDATED_AT: new Date().toISOString(),
  }
  if (dryRun) {
    if (useJson) {
      console.log(
        JSON.stringify({
          ok: true,
          dryRun: true,
          env,
          stage,
          enabled: patch.VITE_ADMIN_ENABLED === 'true',
          file: relPath,
          fileExists,
          patch,
        }),
      )
    } else {
      console.log(`[dry-run] Would set ${env} → VITE_ADMIN_ENABLED=${patch.VITE_ADMIN_ENABLED}, stage=${stage}`)
      console.log(`[dry-run] Would merge into ${relPath}`)
      if (!fileExists) {
        console.log(
          '[dry-run] File does not exist yet — create it first; `set` without --dry-run exits with code 4 until it exists.',
        )
      }
      console.log(`[dry-run] Patch keys: ${Object.keys(patch).join(', ')}`)
    }
    return
  }
  writeEnvFile(path, current, patch)
  if (useJson) {
    console.log(
      JSON.stringify({
        ok: true,
        env,
        stage,
        enabled: patch.VITE_ADMIN_ENABLED === 'true',
        file: relPath,
      }),
    )
    return
  }
  console.log(`Set ${env} → VITE_ADMIN_ENABLED=${patch.VITE_ADMIN_ENABLED}, stage=${stage}`)
  console.log(`Written to ${relPath}`)
  console.log('\nNext steps:')
  console.log(`  1. Deploy apps/management (Cloudflare)`)
  console.log(`  2. Verify in browser: sidebar shows "Admin Panel" for appropriate roles`)
  console.log(`  3. Record this change in #ops and in the launch log`)
}

const argv = process.argv.slice(2)

if (argv.length === 0) {
  printHelp()
  process.exit(EXIT.SUCCESS)
}

const parsed = parseCliArgv(argv)
const { cmd, opts, error: parseError } = parsed
const useJson = Boolean(opts.json) || argv.includes('--json')

if (parseError) {
  if (useJson) {
    console.log(
      JSON.stringify({
        ok: false,
        error: parseError,
        code: EXIT.BAD_CMD_OR_ARGS,
      }),
    )
  } else {
    console.error(parseError)
    printHelp()
  }
  process.exit(EXIT.BAD_CMD_OR_ARGS)
}

if (opts.version) {
  console.log(`flag-rollout ${readPackageVersion()}`)
  process.exit(EXIT.SUCCESS)
}

if (opts.help) {
  printHelp()
  process.exit(EXIT.SUCCESS)
}

if (!cmd) {
  fail(
    EXIT.BAD_CMD_OR_ARGS,
    'Specify a command: status | set',
    useJson,
  )
}

switch (cmd) {
  case 'status':
    cmdStatus(typeof opts.env === 'string' ? opts.env : undefined, useJson)
    break
  case 'set':
    cmdSet(opts)
    break
}
