import { Router } from 'express'
import { Octokit } from '@octokit/rest'
import prisma from '@/lib/prisma'
import { env } from '@/config/env'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { ok, badRequest, serverError, notFound, forbidden } from '@/lib/response'
import path from 'path'

const router = Router()
const CEO_ROLES = ['CEO', 'CO_MD']

function requireExec(req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) {
  if (!CEO_ROLES.includes(String(req.user!.role))) return forbidden(res, 'GitHub access is CEO/MD only')
  next()
}

router.use(authenticate, requireStaff, requireExec as any)

function mimeFromName(name: string): string {
  const ext = path.extname(name).toLowerCase()
  const map: Record<string, string> = { '.ts': 'text/typescript', '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.css': 'text/css', '.md': 'text/markdown', '.py': 'text/x-python', '.txt': 'text/plain' }
  return map[ext] ?? 'text/plain'
}

// ── OAuth Flow ────────────────────────────────────────────────

router.get('/auth-url', (_req: AuthRequest, res) => {
  if (!env.GITHUB_CLIENT_ID) return badRequest(res, 'GITHUB_CLIENT_ID not configured')
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: env.GITHUB_CALLBACK_URL,
    scope: 'repo read:user',
    state: Math.random().toString(36).slice(2),
  })
  return ok(res, { url: `https://github.com/login/oauth/authorize?${params}` })
})

router.post('/callback', async (req: AuthRequest, res) => {
  try {
    const { code } = req.body as { code?: string }
    if (!code) return badRequest(res, 'Missing code')

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
    if (!tokenData.access_token) return badRequest(res, tokenData.error ?? 'OAuth failed')

    const octokit = new Octokit({ auth: tokenData.access_token })
    const { data: ghUser } = await octokit.users.getAuthenticated()

    await prisma.gitHubConnection.upsert({
      where: { staffId: req.user!.id },
      create: {
        staffId: req.user!.id,
        accessToken: tokenData.access_token,
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
      },
      update: {
        accessToken: tokenData.access_token,
        username: ghUser.login,
        avatarUrl: ghUser.avatar_url,
      },
    })

    return ok(res, { username: ghUser.login, avatarUrl: ghUser.avatar_url })
  } catch (e) { return serverError(res, e) }
})

router.get('/status', async (req: AuthRequest, res) => {
  const conn = await prisma.gitHubConnection.findUnique({ where: { staffId: req.user!.id } })
  if (!conn) return ok(res, { connected: false })
  return ok(res, { connected: true, username: conn.username, avatarUrl: conn.avatarUrl })
})

router.delete('/disconnect', async (req: AuthRequest, res) => {
  await prisma.gitHubConnection.deleteMany({ where: { staffId: req.user!.id } })
  return ok(res, { message: 'Disconnected' })
})

// ── Repo Operations ───────────────────────────────────────────

async function getOctokit(staffId: string): Promise<Octokit | null> {
  const conn = await prisma.gitHubConnection.findUnique({ where: { staffId } })
  if (!conn) return null
  return new Octokit({ auth: conn.accessToken })
}

router.get('/repos', async (req: AuthRequest, res) => {
  try {
    const octokit = await getOctokit(req.user!.id)
    if (!octokit) return badRequest(res, 'GitHub not connected')
    const { data } = await octokit.repos.listForAuthenticatedUser({ sort: 'updated', per_page: 50 })
    return ok(res, data.map((r) => ({
      id: r.id, name: r.name, fullName: r.full_name, private: r.private,
      description: r.description, defaultBranch: r.default_branch,
      url: r.html_url, updatedAt: r.updated_at,
    })))
  } catch (e) { return serverError(res, e) }
})

