import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcImage = path.resolve(
  process.env.USERPROFILE,
  "Desktop",
  "pouchcare.png",
);

async function run() {
  console.log("Source image:", srcImage);

  // Read original image metadata
  const meta = await sharp(srcImage).metadata();
  console.log(`Original: ${meta.width}x${meta.height}, format: ${meta.format}`);

  // Trim transparent pixels to crop to just the icon
  const trimmed = sharp(srcImage).trim();
  const trimmedBuf = await trimmed.toBuffer();
  const trimmedMeta = await sharp(trimmedBuf).metadata();
  console.log(`After trim: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // Make it square (use the larger dimension)
  const size = Math.max(trimmedMeta.width, trimmedMeta.height);
  const squareBuf = await sharp(trimmedBuf)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Generate favicon sizes
  const sizes = [16, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512];

  // --- Landing app ---
  const landingPublic = path.join(rootDir, "apps", "landing", "public");
  for (const s of sizes) {
    const outPath = path.join(landingPublic, `favicon-${s}x${s}.png`);
    await sharp(squareBuf)
      .resize(s, s, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(outPath);
    console.log(`  Created: favicon-${s}x${s}.png`);
  }

  // Also save the 512 as the main favicon
  await sharp(squareBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(landingPublic, "pouchcare-favicon-512.png"));
  console.log("  Updated: pouchcare-favicon-512.png");

  // Save a 32x32 ICO-compatible PNG as favicon.ico workaround (browsers accept PNG)
  const ico32 = await sharp(squareBuf).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(landingPublic, "favicon.ico"), ico32);
  console.log("  Created: favicon.ico (32x32 PNG)");

  // --- Management app ---
  const mgmtDir = path.join(rootDir, "apps", "management");
  // Save favicon.svg replacement as PNG
  await sharp(squareBuf)
    .resize(32, 32)
    .png()
    .toFile(path.join(mgmtDir, "favicon.png"));
  await sharp(squareBuf)
    .resize(192, 192)
    .png()
    .toFile(path.join(mgmtDir, "favicon-192x192.png"));
  await sharp(squareBuf)
    .resize(512, 512)
    .png()
    .toFile(path.join(mgmtDir, "favicon-512x512.png"));
  fs.writeFileSync(path.join(mgmtDir, "favicon.ico"), ico32);
  console.log("  Management favicons created");

  console.log("\nDone! Favicons generated for landing + management.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
