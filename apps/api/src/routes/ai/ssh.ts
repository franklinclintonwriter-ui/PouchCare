import { Router } from 'express'
import { z } from 'zod'
import { Client } from 'ssh2'
import prisma from '@/lib/prisma'
import { env } from '@/config/env'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { ok, badRequest, serverError, forbidden, serviceUnavailable } from '@/lib/response'
import { aiRateLimit } from '@/middleware/rateLimit'
import { resolveProvider, resolveModel } from '@/lib/ai/config'
import { getProvider } from '@/lib/ai/providers'

const router = Router()
const CEO_ROLES = ['CEO', 'CO_MD']

function requireExec(req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) {
  if (!CEO_ROLES.includes(String(req.user!.role))) return forbidden(res, 'SSH access is CEO/MD only')
  next()
}

router.use(authenticate, requireStaff, requireExec as any)

function getSshConfig() {
  if (!env.SSH_HOST) return null
  const config: any = {
    host: env.SSH_HOST,
    port: env.SSH_PORT,
    username: env.SSH_USERNAME,
  }
  if (env.SSH_PRIVATE_KEY) {
    config.privateKey = Buffer.from(env.SSH_PRIVATE_KEY, 'base64')
  } else if (env.SSH_PASSWORD) {
    config.password = env.SSH_PASSWORD
  } else {
    return null
  }
  return config
}

function connectSsh(): Promise<Client> {
  const config = getSshConfig()
  if (!config) return Promise.reject(new Error('SSH not configured'))
  return new Promise((resolve, reject) => {
    const conn = new Client()
    conn.on('ready', () => resolve(conn))
    conn.on('error', reject)
    conn.connect(config)
  })
}

function execSsh(conn: Client, cmd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err)
      let stdout = ''
      let stderr = ''
      stream.on('data', (d: Buffer) => { stdout += d.toString() })
      stream.stderr.on('data', (d: Buffer) => { stderr += d.toString() })
      stream.on('close', (code: number) => resolve({ stdout, stderr, code: code ?? 0 }))
    })
  })
}

// ── Status ────────────────────────────────────────────────────

router.get('/status', async (_req: AuthRequest, res) => {
  const config = getSshConfig()
  if (!config) return ok(res, { configured: false, connected: false })
  try {
    const conn = await connectSsh()
    const { stdout } = await execSsh(conn, 'hostname && uname -a')
    conn.end()
    return ok(res, { configured: true, connected: true, host: env.SSH_HOST, info: stdout.trim() })
  } catch (e) {
    return ok(res, { configured: true, connected: false, host: env.SSH_HOST, error: e instanceof Error ? e.message : 'Connection failed' })
  }
})

// ── Toggle SSH mode for workspace ─────────────────────────────

router.post('/toggle/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.workspaceId, ownerId: req.user!.id } })
    if (!ws) return badRequest(res, 'Workspace not found')
    const newVal = !ws.sshEnabled
    if (newVal && !getSshConfig()) return serviceUnavailable(res, 'SSH not configured in .env')
    await prisma.workspace.update({ where: { id: ws.id }, data: { sshEnabled: newVal } })
    if (newVal) {
      try {
        const conn = await connectSsh()
        await execSsh(conn, `mkdir -p /home/${env.SSH_USERNAME}/projects/${ws.id}`)
        conn.end()
      } catch { /* ignore — dir may already exist */ }
    }
    return ok(res, { sshEnabled: newVal })
  } catch (e) { return serverError(res, e) }
})

// ── SFTP File Operations ──────────────────────────────────────

function getWsPath(wsId: string) {
  return `/home/${env.SSH_USERNAME}/projects/${wsId}`
}

router.get('/files/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const conn = await connectSsh()
    const wsPath = getWsPath(req.params.workspaceId)
    const { stdout } = await execSsh(conn, `find ${wsPath} -maxdepth 10 -printf '%y %P %s\\n' 2>/dev/null || echo ''`)
    conn.end()

    const files = stdout.split('\n').filter(Boolean).map((line) => {
      const [type, ...rest] = line.split(' ')
      const size = parseInt(rest.pop() ?? '0')
      const path = rest.join(' ')
      if (!path) return null
      return { path, name: path.split('/').pop() ?? path, isDirectory: type === 'd', size }
    }).filter(Boolean)

    return ok(res, files)
  } catch (e) { return serverError(res, e) }
})

