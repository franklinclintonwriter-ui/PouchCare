/**
 * Verifies Cloudflare R2 (S3-compatible) credentials and bucket access.
 * Run from apps/api: `npm run test:r2`
 * Requires in .env: S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY (or S3_ACCESS_KEY + S3_SECRET_KEY).
 */
import dotenv from 'dotenv'
import path from 'path'
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

async function main() {
  const bucket = process.env.S3_BUCKET?.trim()
  const endpoint = process.env.S3_ENDPOINT?.trim()
  const accessKey = process.env.S3_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID
  const secretKey = process.env.S3_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY
  const region = process.env.S3_REGION?.trim() || 'auto'

  if (!bucket || !endpoint || !accessKey?.trim() || !secretKey?.trim()) {
    console.error(
      'Configure R2 in apps/api/.env: S3_BUCKET, S3_ENDPOINT (https://….r2.cloudflarestorage.com), ' +
        'S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (or S3_ACCESS_KEY / S3_SECRET_KEY).'
    )
    process.exit(1)
  }

  const client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: accessKey.trim(),
      secretAccessKey: secretKey.trim(),
    },
    forcePathStyle: true,
  })

  console.log(`Endpoint: ${endpoint}`)
  console.log(`Bucket:   ${bucket}`)
  console.log('')

  process.stdout.write('HeadBucket… ')
  await client.send(new HeadBucketCommand({ Bucket: bucket }))
  console.log('ok')

  const key = `__pouchcare-healthcheck/${randomUUID()}.txt`
  const payload = `pouchcare-r2-test-${Date.now()}`

  process.stdout.write('PutObject… ')
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(payload, 'utf8'),
      ContentType: 'text/plain; charset=utf-8',
    })
  )
  console.log('ok')

  process.stdout.write('GetObject… ')
  const got = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  const body = await got.Body?.transformToString()
  if (body !== payload) {
    throw new Error(`GetObject body mismatch (expected ${payload.length} chars)`)
  }
  console.log('ok')

  process.stdout.write('DeleteObject… ')
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  console.log('ok')

  console.log('\nCloudflare R2 connection test passed.')
}

main().catch((err: unknown) => {
  console.error('\nR2 test failed:', err instanceof Error ? err.message : err)
  if (err && typeof err === 'object' && '$metadata' in err) {
    console.error(JSON.stringify((err as { $metadata?: unknown }).$metadata, null, 2))
  }
  process.exit(1)
})
