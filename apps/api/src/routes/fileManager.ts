import { Router } from 'express'
import multer from 'multer'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { ok, badRequest, serverError, notFound } from '@/lib/response'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'

const router = Router()
router.use(authenticate, requireStaff)

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
const BUCKET = 'staff-files'

function userPrefix(userId: string) {
  return `users/${userId}`
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
    const supabase = getSupabase()
    if (!supabase) return serverError(res, new Error('Supabase not configured'))

    const prefix = (req.query.path as string) || ''
    const fullPrefix = `${userPrefix(req.user!.id)}/${prefix}`.replace(/\/+$/, '')

    const { data, error } = await supabase.storage.from(BUCKET).list(fullPrefix, {
      limit: 200,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) return serverError(res, new Error(error.message))

    const items = (data ?? []).map((item) => ({
      name: item.name,
      path: prefix ? `${prefix}/${item.name}` : item.name,
      isFolder: !item.id,
      size: (item.metadata as any)?.size ?? 0,
      mimeType: (item.metadata as any)?.mimetype ?? null,
      icon: item.id ? mimeIcon(item.name) : 'folder',
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }))

    return ok(res, { path: prefix, items })
  } catch (e) { return serverError(res, e) }
})

// POST /files/folder — create folder
router.post('/files/folder', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serverError(res, new Error('Supabase not configured'))

    const { path: folderPath } = req.body as { path?: string }
    if (!folderPath) return badRequest(res, 'path required')

    const fullPath = `${userPrefix(req.user!.id)}/${folderPath}/.keep`
    const { error } = await supabase.storage.from(BUCKET).upload(fullPath, new Uint8Array(0), { upsert: true })
    if (error) return serverError(res, new Error(error.message))

    return ok(res, { message: 'Folder created', path: folderPath })
  } catch (e) { return serverError(res, e) }
})

// POST /files/upload — upload file(s)
router.post('/files/upload', upload.array('files', 20), async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serverError(res, new Error('Supabase not configured'))

    const targetPath = (req.body?.path as string) || ''
    const files = (req as any).files as Express.Multer.File[] | undefined
    if (!files?.length) return badRequest(res, 'No files uploaded')

    const results: { name: string; path: string; size: number; url: string | null }[] = []

    for (const file of files) {
      const filePath = targetPath ? `${targetPath}/${file.originalname}` : file.originalname
      const fullPath = `${userPrefix(req.user!.id)}/${filePath}`

      const { error } = await supabase.storage.from(BUCKET).upload(fullPath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      })

      if (!error) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fullPath)
        results.push({ name: file.originalname, path: filePath, size: file.size, url: urlData.publicUrl })
      }
    }

    return ok(res, { uploaded: results.length, files: results })
  } catch (e) { return serverError(res, e) }
})

// GET /files/download — download a file (returns signed URL)
router.get('/files/download', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serverError(res, new Error('Supabase not configured'))

    const filePath = req.query.path as string
    if (!filePath) return badRequest(res, 'path required')

    const fullPath = `${userPrefix(req.user!.id)}/${filePath}`
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(fullPath, 3600)
    if (error || !data) return notFound(res, 'File')

    return ok(res, { url: data.signedUrl, path: filePath })
  } catch (e) { return serverError(res, e) }
})

// DELETE /files — delete file or folder
router.delete('/files', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serverError(res, new Error('Supabase not configured'))

    const filePath = req.query.path as string
    if (!filePath) return badRequest(res, 'path required')

    const fullPath = `${userPrefix(req.user!.id)}/${filePath}`

    const { data: listData } = await supabase.storage.from(BUCKET).list(fullPath)
    if (listData && listData.length > 0) {
      const paths = listData.map((f) => `${fullPath}/${f.name}`)
      await supabase.storage.from(BUCKET).remove(paths)
    }

    await supabase.storage.from(BUCKET).remove([fullPath])
    return ok(res, { message: 'Deleted' })
  } catch (e) { return serverError(res, e) }
})

// POST /files/move — rename/move file
router.post('/files/move', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return serverError(res, new Error('Supabase not configured'))

    const { from, to } = req.body as { from?: string; to?: string }
    if (!from || !to) return badRequest(res, 'from and to required')

    const prefix = userPrefix(req.user!.id)
    const { error } = await supabase.storage.from(BUCKET).move(`${prefix}/${from}`, `${prefix}/${to}`)
    if (error) return serverError(res, new Error(error.message))

    return ok(res, { message: 'Moved', from, to })
  } catch (e) { return serverError(res, e) }
})

// GET /files/usage — storage usage for current user
router.get('/files/usage', async (req: AuthRequest, res) => {
  try {
    const supabase = getSupabase()
    if (!supabase) return ok(res, { configured: false })

    return ok(res, { configured: true, bucket: BUCKET })
  } catch (e) { return serverError(res, e) }
})

export default router
