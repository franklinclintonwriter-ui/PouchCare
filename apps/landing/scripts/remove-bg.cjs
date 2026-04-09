const path = require('path');
const src = path.join(__dirname, '../public/pouchcare-logo-main.png');
const dst = path.join(__dirname, '../public/pouchcare-logo-nobg.png');

// Use the pure-JS PNG decoder (no jimp needed)
const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync(src);
const png = PNG.sync.read(data);

const THRESHOLD = 80; // pixels where R+G+B < 80 become transparent

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    if (r + g + b < THRESHOLD) {
      png.data[idx + 3] = 0; // transparent
    }
  }
}

const out = PNG.sync.write(png);
fs.writeFileSync(dst, out);
console.log('Done →', dst);
