import { Router } from 'express'
import prisma from '@/lib/prisma'
import { env } from '@/config/env'
import type { AuthRequest } from '@/middleware/auth'
import { authenticate, requireStaff } from '@/middleware/auth'
import { ok, badRequest, serverError, forbidden } from '@/lib/response'

const router = Router()
const CEO_ROLES = ['CEO', 'CO_MD']

function requireExec(req: AuthRequest, res: import('express').Response, next: import('express').NextFunction) {
  if (!CEO_ROLES.includes(String(req.user!.role))) return forbidden(res, 'Integrations are CEO/MD only')
  next()
}

router.use(authenticate, requireStaff, requireExec as any)

type ProviderConfig = {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'code' | 'deploy' | 'docs' | 'storage' | 'analytics'
  authType: 'oauth' | 'token' | 'configured'
  configured: boolean
  docsUrl: string
}

function getProviderConfigs(): ProviderConfig[] {
  return [
    {
      id: 'github', name: 'GitHub', description: 'Repositories, branches, push/pull',
      icon: 'github', color: '#333', category: 'code', authType: 'oauth',
      configured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      docsUrl: 'https://github.com/settings/developers',
    },
    {
      id: 'cloudflare', name: 'Cloudflare', description: 'Pages deploy, R2 storage, Workers',
      icon: 'cloud', color: '#f38020', category: 'deploy', authType: 'configured',
      configured: Boolean(env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID),
      docsUrl: 'https://dash.cloudflare.com',
    },
    {
      id: 'notion', name: 'Notion', description: 'Sync docs, pages, databases',
      icon: 'file-text', color: '#000', category: 'docs', authType: 'oauth',
      configured: Boolean(env.NOTION_CLIENT_ID && env.NOTION_CLIENT_SECRET),
      docsUrl: 'https://www.notion.so/my-integrations',
    },
  ]
}

// GET /integrations — list all available providers + connection status
router.get('/', async (req: AuthRequest, res) => {
  try {
    const providers = getProviderConfigs()
    const connections = await prisma.integrationConnection.findMany({
      where: { staffId: req.user!.id },
      select: { provider: true, displayName: true, avatarUrl: true, createdAt: true },
    })

    const ghConn = await prisma.gitHubConnection.findUnique({
      where: { staffId: req.user!.id },
      select: { username: true, avatarUrl: true, createdAt: true },
    })

    const connMap = new Map(connections.map((c) => [c.provider, c]))

    const result = providers.map((p) => {
      if (p.id === 'github' && ghConn) {
        return { ...p, connected: true, displayName: ghConn.username, avatarUrl: ghConn.avatarUrl, connectedAt: ghConn.createdAt }
      }
      if (p.id === 'cloudflare' && p.configured) {
        return { ...p, connected: true, displayName: 'R2 Storage', connectedAt: null }
      }
      const conn = connMap.get(p.id)
      if (conn) {
        return { ...p, connected: true, displayName: conn.displayName, avatarUrl: conn.avatarUrl, connectedAt: conn.createdAt }
      }
      return { ...p, connected: false, displayName: null, avatarUrl: null, connectedAt: null }
    })

    return ok(res, result)
  } catch (e) { return serverError(res, e) }
})

