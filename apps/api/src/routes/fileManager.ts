import { Router } from 'express'
import multer from 'multer'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { ok, badRequest, serverError } from '@/lib/response'
import {
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, s3Bucket } from '@/lib/storage'

const router = Router()
router.use(authenticate, requireStaff)

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// Per-user key namespace inside the R2 bucket (S3 has no folders — prefixes only).
function userPrefix(userId: string) {
  return `users/${userId}`
}

// CopySource must be `bucket/key` with each path segment URL-encoded (slashes preserved).
function encodeCopySource(bucket: string, key: string) {
  return `${bucket}/${key}`.split('/').map(encodeURIComponent).join('/')
}

function mimeIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf: 'pdf', doc: 'doc', docx: 'doc', xls: 'xls', xlsx: 'xls', ppt: 'ppt', pptx: 'ppt',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
    mp4: 'video', mov: 'video', avi: 'video', webm: 'video',
    mp3: 'audio', wav: 'audio', ogg: 'audio',
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
    js: 'code', ts: 'code', py: 'code', html: 'code', css: 'code', json: 'code',
    txt: 'text', md: 'text', csv: 'text',
  }
  return map[ext] ?? 'file'
}

// GET /files — list files and folders for current user
router.get('/files', async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return serverError(res, new Error('Object storage (R2) is not configured'))

    const prefix = ((req.query.path as string) || '').replace(/^\/+|\/+$/g, '')
    const base = `${userPrefix(req.user!.id)}/`
    const fullPrefix = prefix ? `${base}${prefix}/` : base

    const out = await s3Client.send(
      new ListObjectsV2Command({ Bucket: s3Bucket, Prefix: fullPrefix, Delimiter: '/' })
    )

    const folders = (out.CommonPrefixes ?? [])
      .map((cp) => (cp.Prefix ?? '').slice(fullPrefix.length).replace(/\/$/, ''))
      .filter((name) => name.length > 0)
      .map((name) => ({
        name,
        path: prefix ? `${prefix}/${name}` : name,
        isFolder: true,
        size: 0,
        mimeType: null as string | null,
        icon: 'folder',
        updatedAt: null as string | null,
      }))

    const files = (out.Contents ?? [])
      .map((o) => ({ key: o.Key ?? '', size: o.Size ?? 0, updatedAt: o.LastModified?.toISOString() ?? null }))
      .map((o) => ({ ...o, name: o.key.slice(fullPrefix.length) }))
      // Drop the folder placeholder (`.keep`) and any non-direct-child keys.
      .filter((o) => o.name && o.name !== '.keep' && !o.name.includes('/'))
      .map((o) => ({
        name: o.name,
        path: prefix ? `${prefix}/${o.name}` : o.name,
        isFolder: false,
        size: o.size,
        mimeType: null as string | null,
        icon: mimeIcon(o.name),
        updatedAt: o.updatedAt,
      }))

    return ok(res, { path: prefix, items: [...folders, ...files] })
  } catch (e) { return serverError(res, e) }
})

// POST /files/folder — create a folder (an empty `.keep` placeholder object)
router.post('/files/folder', async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return serverError(res, new Error('Object storage (R2) is not configured'))

    const { path: folderPath } = req.body as { path?: string }
    if (!folderPath) return badRequest(res, 'path required')

    const clean = folderPath.replace(/^\/+|\/+$/g, '')
    const key = `${userPrefix(req.user!.id)}/${clean}/.keep`
    await s3Client.send(new PutObjectCommand({ Bucket: s3Bucket, Key: key, Body: new Uint8Array(0) }))

    return ok(res, { message: 'Folder created', path: clean })
  } catch (e) { return serverError(res, e) }
})