router.post('/workspace/:id/clone', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } })
    if (!ws) return notFound(res, 'Workspace')
    const { repoFullName, branch } = req.body as { repoFullName: string; branch?: string }
    if (!repoFullName) return badRequest(res, 'repoFullName required')

    const octokit = await getOctokit(req.user!.id)
    if (!octokit) return badRequest(res, 'GitHub not connected')

    const [owner, repo] = repoFullName.split('/')
    if (!owner || !repo) return badRequest(res, 'Invalid repo name')

    const targetBranch = branch || 'main'
    let tree: any[]
    try {
      const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${targetBranch}` })
      const { data: treeData } = await octokit.git.getTree({ owner, repo, tree_sha: refData.object.sha, recursive: 'true' })
      tree = treeData.tree.filter((t: any) => t.type === 'blob')
    } catch {
      return badRequest(res, `Branch "${targetBranch}" not found`)
    }

    await prisma.workspaceFile.deleteMany({ where: { workspaceId: ws.id } })

    let cloned = 0
    for (const item of tree.slice(0, 200)) {
      try {
        const { data: blob } = await octokit.git.getBlob({ owner, repo, file_sha: item.sha })
        const content = blob.encoding === 'base64' ? Buffer.from(blob.content, 'base64').toString('utf8') : blob.content

        const filePath = item.path as string
        const dirParts = path.dirname(filePath).split('/').filter((p) => p !== '.')
        for (let i = 0; i < dirParts.length; i++) {
          const dp = dirParts.slice(0, i + 1).join('/')
          await prisma.workspaceFile.upsert({
            where: { workspaceId_path: { workspaceId: ws.id, path: dp } },
            create: { workspaceId: ws.id, path: dp, name: dirParts[i]!, isDirectory: true },
            update: {},
          })
        }

        await prisma.workspaceFile.upsert({
          where: { workspaceId_path: { workspaceId: ws.id, path: filePath } },
          create: {
            workspaceId: ws.id, path: filePath, name: path.basename(filePath),
            mimeType: mimeFromName(filePath), size: Buffer.byteLength(content, 'utf8'), content,
          },
          update: { content, size: Buffer.byteLength(content, 'utf8') },
        })
        cloned++
      } catch { /* skip binary/large files */ }
    }

    await prisma.workspace.update({
      where: { id: ws.id },
      data: { githubRepoUrl: `https://github.com/${repoFullName}`, githubBranch: targetBranch },
    })

    return ok(res, { message: `Cloned ${cloned} files from ${repoFullName}`, files: cloned })
  } catch (e) { return serverError(res, e) }
})

router.post('/workspace/:id/push', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } })
    if (!ws || !ws.githubRepoUrl) return badRequest(res, 'Workspace not linked to a repo')

    const octokit = await getOctokit(req.user!.id)
    if (!octokit) return badRequest(res, 'GitHub not connected')

    const repoMatch = ws.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!repoMatch) return badRequest(res, 'Invalid repo URL')
    const [, owner, repo] = repoMatch
    const branch = ws.githubBranch || 'main'
    const commitMsg = (req.body as any)?.message || `Update from PouchCare workspace: ${ws.name}`

    const files = await prisma.workspaceFile.findMany({
      where: { workspaceId: ws.id, isDirectory: false },
    })

    const { data: ref } = await octokit.git.getRef({ owner: owner!, repo: repo!, ref: `heads/${branch}` })
    const { data: baseCommit } = await octokit.git.getCommit({ owner: owner!, repo: repo!, commit_sha: ref.object.sha })

    const blobs = await Promise.all(
      files.map(async (f) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: owner!, repo: repo!,
          content: f.content ?? '',
          encoding: 'utf-8',
        })
        return { path: f.path, mode: '100644' as const, type: 'blob' as const, sha: blob.sha }
      }),
    )

    const { data: newTree } = await octokit.git.createTree({
      owner: owner!, repo: repo!,
      base_tree: baseCommit.tree.sha,
      tree: blobs,
    })

    const { data: newCommit } = await octokit.git.createCommit({
      owner: owner!, repo: repo!,
      message: commitMsg,
      tree: newTree.sha,
      parents: [ref.object.sha],
    })

    await octokit.git.updateRef({
      owner: owner!, repo: repo!,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    })

    return ok(res, { message: `Pushed ${files.length} files to ${owner}/${repo}`, sha: newCommit.sha })
  } catch (e) { return serverError(res, e) }
})

router.post('/workspace/:id/pull', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.id, ownerId: req.user!.id } })
    if (!ws || !ws.githubRepoUrl) return badRequest(res, 'Workspace not linked to a repo')

    const repoMatch = ws.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!repoMatch) return badRequest(res, 'Invalid repo URL')
    const [, owner, repo] = repoMatch

    const mockReq = { ...req, params: { ...req.params }, body: { repoFullName: `${owner}/${repo}`, branch: ws.githubBranch || 'main' } }
    return (router as any).handle(
      Object.assign(mockReq, { url: `/workspace/${ws.id}/clone`, method: 'POST' }),
      res,
      () => {},
    )
  } catch (e) { return serverError(res, e) }
})

export default router
