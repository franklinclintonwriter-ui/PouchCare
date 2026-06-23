#!/usr/bin/env node

/**
 * Helper script for importing the plugin into Figma Desktop.
 * Checks for Figma Desktop process and provides manual instructions.
 *
 * Run: node scripts/import-plugin.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const MANIFEST_PATH = path.resolve(__dirname, '..', 'manifest.json');
const DIST_PATH = path.resolve(__dirname, '..', 'dist', 'main.js');

console.log('\n=== Figma Plugin Import Helper ===\n');

// Check manifest exists
if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('ERROR: manifest.json not found. Run from the figma-plugin directory.');
  process.exit(1);
}

// Check build exists
if (!fs.existsSync(DIST_PATH)) {
  console.log('Build not found. Building now...\n');
  try {
    execSync('npm run build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
  } catch {
    console.error('Build failed. Fix errors and try again.');
    process.exit(1);
  }
}

// Check for Figma Desktop process
function isFigmaRunning() {
  try {
    const platform = process.platform;
    if (platform === 'darwin') {
      const result = execSync('pgrep -x "Figma"', { encoding: 'utf8' });
      return result.trim().length > 0;
    } else if (platform === 'win32') {
      const result = execSync('tasklist /FI "IMAGENAME eq Figma.exe" /NH', {
        encoding: 'utf8',
      });
      return result.includes('Figma.exe');
    } else {
      // Linux
      const result = execSync('pgrep -x figma || pgrep -x figma-linux || true', {
        encoding: 'utf8',
      });
      return result.trim().length > 0;
    }
  } catch {
    return false;
  }
}

const figmaRunning = isFigmaRunning();

if (figmaRunning) {
  console.log('Figma Desktop detected.\n');
} else {
  console.log('Figma Desktop not detected. Please open Figma Desktop first.\n');
}

console.log('To import the plugin:\n');
console.log('  1. Open Figma Desktop');
console.log('  2. Go to: Plugins > Development > Import plugin from manifest...');
console.log(`  3. Navigate to: ${MANIFEST_PATH}`);
console.log('  4. Click "Open"');
console.log('');
console.log('To run the plugin:');
console.log('  1. Open a Figma file');
console.log('  2. Go to: Plugins > Development > Design System Bootstrapper');
console.log('  3. Or use the menu commands directly');
console.log('');
console.log('For development with auto-reload:');
console.log('  1. Run: npm run dev');
console.log('  2. Make code changes');
console.log('  3. Re-run the plugin in Figma (changes apply automatically)');
console.log('');
console.log(`Manifest: ${MANIFEST_PATH}`);
console.log(`Bundle: ${DIST_PATH}`);
console.log('');