router.get('/files/:workspaceId/read', async (req: AuthRequest, res) => {
  try {
    const filePath = req.query.path as string
    if (!filePath) return badRequest(res, 'path query required')
    const conn = await connectSsh()
    const fullPath = `${getWsPath(req.params.workspaceId)}/${filePath}`
    const { stdout } = await execSsh(conn, `cat "${fullPath}" 2>/dev/null || echo ''`)
    conn.end()
    return ok(res, { path: filePath, content: stdout })
  } catch (e) { return serverError(res, e) }
})

router.put('/files/:workspaceId/write', async (req: AuthRequest, res) => {
  try {
    const { path: filePath, content } = req.body as { path?: string; content?: string }
    if (!filePath) return badRequest(res, 'path required')
    const conn = await connectSsh()
    const fullPath = `${getWsPath(req.params.workspaceId)}/${filePath}`
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
    await execSsh(conn, `mkdir -p "${dir}"`)
    const escaped = (content ?? '').replace(/'/g, "'\\''")
    await execSsh(conn, `printf '%s' '${escaped}' > "${fullPath}"`)
    conn.end()
    return ok(res, { message: 'Written', path: filePath })
  } catch (e) { return serverError(res, e) }
})

router.post('/files/:workspaceId/mkdir', async (req: AuthRequest, res) => {
  try {
    const { path: dirPath } = req.body as { path?: string }
    if (!dirPath) return badRequest(res, 'path required')
    const conn = await connectSsh()
    await execSsh(conn, `mkdir -p "${getWsPath(req.params.workspaceId)}/${dirPath}"`)
    conn.end()
    return ok(res, { message: 'Created', path: dirPath })
  } catch (e) { return serverError(res, e) }
})

router.delete('/files/:workspaceId/delete', async (req: AuthRequest, res) => {
  try {
    const filePath = req.query.path as string
    if (!filePath) return badRequest(res, 'path query required')
    const conn = await connectSsh()
    await execSsh(conn, `rm -rf "${getWsPath(req.params.workspaceId)}/${filePath}"`)
    conn.end()
    return ok(res, { message: 'Deleted' })
  } catch (e) { return serverError(res, e) }
})

// ── Sync: DB <-> Server ───────────────────────────────────────

router.post('/sync-to-server/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.workspaceId, ownerId: req.user!.id } })
    if (!ws) return badRequest(res, 'Workspace not found')
    const files = await prisma.workspaceFile.findMany({ where: { workspaceId: ws.id, isDirectory: false } })
    const conn = await connectSsh()
    const wsPath = getWsPath(ws.id)
    await execSsh(conn, `mkdir -p "${wsPath}"`)

    let synced = 0
    for (const f of files) {
      const fullPath = `${wsPath}/${f.path}`
      const dir = fullPath.substring(0, fullPath.lastIndexOf('/'))
      await execSsh(conn, `mkdir -p "${dir}"`)
      const escaped = (f.content ?? '').replace(/'/g, "'\\''")
      await execSsh(conn, `printf '%s' '${escaped}' > "${fullPath}"`)
      synced++
    }
    conn.end()
    return ok(res, { message: `Synced ${synced} files to server`, files: synced })
  } catch (e) { return serverError(res, e) }
})

router.post('/sync-from-server/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.workspaceId, ownerId: req.user!.id } })
    if (!ws) return badRequest(res, 'Workspace not found')
    const conn = await connectSsh()
    const wsPath = getWsPath(ws.id)
    const { stdout: fileList } = await execSsh(conn, `find ${wsPath} -maxdepth 10 -type f -printf '%P\\n' 2>/dev/null || echo ''`)
    const filePaths = fileList.split('\n').filter(Boolean)

    let synced = 0
    for (const fp of filePaths.slice(0, 500)) {
      const { stdout: content } = await execSsh(conn, `cat "${wsPath}/${fp}" 2>/dev/null || echo ''`)
      const name = fp.split('/').pop() ?? fp
      await prisma.workspaceFile.upsert({
        where: { workspaceId_path: { workspaceId: ws.id, path: fp } },
        create: { workspaceId: ws.id, path: fp, name, content, size: Buffer.byteLength(content, 'utf8') },
        update: { content, size: Buffer.byteLength(content, 'utf8') },
      })
      synced++
    }
    conn.end()
    await prisma.workspace.update({ where: { id: ws.id }, data: { updatedAt: new Date() } })
    return ok(res, { message: `Synced ${synced} files from server`, files: synced })
  } catch (e) { return serverError(res, e) }
})

