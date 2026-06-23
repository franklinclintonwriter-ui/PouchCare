#!/usr/bin/env node

/**
 * Validates manifest.json and build output.
 * Run: node scripts/validate-manifest.js
 */

const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.resolve(__dirname, '..', 'manifest.json');
const DIST_PATH = path.resolve(__dirname, '..', 'dist', 'main.js');
const MAX_BUNDLE_SIZE = 500 * 1024; // 500KB

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  WARN: ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  OK: ${msg}`);
}

console.log('\n=== Manifest Validation ===\n');

// 1. Check manifest exists
if (!fs.existsSync(MANIFEST_PATH)) {
  error('manifest.json not found');
  process.exit(1);
}

// 2. Parse manifest
let manifest;
try {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  manifest = JSON.parse(raw);
  ok('manifest.json is valid JSON');
} catch (e) {
  error(`manifest.json parse error: ${e.message}`);
  process.exit(1);
}

// 3. Required fields
const requiredFields = ['name', 'id', 'api', 'main'];
for (const field of requiredFields) {
  if (manifest[field]) {
    ok(`"${field}": "${manifest[field]}"`);
  } else {
    error(`Missing required field: "${field}"`);
  }
}

// 4. Editor type
if (manifest.editorType && Array.isArray(manifest.editorType)) {
  ok(`editorType: [${manifest.editorType.join(', ')}]`);
} else {
  warn('editorType not specified (defaults to figma only)');
}

// 5. Menu commands
if (manifest.menu && Array.isArray(manifest.menu)) {
  const commands = manifest.menu.filter((m) => m.command);
  ok(`Menu commands: ${commands.length} (${commands.map((c) => c.command).join(', ')})`);
} else {
  warn('No menu commands defined');
}

// 6. Network access
if (manifest.networkAccess) {
  ok(`networkAccess: ${JSON.stringify(manifest.networkAccess)}`);
} else {
  warn('networkAccess not specified');
}

console.log('\n=== Build Validation ===\n');

// 7. Check dist/main.js exists
if (fs.existsSync(DIST_PATH)) {
  const stats = fs.statSync(DIST_PATH);
  const sizeKB = (stats.size / 1024).toFixed(1);

  if (stats.size > MAX_BUNDLE_SIZE) {
    error(`Bundle too large: ${sizeKB}KB (max ${MAX_BUNDLE_SIZE / 1024}KB)`);
  } else {
    ok(`dist/main.js: ${sizeKB}KB`);
  }
} else {
  warn('dist/main.js not found (run "npm run build" first)');
}

// 8. Check source map
const mapPath = DIST_PATH + '.map';
if (fs.existsSync(mapPath)) {
  ok('Source map found');
} else {
  warn('No source map (expected for production builds)');
}

console.log('\n=== Summary ===\n');
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Status: ${errors === 0 ? 'PASS' : 'FAIL'}\n`);

process.exit(errors > 0 ? 1 : 0);
