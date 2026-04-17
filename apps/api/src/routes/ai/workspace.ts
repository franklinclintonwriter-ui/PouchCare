import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import archiver from 'archiver'
import path from 'path'
import prisma from '@/lib/prisma'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { ok, badRequest, serverError, notFound, forbidden } from '@/lib/response'
import { aiRateLimit } from '@/middleware/rateLimit'
import { resolveProvider, resolveModel } from '@/lib/ai/config'
import { getSupabase, isSupabaseConfigured, mirrorToSupabase } from '@/lib/supabase'
import { getProvider } from '@/lib/ai/providers'

const router = Router()
const CEO_ROLES = ['CEO', 'CO_MD']

function requireExec(req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) {
  if (!CEO_ROLES.includes(String(req.user!.role))) return forbidden(res, 'Workspace access is CEO/MD only')
  next()
}

router.use(authenticate, requireStaff, requireExec as any)

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase()
  const map: Record<string, string> = {
    '.ts': 'text/typescript', '.tsx': 'text/typescript', '.js': 'text/javascript', '.jsx': 'text/javascript',
    '.json': 'application/json', '.html': 'text/html', '.css': 'text/css', '.md': 'text/markdown',
    '.py': 'text/x-python', '.go': 'text/x-go', '.rs': 'text/x-rust', '.java': 'text/x-java',
    '.sql': 'text/x-sql', '.yaml': 'text/yaml', '.yml': 'text/yaml', '.xml': 'text/xml',
    '.sh': 'text/x-shellscript', '.txt': 'text/plain', '.csv': 'text/csv',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf', '.zip': 'application/zip',
  }
  return map[ext] ?? 'text/plain'
}

// ── Workspace CRUD ────────────────────────────────────────────

const createWsSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

router.get('/', async (req: AuthRequest, res) => {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { ownerId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { files: true } } },
    })
    return ok(res, workspaces)
  } catch (e) { return serverError(res, e) }
})

router.post('/', validate(createWsSchema), async (req: AuthRequest, res) => {
  try {
    const body = req.body as z.infer<typeof createWsSchema>
    const ws = await prisma.workspace.create({
      data: { ownerId: req.user!.id, name: body.name, description: body.description },
    })
    return ok(res, ws)
  } catch (e) { return serverError(res, e) }
})

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({
      where: { id: req.params.id, ownerId: req.user!.id },
      include: {
        files: { orderBy: [{ isDirectory: 'desc' }, { path: 'asc' }] },
        _count: { select: { files: true } },
      },
    })
    if (!ws) return notFound(res, 'Workspace')
    return ok(res, ws)
  } catch (e) { return serverError(res, e) }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } })
    if (!ws) return notFound(res, 'Workspace')
    await prisma.workspace.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Workspace deleted' })
  } catch (e) { return serverError(res, e) }
})

// ── Context & Todos ───────────────────────────────────────────

const updateContextSchema = z.object({
  contextNotes: z.string().max(50000).optional(),
  todos: z.string().max(50000).optional(),
})

router.put('/:id/context', validate(updateContextSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const body = req.body as z.infer<typeof updateContextSchema>
    const updated = await prisma.workspace.update({
      where: { id: wsId },
      data: {
        ...(body.contextNotes !== undefined ? { contextNotes: body.contextNotes } : {}),
        ...(body.todos !== undefined ? { todos: body.todos } : {}),
      },
      select: { id: true, contextNotes: true, todos: true },
    })
    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
})

router.put('/:id/conversation', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const { conversationId } = req.body as { conversationId?: string }
    await prisma.workspace.update({ where: { id: wsId }, data: { conversationId: conversationId ?? null } })
    return ok(res, { message: 'Conversation linked' })
  } catch (e) { return serverError(res, e) }
})

// ── File Operations ───────────────────────────────────────────

const createFileSchema = z.object({
  path: z.string().min(1).max(1000),
  content: z.string().max(512000).optional(),
  isDirectory: z.boolean().optional(),
})

