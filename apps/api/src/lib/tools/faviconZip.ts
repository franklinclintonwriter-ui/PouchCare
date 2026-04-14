import archiver from 'archiver'
import { PassThrough } from 'stream'
import { buffer as streamToBuffer } from 'node:stream/consumers'
// Lazy-load sharp so the server can start even when the native binary is unavailable
const getSharp = async () => (await import('sharp')).default

const SIZES = [16, 32, 48, 180] as const

/**
 * Build a ZIP of PNG favicons at standard sizes from an uploaded raster image.
 */
export async function buildFaviconZipFromBuffer(input: Buffer): Promise<Buffer> {
  const sharp = await getSharp()
  await sharp(input).metadata()
  const pass = new PassThrough()
  const archive = archiver('zip', { zlib: { level: 9 } })
  archive.on('error', (err: Error) => pass.destroy(err))
  archive.pipe(pass)

  const out = streamToBuffer(pass)

  for (const s of SIZES) {
    const png = await sharp(input)
      .resize(s, s, { fit: 'cover', position: sharp.strategy.attention })
      .png()
      .toBuffer()
    archive.append(png, { name: `favicon-${s}x${s}.png` })
  }

  await archive.finalize()
  return out
}
