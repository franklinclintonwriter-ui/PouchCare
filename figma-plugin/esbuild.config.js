const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/main.js',
  format: 'iife',
  target: 'es2022',
  platform: 'browser',
  sourcemap: isWatch ? 'inline' : true,
  minify: !isWatch,
  treeShaking: true,
  loader: {
    '.html': 'text',
  },
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

async function build() {
  // Ensure dist directory exists
  const distDir = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    const result = await esbuild.build(buildOptions);

    // Report bundle size
    const outPath = path.resolve(__dirname, buildOptions.outfile);
    if (fs.existsSync(outPath)) {
      const stats = fs.statSync(outPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`Bundle size: ${sizeKB} KB`);
      if (stats.size > 500 * 1024) {
        console.warn('WARNING: Bundle exceeds 500KB limit!');
      }
    }

    if (result.errors.length > 0) {
      console.error('Build failed:', result.errors);
      process.exit(1);
    }
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