async function assertWsOwner(req: AuthRequest, res: import('express').Response): Promise<string | null> {
  const ws = await prisma.workspace.findFirst({ where: { id: req.params.id, ownerId: req.user!.id }, select: { id: true } })
  if (!ws) { notFound(res, 'Workspace'); return null }
  return ws.id
}

router.get('/:id/files', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const files = await prisma.workspaceFile.findMany({
      where: { workspaceId: wsId },
      orderBy: [{ isDirectory: 'desc' }, { path: 'asc' }],
      select: { id: true, path: true, name: true, isDirectory: true, mimeType: true, size: true, createdAt: true, updatedAt: true },
    })
    return ok(res, files)
  } catch (e) { return serverError(res, e) }
})

router.post('/:id/files', validate(createFileSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const body = req.body as z.infer<typeof createFileSchema>
    const filePath = body.path.replace(/\\/g, '/').replace(/^\/+/, '')
    const fileName = path.basename(filePath)
    const isDir = body.isDirectory ?? false
    const content = isDir ? null : (body.content ?? '')

    const parentDir = path.dirname(filePath)
    if (parentDir && parentDir !== '.') {
      const parts = parentDir.split('/')
      for (let i = 0; i < parts.length; i++) {
        const dirPath = parts.slice(0, i + 1).join('/')
        await prisma.workspaceFile.upsert({
          where: { workspaceId_path: { workspaceId: wsId, path: dirPath } },
          create: { workspaceId: wsId, path: dirPath, name: parts[i]!, isDirectory: true },
          update: {},
        })
      }
    }

    const file = await prisma.workspaceFile.upsert({
      where: { workspaceId_path: { workspaceId: wsId, path: filePath } },
      create: {
        workspaceId: wsId,
        path: filePath,
        name: fileName,
        isDirectory: isDir,
        mimeType: isDir ? null : mimeFromName(fileName),
        size: content ? Buffer.byteLength(content, 'utf8') : 0,
        content,
      },
      update: {
        content,
        size: content ? Buffer.byteLength(content, 'utf8') : 0,
        mimeType: isDir ? null : mimeFromName(fileName),
      },
    })

    await prisma.workspace.update({ where: { id: wsId }, data: { updatedAt: new Date() } })
    return ok(res, file)
  } catch (e) { return serverError(res, e) }
})

router.put('/:id/files/:fileId', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const { content } = req.body as { content?: string }
    if (content === undefined) return badRequest(res, 'content is required')

    const file = await prisma.workspaceFile.findFirst({ where: { id: req.params.fileId, workspaceId: wsId } })
    if (!file) return notFound(res, 'File')

    const updated = await prisma.workspaceFile.update({
      where: { id: req.params.fileId },
      data: { content, size: Buffer.byteLength(content, 'utf8') },
    })
    await prisma.workspace.update({ where: { id: wsId }, data: { updatedAt: new Date() } })
    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
})

router.delete('/:id/files/:fileId', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const file = await prisma.workspaceFile.findFirst({ where: { id: req.params.fileId, workspaceId: wsId } })
    if (!file) return notFound(res, 'File')

    if (file.isDirectory) {
      await prisma.workspaceFile.deleteMany({ where: { workspaceId: wsId, path: { startsWith: file.path + '/' } } })
    }
    await prisma.workspaceFile.delete({ where: { id: req.params.fileId } })
    await prisma.workspace.update({ where: { id: wsId }, data: { updatedAt: new Date() } })
    return ok(res, { message: 'Deleted' })
  } catch (e) { return serverError(res, e) }
})

const renameSchema = z.object({ newPath: z.string().min(1).max(1000) })

router.post('/:id/files/:fileId/rename', validate(renameSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const file = await prisma.workspaceFile.findFirst({ where: { id: req.params.fileId, workspaceId: wsId } })
    if (!file) return notFound(res, 'File')

    const newPath = (req.body as z.infer<typeof renameSchema>).newPath.replace(/\\/g, '/').replace(/^\/+/, '')
    const newName = path.basename(newPath)

    if (file.isDirectory) {
      const children = await prisma.workspaceFile.findMany({ where: { workspaceId: wsId, path: { startsWith: file.path + '/' } } })
      for (const child of children) {
        await prisma.workspaceFile.update({
          where: { id: child.id },
          data: { path: child.path.replace(file.path, newPath) },
        })
      }
    }

    const updated = await prisma.workspaceFile.update({
      where: { id: req.params.fileId },
      data: { path: newPath, name: newName },
    })
    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
})

