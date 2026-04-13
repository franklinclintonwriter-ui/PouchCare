/**
 * Lists R2 buckets (or creates `pouchcare-uploads`), updates apps/api/.env S3_BUCKET if still a placeholder,
 * then runs HeadBucket + Put/Get/Delete smoke test.
 *
 * Usage (from apps/api): npm run test:r2:setup
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'

const apiRoot = path.join(__dirname, '..')
dotenv.config({ path: path.join(apiRoot, '.env') })

const DEFAULT_BUCKET = 'pouchcare-uploads'
const PLACEHOLDERS = new Set(['', 'your-bucket-name', 'change-me', 'my-bucket'])

function buildClient() {
  const endpoint = process.env.S3_ENDPOINT?.trim()
  const accessKey = process.env.S3_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID
  const secretKey = process.env.S3_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY
  const region = process.env.S3_REGION?.trim() || 'auto'

  if (!endpoint || !accessKey?.trim() || !secretKey?.trim()) {
    throw new Error(
      'Missing S3_ENDPOINT or S3 API credentials. Set them in apps/api/.env (see .env.example).'
    )
  }

  return new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: accessKey.trim(),
      secretAccessKey: secretKey.trim(),
    },
    forcePathStyle: true,
  })
}

async function ensureBucket(client: S3Client): Promise<string> {
  let want = process.env.S3_BUCKET?.trim() ?? ''
  if (!PLACEHOLDERS.has(want.toLowerCase())) {
    return want
  }

  console.log('Resolving bucket (placeholder or empty)…')
  const listed = await client.send(new ListBucketsCommand({}))
  const names = (listed.Buckets ?? [])
    .map((b) => b.Name)
    .filter((n): n is string => !!n)

  if (names.length > 0) {
    const pick = names.includes(DEFAULT_BUCKET) ? DEFAULT_BUCKET : names.sort()[0]
    console.log(`Using existing bucket: ${pick}`)
    return pick
  }

  console.log(`No buckets found. Creating "${DEFAULT_BUCKET}"…`)
  try {
    await client.send(new CreateBucketCommand({ Bucket: DEFAULT_BUCKET }))
    console.log(`Created bucket: ${DEFAULT_BUCKET}`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('BucketAlreadyOwnedByYou') || msg.includes('409')) {
      console.log(`Bucket "${DEFAULT_BUCKET}" already exists.`)
    } else {
      throw e
    }
  }
  return DEFAULT_BUCKET
}

function patchEnvFile(bucket: string) {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.warn('No .env file to patch; set S3_BUCKET manually.')
    return
  }
  let raw = fs.readFileSync(envPath, 'utf8')
  const line = /^S3_BUCKET=.*$/m
  if (!line.test(raw)) {
    raw += `\nS3_BUCKET=${bucket}\n`
    fs.writeFileSync(envPath, raw, 'utf8')
    console.log(`Appended S3_BUCKET=${bucket} to .env`)
    return
  }
  raw = raw.replace(line, `S3_BUCKET=${bucket}`)
  fs.writeFileSync(envPath, raw, 'utf8')
  console.log(`Updated .env: S3_BUCKET=${bucket}`)
  process.env.S3_BUCKET = bucket
}

async function smokeTest(client: S3Client, bucket: string) {
  console.log('')
  console.log(`Endpoint: ${process.env.S3_ENDPOINT?.trim()}`)
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
    throw new Error('GetObject body mismatch')
  }
  console.log('ok')

  process.stdout.write('DeleteObject… ')
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  console.log('ok')

  console.log('\nCloudflare R2 is connected and working.')
}

async function main() {
  const client = buildClient()
  const bucket = await ensureBucket(client)

  const current = process.env.S3_BUCKET?.trim() ?? ''
  if (PLACEHOLDERS.has(current.toLowerCase()) || current !== bucket) {
    patchEnvFile(bucket)
  }

  await smokeTest(client, bucket)
}

main().catch((err: unknown) => {
  console.error('\nR2 setup/test failed:', err instanceof Error ? err.message : err)
  if (err && typeof err === 'object' && '$metadata' in err) {
    console.error(JSON.stringify((err as { $metadata?: unknown }).$metadata, null, 2))
  }
  process.exit(1)
})