// POST /integrations/:provider/connect — connect with a token (works for ALL providers including GitHub)
router.post('/:provider/connect', async (req: AuthRequest, res) => {
  try {
    const { provider } = req.params
    const { token, displayName } = req.body as { token?: string; displayName?: string }
    if (!token) return badRequest(res, 'Token is required')

    const providers = getProviderConfigs()
    const config = providers.find((p) => p.id === provider)
    if (!config) return badRequest(res, 'Unknown provider')

    if (provider === 'github') {
      try {
        const { Octokit } = await import('@octokit/rest')
        const octokit = new Octokit({ auth: token })
        const { data: ghUser } = await octokit.users.getAuthenticated()
        await prisma.gitHubConnection.upsert({
          where: { staffId: req.user!.id },
          create: { staffId: req.user!.id, accessToken: token, username: ghUser.login, avatarUrl: ghUser.avatar_url },
          update: { accessToken: token, username: ghUser.login, avatarUrl: ghUser.avatar_url },
        })
        return ok(res, { message: `GitHub connected as ${ghUser.login}`, username: ghUser.login })
      } catch {
        return badRequest(res, 'Invalid GitHub token — make sure it has "repo" and "read:user" scopes')
      }
    }

    await prisma.integrationConnection.upsert({
      where: { staffId_provider: { staffId: req.user!.id, provider } },
      create: { staffId: req.user!.id, provider, accessToken: token, displayName: displayName ?? provider },
      update: { accessToken: token, displayName: displayName ?? provider },
    })

    return ok(res, { message: `${config.name} connected` })
  } catch (e) { return serverError(res, e) }
})

// DELETE /integrations/:provider — disconnect
router.delete('/:provider', async (req: AuthRequest, res) => {
  try {
    if (req.params.provider === 'github') {
      await prisma.gitHubConnection.deleteMany({ where: { staffId: req.user!.id } })
    }
    await prisma.integrationConnection.deleteMany({
      where: { staffId: req.user!.id, provider: req.params.provider },
    })
    return ok(res, { message: 'Disconnected' })
  } catch (e) { return serverError(res, e) }
})

// ── Notion OAuth ──────────────────────────────────────────────

router.get('/notion/auth-url', (_req: AuthRequest, res) => {
  if (!env.NOTION_CLIENT_ID) return badRequest(res, 'NOTION_CLIENT_ID not configured')
  const params = new URLSearchParams({
    client_id: env.NOTION_CLIENT_ID,
    redirect_uri: env.NOTION_REDIRECT_URI,
    response_type: 'code',
    owner: 'user',
  })
  return ok(res, { url: `https://api.notion.com/v1/oauth/authorize?${params}` })
})

router.post('/notion/callback', async (req: AuthRequest, res) => {
  try {
    const { code } = req.body as { code?: string }
    if (!code) return badRequest(res, 'Missing code')

    const auth = Buffer.from(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`).toString('base64')
    const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: env.NOTION_REDIRECT_URI }),
    })
    const data = await tokenRes.json() as { access_token?: string; workspace_name?: string; owner?: { user?: { name?: string; avatar_url?: string } }; error?: string }
    if (!data.access_token) return badRequest(res, data.error ?? 'Notion OAuth failed')

    await prisma.integrationConnection.upsert({
      where: { staffId_provider: { staffId: req.user!.id, provider: 'notion' } },
      create: {
        staffId: req.user!.id,
        provider: 'notion',
        accessToken: data.access_token,
        displayName: data.workspace_name ?? data.owner?.user?.name ?? 'Notion',
        avatarUrl: data.owner?.user?.avatar_url,
      },
      update: {
        accessToken: data.access_token,
        displayName: data.workspace_name ?? data.owner?.user?.name ?? 'Notion',
        avatarUrl: data.owner?.user?.avatar_url,
      },
    })

    return ok(res, { message: 'Notion connected', workspace: data.workspace_name })
  } catch (e) { return serverError(res, e) }
})

// ── Cloudflare Deploy ─────────────────────────────────────────

router.post('/cloudflare/deploy/:workspaceId', async (req: AuthRequest, res) => {
  try {
    const ws = await prisma.workspace.findFirst({ where: { id: req.params.workspaceId, ownerId: req.user!.id } })
    if (!ws) return badRequest(res, 'Workspace not found')

    if (!env.CLOUDFLARE_PAGES_PROJECT) {
      return ok(res, {
        message: 'Cloudflare Pages deployment requires CLOUDFLARE_PAGES_PROJECT env var. Your files are stored in R2.',
        deployed: false,
      })
    }

    return ok(res, { message: 'Cloudflare R2 storage is connected. Pages deployment coming soon.', deployed: false })
  } catch (e) { return serverError(res, e) }
})

export default router