router.post('/:id/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const uploaded = (req as any).file as Express.Multer.File | undefined
    if (!uploaded) return badRequest(res, 'No file uploaded')

    const filePath = ((req.body?.path as string) || uploaded.originalname).replace(/\\/g, '/').replace(/^\/+/, '')
    const fileName = path.basename(filePath)
    const isBinary = !uploaded.mimetype.startsWith('text/') && !['application/json', 'application/xml', 'application/javascript'].includes(uploaded.mimetype)
    const isLarge = uploaded.size >= 500_000

    let content: string | null = null
    let storageKey: string | null = null

    if ((isBinary || isLarge) && isSupabaseConfigured()) {
      const supabase = getSupabase()!
      const key = `workspace/${wsId}/${filePath}`
      const { error } = await supabase.storage.from('workspace-files').upload(key, uploaded.buffer, { contentType: uploaded.mimetype, upsert: true })
      if (!error) {
        const { data: urlData } = supabase.storage.from('workspace-files').getPublicUrl(key)
        storageKey = urlData.publicUrl
      } else {
        content = uploaded.size < 500_000 ? uploaded.buffer.toString('utf8') : null
      }
    } else {
      content = uploaded.size < 500_000 ? uploaded.buffer.toString('utf8') : null
    }

    const file = await prisma.workspaceFile.upsert({
      where: { workspaceId_path: { workspaceId: wsId, path: filePath } },
      create: { workspaceId: wsId, path: filePath, name: fileName, mimeType: uploaded.mimetype, size: uploaded.size, content, storageKey },
      update: { content, size: uploaded.size, mimeType: uploaded.mimetype, storageKey },
    })
    await prisma.workspace.update({ where: { id: wsId }, data: { updatedAt: new Date() } })
    return ok(res, file)
  } catch (e) { return serverError(res, e) }
})

