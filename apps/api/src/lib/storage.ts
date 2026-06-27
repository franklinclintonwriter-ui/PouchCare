import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '@/config/env'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

const s3AccessKey = env.S3_ACCESS_KEY || env.S3_ACCESS_KEY_ID
const s3SecretKey = env.S3_SECRET_KEY || env.S3_SECRET_ACCESS_KEY
export const s3Bucket = env.S3_BUCKET
const s3Region = env.S3_REGION
const s3Endpoint = env.S3_ENDPOINT.trim()

/** Cloudflare R2 (S3-compatible): bucket + S3 API keys + account endpoint are all required. */
export const isCloudflareR2Configured = !!(
  s3Bucket &&
  s3AccessKey &&
  s3SecretKey &&
  s3Endpoint
)

const allowLocalDisk =
  env.NODE_ENV !== 'production' && env.STORAGE_LOCAL_FALLBACK === 'true'

/** True when `/uploads` static middleware should be mounted (local disk fallback only). */
export const isLocalUploadFallbackEnabled = allowLocalDisk

const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads')

export const s3Client = isCloudflareR2Configured
  ? new S3Client({
      region: s3Region,
      endpoint: s3Endpoint,
      credentials: {
        accessKeyId: s3AccessKey,
        secretAccessKey: s3SecretKey,
      },
      forcePathStyle: true,
    })
  : null

/** @deprecated use isCloudflareR2Configured */
export const isObjectStorageConfigured = isCloudflareR2Configured

export interface UploadResult {
  fileUrl: string
  thumbnailUrl?: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface UploadOptions {
  folder: string
  allowedTypes?: string[]
  maxSizeMb?: number
}

async function ensureLocalDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch {}
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  options: UploadOptions
): Promise<UploadResult> {
  const { folder, allowedTypes, maxSizeMb = 10 } = options

  if (buffer.length > maxSizeMb * 1024 * 1024) {
    throw new Error(`File size exceeds ${maxSizeMb}MB limit`)
  }

  if (allowedTypes && !allowedTypes.some((t) => mimeType.startsWith(t))) {
    throw new Error(`File type ${mimeType} not allowed`)
  }

  const ext = path.extname(originalName) || getExtFromMime(mimeType)
  const fileName = `${randomUUID()}${ext}`
  const key = `${folder}/${fileName}`

  // Cloudflare R2 (sole object-storage backend; see assertProductionStorageOrExit).
  if (isCloudflareR2Configured && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    )

    // Private bucket — persist the object key; serve via getSignedDownloadUrl.
    const fileUrl = key

    return {
      fileUrl,
      fileName,
      fileSize: buffer.length,
      mimeType,
    }
  }

  if (!allowLocalDisk) {
    throw new Error(
      'Object storage is not configured. Set S3_BUCKET, S3_ENDPOINT (R2 URL), S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY ' +
        'for Cloudflare R2, or for local dev only set STORAGE_LOCAL_FALLBACK=true in .env'
    )
  }

  const localDir = path.join(LOCAL_UPLOADS_DIR, folder)
  await ensureLocalDir(localDir)
  const localPath = path.join(localDir, fileName)
  await fs.writeFile(localPath, buffer)

  const fileUrl = `${env.API_URL.replace(/\/$/, '')}/uploads/${folder}/${fileName}`

  return {
    fileUrl,
    fileName,
    fileSize: buffer.length,
    mimeType,
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (fileUrl.includes('/uploads/')) {
    const relativePath = fileUrl.split('/uploads/')[1]
    if (relativePath) {
      const localPath = path.join(LOCAL_UPLOADS_DIR, relativePath)
      try {
        await fs.unlink(localPath)
      } catch {}
    }
    return
  }

  if (isCloudflareR2Configured && s3Client) {
    const key = resolveR2ObjectKey(fileUrl)
    if (key) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3Bucket,
          Key: key,
        })
      )
    }
  }
}

export async function getSignedDownloadUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
  if (!isCloudflareR2Configured || !s3Client) {
    return fileUrl
  }

  const key = resolveR2ObjectKey(fileUrl)
  if (!key) return fileUrl

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: s3Bucket,
      Key: key,
    }),
    { expiresIn }
  )
}

/** Resolve a stored file reference (object key or legacy R2 URL) to an R2 object key. */
function resolveR2ObjectKey(fileUrl: string): string | null {
  if (!fileUrl) return null
  if (fileUrl.includes('/uploads/')) return null
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    if (!isR2FileUrl(fileUrl)) return null
    return extractS3Key(fileUrl)
  }
  return fileUrl
}

function isR2FileUrl(fileUrl: string): boolean {
  if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) return true
  if (fileUrl.includes('/uploads/')) return false
  if (s3Bucket && fileUrl.includes(s3Bucket)) return true
  const endpoint = s3Endpoint.replace(/\/$/, '')
  return !!endpoint && fileUrl.startsWith(endpoint)
}

/** Sign a stored avatar reference for client-facing responses. */
export async function mapSignedAvatar<T extends { avatarUrl?: string | null }>(row: T): Promise<T> {
  if (!row.avatarUrl) return row
  return { ...row, avatarUrl: await getSignedDownloadUrl(row.avatarUrl) }
}

function extractS3Key(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (pathParts[0] === s3Bucket) {
      return pathParts.slice(1).join('/')
    }
    return pathParts.join('/')
  } catch {
    return null
  }
}

function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  }
  return map[mimeType] || ''
}

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const DOCUMENT_CATEGORIES = ['identity', 'education', 'employment', 'medical', 'other'] as const
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]

export const DOCUMENT_TYPES = {
  identity: ['passport', 'nid', 'driving_license', 'birth_certificate', 'voter_id'],
  education: ['degree', 'certificate', 'transcript', 'diploma'],
  employment: ['cv', 'resume', 'contract', 'offer_letter', 'experience_letter', 'reference_letter'],
  medical: ['medical_certificate', 'fitness_certificate', 'vaccination_record'],
  other: ['other'],
} as const

/** Call once at process startup. Production must use Cloudflare R2 only. */
export function assertProductionStorageOrExit(): void {
  if (env.NODE_ENV !== 'production') return
  if (env.STORAGE_LOCAL_FALLBACK === 'true') {
    console.error('❌ STORAGE_LOCAL_FALLBACK cannot be enabled in production.')
    process.exit(1)
  }
  if (!isCloudflareR2Configured) {
    console.error(
      '❌ Production requires Cloudflare R2. Set S3_BUCKET, S3_ENDPOINT (https://<id>.r2.cloudflarestorage.com), ' +
        'and S3 API credentials (S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY or S3_ACCESS_KEY + S3_SECRET_KEY).'
    )
    process.exit(1)
  }
}
