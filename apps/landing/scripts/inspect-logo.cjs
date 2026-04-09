const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const src = path.join(__dirname, '../public/pouchcare-logo-main.png');
const data = fs.readFileSync(src);
const png = PNG.sync.read(data);

console.log(`Size: ${png.width}x${png.height}`);

// Sample some pixels from different areas
const samples = [];
const step = Math.floor(png.width / 10);
for (let x = 0; x < png.width; x += step) {
  for (let y = 0; y < png.height; y += Math.floor(png.height / 10)) {
    const idx = (png.width * y + x) * 4;
    const r = png.data[idx], g = png.data[idx+1], b = png.data[idx+2], a = png.data[idx+3];
    if (r + g + b > 30) { // only non-black
      samples.push(`(${x},${y}) R:${r} G:${g} B:${b} A:${a}`);
    }
  }
}
console.log('Non-black pixels sampled:');
samples.slice(0, 20).forEach(s => console.log(s));