// POST /files/upload — upload file(s)
router.post('/files/upload', upload.array('files', 20), async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return serverError(res, new Error('Object storage (R2) is not configured'))

    const targetPath = ((req.body?.path as string) || '').replace(/^\/+|\/+$/g, '')
    const files = (req as any).files as Express.Multer.File[] | undefined
    if (!files?.length) return badRequest(res, 'No files uploaded')

    const results: { name: string; path: string; size: number; url: string | null }[] = []

    for (const file of files) {
      const filePath = targetPath ? `${targetPath}/${file.originalname}` : file.originalname
      const key = `${userPrefix(req.user!.id)}/${filePath}`
      await s3Client.send(
        new PutObjectCommand({ Bucket: s3Bucket, Key: key, Body: file.buffer, ContentType: file.mimetype })
      )
      // Bucket is private; access is via the signed /files/download endpoint, not a public URL.
      results.push({ name: file.originalname, path: filePath, size: file.size, url: null })
    }

    return ok(res, { uploaded: results.length, files: results })
  } catch (e) { return serverError(res, e) }
})

// GET /files/download — return a short-lived signed URL for a file
router.get('/files/download', async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return serverError(res, new Error('Object storage (R2) is not configured'))

    const filePath = req.query.path as string
    if (!filePath) return badRequest(res, 'path required')

    const key = `${userPrefix(req.user!.id)}/${filePath.replace(/^\/+/, '')}`
    const url = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: s3Bucket, Key: key }),
      { expiresIn: 3600 }
    )

    return ok(res, { url, path: filePath })
  } catch (e) { return serverError(res, e) }
})

// DELETE /files — delete a file or a folder (recursive)
router.delete('/files', async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return serverError(res, new Error('Object storage (R2) is not configured'))

    const filePath = req.query.path as string
    if (!filePath) return badRequest(res, 'path required')

    const target = `${userPrefix(req.user!.id)}/${filePath.replace(/^\/+|\/+$/g, '')}`

    // Collect everything under `target/` (folder contents), plus the object itself (a file).
    const keys = new Set<string>([target])
    let token: string | undefined
    do {
      const listed = await s3Client.send(
        new ListObjectsV2Command({ Bucket: s3Bucket, Prefix: `${target}/`, ContinuationToken: token })
      )
      for (const o of listed.Contents ?? []) if (o.Key) keys.add(o.Key)
      token = listed.IsTruncated ? listed.NextContinuationToken : undefined
    } while (token)

    const objects = [...keys].map((Key) => ({ Key }))
    for (let i = 0; i < objects.length; i += 1000) {
      await s3Client.send(
        new DeleteObjectsCommand({ Bucket: s3Bucket, Delete: { Objects: objects.slice(i, i + 1000) } })
      )
    }

    return ok(res, { message: 'Deleted' })
  } catch (e) { return serverError(res, e) }
})

// POST /files/move — rename/move a single file
router.post('/files/move', async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return serverError(res, new Error('Object storage (R2) is not configured'))

    const { from, to } = req.body as { from?: string; to?: string }
    if (!from || !to) return badRequest(res, 'from and to required')

    const prefix = userPrefix(req.user!.id)
    const fromKey = `${prefix}/${from.replace(/^\/+/, '')}`
    const toKey = `${prefix}/${to.replace(/^\/+/, '')}`

    await s3Client.send(
      new CopyObjectCommand({ Bucket: s3Bucket, CopySource: encodeCopySource(s3Bucket, fromKey), Key: toKey })
    )
    await s3Client.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: fromKey }))

    return ok(res, { message: 'Moved', from, to })
  } catch (e) { return serverError(res, e) }
})

// GET /files/usage — storage usage (bytes + file count) for current user
router.get('/files/usage', async (req: AuthRequest, res) => {
  try {
    if (!s3Client) return ok(res, { configured: false })

    const base = `${userPrefix(req.user!.id)}/`
    let usedBytes = 0
    let fileCount = 0
    let token: string | undefined
    do {
      const out = await s3Client.send(
        new ListObjectsV2Command({ Bucket: s3Bucket, Prefix: base, ContinuationToken: token })
      )
      for (const o of out.Contents ?? []) {
        if (o.Key?.endsWith('/.keep')) continue
        usedBytes += o.Size ?? 0
        fileCount += 1
      }
      token = out.IsTruncated ? out.NextContinuationToken : undefined
    } while (token)

    return ok(res, { configured: true, bucket: s3Bucket, usedBytes, fileCount })
  } catch (e) { return serverError(res, e) }
})

export default router