// ── Execute single command ────────────────────────────────────

router.post('/exec/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const { command } = req.body as { command?: string }
    if (!command) return badRequest(res, 'command required')
    const conn = await connectSsh()
    const wsPath = getWsPath(req.params.workspaceId)
    const result = await execSsh(conn, `cd "${wsPath}" && ${command}`)
    conn.end()
    return ok(res, { stdout: result.stdout, stderr: result.stderr, exitCode: result.code })
  } catch (e) { return serverError(res, e) }
})

// ── AI Server Agent ───────────────────────────────────────────

const agentSchema = z.object({
  message: z.string().min(1).max(20000),
  workspaceId: z.string().uuid(),
  autoExecute: z.boolean().default(false),
})

router.post('/agent', aiRateLimit, validate(agentSchema), async (req: AuthRequest, res) => {
  try {
    if (!getSshConfig()) return serviceUnavailable(res, 'SSH not configured')

    const body = req.body as z.infer<typeof agentSchema>
    const providerName = resolveProvider()
    const modelName = resolveModel(providerName)
    const provider = getProvider(providerName)

    const conn = await connectSsh()
    const wsPath = getWsPath(body.workspaceId)

    const [sysInfo, fileTree, ws] = await Promise.all([
      execSsh(conn, 'hostname && uname -a && df -h / | tail -1 && free -h | head -2 && which node python3 git docker npm 2>/dev/null'),
      execSsh(conn, `find ${wsPath} -maxdepth 5 -printf '%y %P\\n' 2>/dev/null | head -100 || echo "(empty)"`),
      prisma.workspace.findFirst({
        where: { id: body.workspaceId, ownerId: req.user!.id },
        select: { name: true, contextNotes: true, todos: true },
      }),
    ])

    const aiResult = await provider.chatSync(
      [
        {
          role: 'system',
          content: `You are a server automation agent with SSH access to an Ubuntu server. The user asks you to do things on the server. You create a plan of shell commands.

SERVER INFO:
${sysInfo.stdout}

WORKSPACE: ${ws?.name ?? 'unknown'}
PROJECT PATH: ${wsPath}

FILE TREE:
${fileTree.stdout}

${ws?.contextNotes ? `CONTEXT NOTES:\n${ws.contextNotes}` : ''}
${ws?.todos ? `TODOs:\n${ws.todos}` : ''}

RULES:
- Return a JSON object with:
  - "plan": string[] (human-readable steps)
  - "commands": [{ "cmd": string, "reason": string, "dangerous": boolean }]
  - "summary": string (one-line description)
- Each command runs in the workspace directory (${wsPath})
- For system-wide installs, prefix with sudo
- Set "dangerous": true for destructive commands (rm -rf, drop, format, etc.)
- Be thorough — include verification commands (e.g. check if install succeeded)

Return ONLY valid JSON.`,
        },
        { role: 'user', content: body.message },
      ],
      { model: modelName, maxTokens: 4096 },
    )

    let plan: { plan?: string[]; commands?: { cmd: string; reason: string; dangerous?: boolean }[]; summary?: string }
    try { plan = JSON.parse(aiResult.content) } catch { plan = { summary: aiResult.content, commands: [] } }

    if (!body.autoExecute) {
      conn.end()
      return ok(res, { plan: plan.plan, commands: plan.commands, summary: plan.summary, executed: false })
    }

    const results: { cmd: string; reason: string; stdout: string; stderr: string; exitCode: number; success: boolean }[] = []
    for (const c of (plan.commands ?? [])) {
      try {
        const r = await execSsh(conn, `cd "${wsPath}" && ${c.cmd}`)
        results.push({ cmd: c.cmd, reason: c.reason, stdout: r.stdout.slice(0, 5000), stderr: r.stderr.slice(0, 2000), exitCode: r.code, success: r.code === 0 })
      } catch (e) {
        results.push({ cmd: c.cmd, reason: c.reason, stdout: '', stderr: e instanceof Error ? e.message : 'Failed', exitCode: 1, success: false })
      }
    }
    conn.end()

    const succeeded = results.filter((r) => r.success).length
    return ok(res, {
      plan: plan.plan,
      summary: plan.summary,
      executed: true,
      results,
      succeeded,
      total: results.length,
    })
  } catch (e) { return serverError(res, e) }
})

export default router
