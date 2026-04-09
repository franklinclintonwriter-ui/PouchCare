import Jimp from 'jimp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '../public/pouchcare-logo-main.png');
const dst = join(__dirname, '../public/pouchcare-logo-nobg.png');

const img = await Jimp.read(src);

// Threshold: any pixel where R+G+B < 90 (near black) becomes transparent
const THRESHOLD = 90;

img.scan(0, 0, img.bitmap.width, img.bitmap.height, function (x, y, idx) {
  const r = this.bitmap.data[idx + 0];
  const g = this.bitmap.data[idx + 1];
  const b = this.bitmap.data[idx + 2];
  if (r + g + b < THRESHOLD) {
    this.bitmap.data[idx + 3] = 0; // set alpha to 0 (transparent)
  }
});

await img.writeAsync(dst);
console.log('Done → pouchcare-logo-nobg.png');