router.get('/:id/files/:fileId/download', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const file = await prisma.workspaceFile.findFirst({ where: { id: req.params.fileId, workspaceId: wsId } })
    if (!file || file.isDirectory) return notFound(res, 'File')

    if (file.storageKey?.startsWith('http')) {
      return res.redirect(file.storageKey)
    }
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`)
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
    res.send(file.content ?? '')
  } catch (e) { return serverError(res, e) }
})

// ── Skills CRUD ───────────────────────────────────────────────

const skillSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  content: z.string().min(1).max(10000),
  category: z.string().max(50).default('custom'),
  enabled: z.boolean().default(true),
  priority: z.coerce.number().int().default(0),
})

router.get('/:id/skills', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const skills = await prisma.workspaceSkill.findMany({
      where: { workspaceId: wsId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    })
    return ok(res, skills)
  } catch (e) { return serverError(res, e) }
})

router.post('/:id/skills', validate(skillSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const body = req.body as z.infer<typeof skillSchema>
    const skill = await prisma.workspaceSkill.create({
      data: { workspaceId: wsId, ...body },
    })
    return ok(res, skill)
  } catch (e) { return serverError(res, e) }
})

router.put('/:id/skills/:skillId', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const skill = await prisma.workspaceSkill.findFirst({ where: { id: req.params.skillId, workspaceId: wsId } })
    if (!skill) return notFound(res, 'Skill')
    const { name, description, content, category, enabled, priority } = req.body
    const updated = await prisma.workspaceSkill.update({
      where: { id: req.params.skillId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(enabled !== undefined ? { enabled } : {}),
        ...(priority !== undefined ? { priority } : {}),
      },
    })
    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
})

router.delete('/:id/skills/:skillId', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const skill = await prisma.workspaceSkill.findFirst({ where: { id: req.params.skillId, workspaceId: wsId } })
    if (!skill) return notFound(res, 'Skill')
    await prisma.workspaceSkill.delete({ where: { id: req.params.skillId } })
    return ok(res, { message: 'Skill deleted' })
  } catch (e) { return serverError(res, e) }
})

// ── Workspace Settings ────────────────────────────────────────

router.get('/:id/settings', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const ws = await prisma.workspace.findUnique({ where: { id: wsId }, select: { settings: true } })
    let parsed: Record<string, unknown> = {}
    try { if (ws?.settings) parsed = JSON.parse(ws.settings) } catch {}
    return ok(res, parsed)
  } catch (e) { return serverError(res, e) }
})

router.put('/:id/settings', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    await prisma.workspace.update({ where: { id: wsId }, data: { settings: JSON.stringify(req.body) } })
    return ok(res, { message: 'Settings saved' })
  } catch (e) { return serverError(res, e) }
})

// ── Workspace Conversations ───────────────────────────────────

router.get('/:id/conversations', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const convs = await prisma.aiConversation.findMany({
      where: { staffId: req.user!.id, workspaceId: wsId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: { id: true, title: true, provider: true, model: true, totalTokens: true, createdAt: true, updatedAt: true },
    })
    return ok(res, convs)
  } catch (e) { return serverError(res, e) }
})

// ── Preview (static file serving) ─────────────────────────────

router.get('/:id/preview/*', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const reqPath = (req.params as any)[0] || 'index.html'
    const filePath = reqPath.replace(/\\/g, '/').replace(/^\/+/, '')

    const file = await prisma.workspaceFile.findFirst({
      where: { workspaceId: wsId, path: filePath, isDirectory: false },
    })
    if (!file) {
      res.status(404).send('File not found')
      return
    }
    res.setHeader('Content-Type', file.mimeType || mimeFromName(file.name))
    res.setHeader('Cache-Control', 'no-cache')
    res.send(file.content ?? '')
  } catch (e) { return serverError(res, e) }
})

// ── Export ZIP ────────────────────────────────────────────────

router.post('/:id/export/zip', async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return

    const ws = await prisma.workspace.findUnique({ where: { id: wsId } })
    const files = await prisma.workspaceFile.findMany({ where: { workspaceId: wsId, isDirectory: false } })

    res.setHeader('Content-Disposition', `attachment; filename="${ws?.name ?? 'workspace'}.zip"`)
    res.setHeader('Content-Type', 'application/zip')

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    for (const f of files) {
      archive.append(f.content ?? '', { name: f.path })
    }

    await archive.finalize()
  } catch (e) {
    if (!res.headersSent) return serverError(res, e)
  }
})

// ── AI CLI ────────────────────────────────────────────────────

const cliSchema = z.object({ command: z.string().min(1).max(5000) })

router.post('/:id/cli', aiRateLimit, validate(cliSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return

    const { command } = req.body as z.infer<typeof cliSchema>
    const [files, workspace, skills] = await Promise.all([
      prisma.workspaceFile.findMany({
        where: { workspaceId: wsId },
        select: { path: true, name: true, isDirectory: true, size: true },
        orderBy: [{ isDirectory: 'desc' }, { path: 'asc' }],
      }),
      prisma.workspace.findUnique({ where: { id: wsId }, select: { contextNotes: true, todos: true, name: true } }),
      prisma.workspaceSkill.findMany({ where: { workspaceId: wsId, enabled: true }, orderBy: { priority: 'desc' }, select: { name: true, content: true } }),
    ])

    const fileTree = files.map((f) => `${f.isDirectory ? 'd' : '-'} ${f.path} (${f.size}b)`).join('\n') || '(empty workspace)'
    const contextSection = workspace?.contextNotes ? `\n\nWorkspace context (persistent memory):\n${workspace.contextNotes}` : ''
    const todosSection = workspace?.todos ? `\n\nWorkspace TODOs:\n${workspace.todos}` : ''
    const skillsSection = skills.length > 0 ? `\n\nActive skills/rules:\n${skills.map((s) => `- ${s.name}: ${s.content}`).join('\n')}` : ''

    const providerName = resolveProvider()
    const modelName = resolveModel(providerName)
    const provider = getProvider(providerName)

    const result = await provider.chatSync(
      [
        {
          role: 'system',
          content: `You are a CLI interpreter for a virtual file workspace "${workspace?.name ?? 'untitled'}". The user types shell-like commands and you respond with:
1. A JSON object with "operations" array and "output" string
2. Each operation is: { "type": "mkdir"|"create"|"delete"|"rename"|"write", "path": string, "content"?: string, "newPath"?: string }

Available commands: ls, cat, mkdir, touch, rm, mv, cp, echo, tree, find, grep, wc, head, tail, pwd, clear
For code generation (e.g. "generate a React component"), create files with full content.
For "npm init", generate a package.json. For "git init", create a .gitignore.

Current file tree:
${fileTree}${contextSection}${todosSection}${skillsSection}

IMPORTANT: Return ONLY valid JSON. No markdown fences. The "output" field is what the user sees in the terminal.`,
        },
        { role: 'user', content: command },
      ],
      { model: modelName, maxTokens: 4096 },
    )

    let parsed: { operations?: any[]; output?: string }
    try { parsed = JSON.parse(result.content) } catch { parsed = { output: result.content } }

    const ops = Array.isArray(parsed.operations) ? parsed.operations : []
    const executed: string[] = []

    for (const op of ops) {
      try {
        const opPath = String(op.path ?? '').replace(/\\/g, '/').replace(/^\/+/, '')
        if (!opPath) continue

        switch (op.type) {
          case 'mkdir':
            await prisma.workspaceFile.upsert({
              where: { workspaceId_path: { workspaceId: wsId, path: opPath } },
              create: { workspaceId: wsId, path: opPath, name: path.basename(opPath), isDirectory: true },
              update: {},
            })
            executed.push(`mkdir: ${opPath}`)
            break
          case 'create':
          case 'write':
          case 'touch': {
            const content = op.content ?? ''
            const parentDir = path.dirname(opPath)
            if (parentDir && parentDir !== '.') {
              const parts = parentDir.split('/')
              for (let i = 0; i < parts.length; i++) {
                const dp = parts.slice(0, i + 1).join('/')
                await prisma.workspaceFile.upsert({
                  where: { workspaceId_path: { workspaceId: wsId, path: dp } },
                  create: { workspaceId: wsId, path: dp, name: parts[i]!, isDirectory: true },
                  update: {},
                })
              }
            }
            await prisma.workspaceFile.upsert({
              where: { workspaceId_path: { workspaceId: wsId, path: opPath } },
              create: { workspaceId: wsId, path: opPath, name: path.basename(opPath), mimeType: mimeFromName(opPath), size: Buffer.byteLength(content, 'utf8'), content },
              update: { content, size: Buffer.byteLength(content, 'utf8') },
            })
            executed.push(`${op.type}: ${opPath}`)
            break
          }
          case 'delete':
          case 'rm':
            await prisma.workspaceFile.deleteMany({ where: { workspaceId: wsId, OR: [{ path: opPath }, { path: { startsWith: opPath + '/' } }] } })
            executed.push(`rm: ${opPath}`)
            break
          case 'rename':
          case 'mv': {
            const newPath = String(op.newPath ?? '').replace(/\\/g, '/').replace(/^\/+/, '')
            if (newPath) {
              const file = await prisma.workspaceFile.findFirst({ where: { workspaceId: wsId, path: opPath } })
              if (file) {
                await prisma.workspaceFile.update({ where: { id: file.id }, data: { path: newPath, name: path.basename(newPath) } })
                executed.push(`mv: ${opPath} → ${newPath}`)
              }
            }
            break
          }
        }
      } catch { /* skip failed ops */ }
    }

    if (executed.length > 0) {
      await prisma.workspace.update({ where: { id: wsId }, data: { updatedAt: new Date() } })
    }

    return ok(res, {
      output: parsed.output ?? (executed.join('\n') || 'Done.'),
      operations: executed,
      filesChanged: executed.length,
    })
  } catch (e) { return serverError(res, e) }
})

// ── SEO Research Agent ────────────────────────────────────────

const researchSchema = z.object({
  query: z.string().min(1).max(5000),
  tools: z.array(z.enum(['serp', 'keywords', 'backlinks', 'domain_rank'])).optional(),
})

router.post('/:id/research', aiRateLimit, validate(researchSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return

    const body = req.body as z.infer<typeof researchSchema>
    const providerName = resolveProvider()
    const modelName = resolveModel(providerName)
    const provider = getProvider(providerName)

    const [workspace, skills] = await Promise.all([
      prisma.workspace.findUnique({ where: { id: wsId }, select: { name: true, contextNotes: true } }),
      prisma.workspaceSkill.findMany({ where: { workspaceId: wsId, enabled: true }, select: { name: true, content: true } }),
    ])

    const skillsText = skills.length > 0 ? skills.map((s) => `- ${s.name}: ${s.content}`).join('\n') : ''

    const planResult = await provider.chatSync(
      [
        {
          role: 'system',
          content: `You are an SEO research agent for the workspace "${workspace?.name ?? ''}". You have access to real SEO tools.
${workspace?.contextNotes ? `\nProject context:\n${workspace.contextNotes}` : ''}
${skillsText ? `\nActive skills:\n${skillsText}` : ''}

Available tools:
- "serp": Google SERP Top 100 (keyword + market) — returns organic rankings
- "keywords": Keyword research from a seed (volume, KD, CPC, intent, trend)
- "backlinks": Backlink analysis for a URL (referring domains, DR/UR)
- "domain_rank": Open PageRank 0-10 for domains

Given the user's research request, return a JSON plan:
{
  "steps": [
    { "tool": "serp"|"keywords"|"backlinks"|"domain_rank", "params": { ... }, "reason": string }
  ],
  "summary": "what you'll research and why"
}

serp params: { keyword: string, gl?: string, hl?: string }
keywords params: { seed: string }
backlinks params: { targetUrl: string }
domain_rank params: { domains: string[] }

Return ONLY valid JSON.`,
        },
        { role: 'user', content: body.query },
      ],
      { model: modelName, maxTokens: 2048 },
    )

    let plan: { steps?: { tool: string; params: Record<string, unknown>; reason: string }[]; summary?: string }
    try { plan = JSON.parse(planResult.content) } catch { plan = { summary: planResult.content, steps: [] } }

    const results: { tool: string; reason: string; data: unknown; error?: string }[] = []

    for (const step of (plan.steps ?? [])) {
      try {
        switch (step.tool) {
          case 'serp': {
            const { fetchGoogleSerpTop } = await import('@/lib/tools/serpapi')
            const data = await fetchGoogleSerpTop({
              q: String(step.params.keyword ?? ''),
              gl: String(step.params.gl ?? 'us'),
              hl: String(step.params.hl ?? 'en'),
              num: 20,
            })
            results.push({ tool: 'serp', reason: step.reason, data: { keyword: step.params.keyword, results: data.slice(0, 20) } })
            break
          }
          case 'keywords': {
            const { fetchKeywordIdeas } = await import('@/lib/tools/dataforseo')
            const data = await fetchKeywordIdeas(String(step.params.seed ?? ''))
            results.push({ tool: 'keywords', reason: step.reason, data: { seed: step.params.seed, keywords: data.slice(0, 20) } })
            break
          }
          case 'backlinks': {
            const { fetchBacklinks } = await import('@/lib/tools/dataforseo')
            const data = await fetchBacklinks(String(step.params.targetUrl ?? ''))
            results.push({ tool: 'backlinks', reason: step.reason, data: { url: step.params.targetUrl, backlinks: data.slice(0, 20) } })
            break
          }
          case 'domain_rank': {
            const { fetchOpenPageRanks } = await import('@/lib/tools/openpagerank')
            const domains = Array.isArray(step.params.domains) ? step.params.domains.map(String) : [String(step.params.domains)]
            const data = await fetchOpenPageRanks(domains)
            results.push({ tool: 'domain_rank', reason: step.reason, data })
            break
          }
          default:
            results.push({ tool: step.tool, reason: step.reason, data: null, error: `Unknown tool: ${step.tool}` })
        }
      } catch (e) {
        results.push({ tool: step.tool, reason: step.reason, data: null, error: e instanceof Error ? e.message : 'Tool failed' })
      }
    }

    const analysisResult = await provider.chatSync(
      [
        {
          role: 'system',
          content: `You are an SEO analyst. Given research data from real SEO tools, provide a comprehensive analysis with actionable insights. Use Markdown formatting with clear headings.
${workspace?.contextNotes ? `\nProject context:\n${workspace.contextNotes}` : ''}
${skillsText ? `\nFollow these rules:\n${skillsText}` : ''}`,
        },
        {
          role: 'user',
          content: `Research request: ${body.query}\n\nResearch results:\n${JSON.stringify(results, null, 2)}\n\nProvide a detailed analysis with:\n1. Key findings\n2. Opportunities\n3. Recommendations\n4. Action items for the project`,
        },
      ],
      { model: modelName, maxTokens: 4096 },
    )

    return ok(res, {
      summary: plan.summary,
      steps: results.map((r) => ({ tool: r.tool, reason: r.reason, success: !r.error, error: r.error })),
      analysis: analysisResult.content,
      rawData: results,
    })
  } catch (e) { return serverError(res, e) }
})

// ── Copilot: Inline Suggestions ───────────────────────────────

const suggestSchema = z.object({
  filePath: z.string().min(1),
  content: z.string().max(100000),
  cursorLine: z.coerce.number().int().min(0),
  cursorCol: z.coerce.number().int().min(0),
})

router.post('/:id/copilot/suggest', aiRateLimit, validate(suggestSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const body = req.body as z.infer<typeof suggestSchema>
    const providerName = resolveProvider()
    const modelName = resolveModel(providerName)
    const provider = getProvider(providerName)

    const lines = body.content.split('\n')
    const before = lines.slice(Math.max(0, body.cursorLine - 20), body.cursorLine + 1).join('\n')
    const after = lines.slice(body.cursorLine + 1, body.cursorLine + 10).join('\n')

    const result = await provider.chatSync(
      [
        { role: 'system', content: `You are a code autocomplete engine. Given the code context, suggest a SHORT completion (1-3 lines max) that continues naturally from the cursor position. Return ONLY the completion text — no explanation, no backticks, no prefix repeat.` },
        { role: 'user', content: `File: ${body.filePath}\n\nCode before cursor:\n${before}\n\nCode after cursor:\n${after}` },
      ],
      { model: modelName, maxTokens: 200, temperature: 0.2 },
    )
    return ok(res, { suggestion: result.content.trim() })
  } catch (e) { return serverError(res, e) }
})

// ── Copilot: Code Actions ─────────────────────────────────────

const actionSchema = z.object({
  action: z.enum(['explain', 'fix', 'docs', 'refactor']),
  code: z.string().min(1).max(50000),
  filePath: z.string().min(1),
})

router.post('/:id/copilot/action', aiRateLimit, validate(actionSchema), async (req: AuthRequest, res) => {
  try {
    const wsId = await assertWsOwner(req, res)
    if (!wsId) return
    const body = req.body as z.infer<typeof actionSchema>
    const providerName = resolveProvider()
    const modelName = resolveModel(providerName)
    const provider = getProvider(providerName)

    const prompts: Record<string, string> = {
      explain: 'Explain this code clearly and concisely. Use bullet points for key concepts.',
      fix: 'Find and fix bugs in this code. Return the corrected code with brief comments explaining each fix.',
      docs: 'Generate comprehensive documentation comments (JSDoc/docstring) for this code. Return only the documented code.',
      refactor: 'Refactor this code to be cleaner, more efficient, and follow best practices. Return the improved code with brief comments.',
    }

    const result = await provider.chatSync(
      [
        { role: 'system', content: prompts[body.action] ?? prompts.explain },
        { role: 'user', content: `File: ${body.filePath}\n\n${body.code}` },
      ],
      { model: modelName, maxTokens: 4096 },
    )
    return ok(res, { result: result.content, action: body.action })
  } catch (e) { return serverError(res, e) }
})

export default router
