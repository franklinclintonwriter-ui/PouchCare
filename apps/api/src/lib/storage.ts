import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { config } from '@/config'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

const USE_S3 = !!(config.s3Bucket && config.s3AccessKey && config.s3SecretKey)
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads')

const s3Client = USE_S3
  ? new S3Client({
      region: config.s3Region,
      endpoint: config.s3Endpoint || undefined,
      credentials: {
        accessKeyId: config.s3AccessKey,
        secretAccessKey: config.s3SecretKey,
      },
      forcePathStyle: !!config.s3Endpoint,
    })
  : null

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

  if (USE_S3 && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    )

    const fileUrl = config.s3Endpoint
      ? `${config.s3Endpoint}/${config.s3Bucket}/${key}`
      : `https://${config.s3Bucket}.s3.${config.s3Region}.amazonaws.com/${key}`

    return {
      fileUrl,
      fileName,
      fileSize: buffer.length,
      mimeType,
    }
  }

  const localDir = path.join(LOCAL_UPLOADS_DIR, folder)
  await ensureLocalDir(localDir)
  const localPath = path.join(localDir, fileName)
  await fs.writeFile(localPath, buffer)

  const fileUrl = `${config.apiUrl}/uploads/${folder}/${fileName}`

  return {
    fileUrl,
    fileName,
    fileSize: buffer.length,
    mimeType,
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (USE_S3 && s3Client && fileUrl.includes(config.s3Bucket)) {
    const key = extractS3Key(fileUrl)
    if (key) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: config.s3Bucket,
          Key: key,
        })
      )
    }
  } else if (fileUrl.includes('/uploads/')) {
    const relativePath = fileUrl.split('/uploads/')[1]
    if (relativePath) {
      const localPath = path.join(LOCAL_UPLOADS_DIR, relativePath)
      try {
        await fs.unlink(localPath)
      } catch {}
    }
  }
}

export async function getSignedDownloadUrl(fileUrl: string, expiresIn = 3600): Promise<string> {
  if (!USE_S3 || !s3Client || !fileUrl.includes(config.s3Bucket)) {
    return fileUrl
  }

  const key = extractS3Key(fileUrl)
  if (!key) return fileUrl

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
    }),
    { expiresIn }
  )
}

function extractS3Key(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/').filter(Boolean)
    if (config.s3Endpoint) {
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
