import { Router } from 'express'
import prisma from '@/lib/prisma'
import { requireRoles, SENIOR_ROLES, type AuthRequest } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { assertRouteBranchId } from '@/lib/monitorBranchScope'
import { validate } from '@/middleware/validate'
import { badRequest, err, notFound, ok, serverError } from '@/utils/response'
import { encryptCredential, decryptCredential } from '@/lib/credentialsCrypto'
import {
  vigiObtainAccessToken,
  vigiFetchAddedDevices,
  normalizeAddedDevicesPayload,
  vigiProbe,
  type VigiConnection,
} from '@/lib/vigiOpenApi'
import { buildVigiLiveRtsp } from '@/lib/vigiRtsp'
import { vigiCloudDiscoverSchema, vigiTestBodySchema, vigiUpsertSchema } from '@/routes/assets/vigiSchemas'
import { tplinkCloudListDevices } from '@/lib/tplinkCloudDiscover'

const router = Router()

function classifyVigiRouteError(e: unknown): { status: number; message: string; code: string } {
  const msg = e instanceof Error ? e.message : String(e)
  if (/Unsupported credential blob format/.test(msg)) {
    return {
      status: 503,
      message:
        'Stored VIGI password could not be decrypted. Re-save the integration with the NVR password (Settings → same branch).',
      code: 'VIGI_CREDENTIALS',
    }
  }
  if (
    /ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|ENETUNREACH|getaddrinfo|certificate|SELF_SIGNED|unable to verify|EPROTO/i.test(
      msg,
    )
  ) {
    return {
      status: 503,
      message: `Cannot reach the NVR from the API server (network/TLS). ${msg}`,
      code: 'VIGI_NETWORK',
    }
  }
  if (/VIGI token:|VIGI added_devices:/.test(msg)) {
    return { status: 502, message: msg, code: 'VIGI_UPSTREAM' }
  }
  return { status: 500, message: msg, code: 'SERVER_ERROR' }
}

/** Host + port from pasted URLs (e.g. https://192.168.1.10:20443/path). */
function parseVigiHost(raw: string, fallbackPort: number): { host: string; port: number } {
  const trimmed = raw.trim()
  try {
    const u = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`)
    const host = u.hostname.replace(/^\[|\]$/g, '')
    const port = u.port ? parseInt(u.port, 10) : fallbackPort
    return { host, port }
  } catch {
    const h = trimmed.replace(/^https?:\/\//i, '').split('/')[0]?.trim() ?? trimmed
    return { host: h, port: fallbackPort }
  }
}

function toConn(
  host: string,
  port: number,
  username: string,
  password: string,
  tlsAllowInsecure: boolean,
): VigiConnection {
  return { host, port, username, password, tlsAllowInsecure }
}

/** POST /v1/assets/vigi/branches/:branchId/test — probe using saved integration credentials. */
router.post('/branches/:branchId/test', requireRoles(...(SENIOR_ROLES as any)), async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } })
    if (!branch) return notFound(res, 'Branch')
    const integration = await prisma.vigiNvrIntegration.findUnique({ where: { branchId: req.params.branchId } })
    if (!integration) return notFound(res, 'VIGI integration')
    const password = decryptCredential(integration.passwordEncrypted)
    const conn = toConn(
      integration.host,
      integration.port,
      integration.username,
      password,
      integration.tlsAllowInsecure,
    )
    const result = await vigiProbe(conn)
    if (!result.ok) return badRequest(res, result.error ?? 'VIGI probe failed')
    return ok(res, { deviceCount: result.deviceCount, sample: result.sample })
  } catch (err) {
    return serverError(res, err)
  }
})

/** POST /v1/assets/vigi/cloud/discover — TP-Link account email/password; returns devices (IPs when cloud reports them). */
router.post(
  '/cloud/discover',
  requireRoles(...(SENIOR_ROLES as any)),
  validate(vigiCloudDiscoverSchema),
  async (req, res) => {
    try {
      const b = req.body as { email: string; password: string }
      const { devices, cloudUrlUsed } = await tplinkCloudListDevices(b.email, b.password)
      return ok(res, {
        devices,
        cloudUrlUsed,
        hint:
          'Use an NVR row’s IP as host if shown. OpenAPI still needs NVR login (username often "admin") — save password below; it may match your TP-Link password.',
      })
    } catch (err) {
      return serverError(res, err)
    }
  },
)

/** POST /v1/assets/vigi/test — probe NVR without saving (Digest + added_devices). */
router.post(
  '/test',
  requireRoles(...(SENIOR_ROLES as any)),
  validate(vigiTestBodySchema),
  async (req, res) => {
    try {
      const b = req.body as {
        host: string
        port?: number
        username?: string
        password: string
        tlsAllowInsecure?: boolean
      }
      const fb = b.port ?? 20443
      const parsed = parseVigiHost(b.host, fb)
      const port = b.port ?? parsed.port
      const conn = toConn(parsed.host, port, b.username ?? 'admin', b.password, b.tlsAllowInsecure ?? false)
      const result = await vigiProbe(conn)
      if (!result.ok) {
        return badRequest(res, result.error ?? 'VIGI probe failed')
      }
      return ok(res, {
        deviceCount: result.deviceCount,
        sample: result.sample,
      })
    } catch (err) {
      return serverError(res, err)
    }
  },
)

/** GET /v1/assets/vigi/branches/:branchId — integration metadata (no secrets). */
router.get('/branches/:branchId', requirePermission('monitor.view'), async (req: AuthRequest, res) => {
  try {
    if (!(await assertRouteBranchId(req, res, req.params.branchId))) return
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } })
    if (!branch) return notFound(res, 'Branch')

    const row = await prisma.vigiNvrIntegration.findUnique({ where: { branchId: req.params.branchId } })
    if (!row) {
      return ok(res, null)
    }

    return ok(res, {
      id: row.id,
      branchId: row.branchId,
      host: row.host,
      port: row.port,
      username: row.username,
      hasPassword: true,
      tlsAllowInsecure: row.tlsAllowInsecure,
      enabled: row.enabled,
      lastSyncAt: row.lastSyncAt,
      lastError: row.lastError,
      updatedAt: row.updatedAt,
    })
  } catch (err) {
    return serverError(res, err)
  }
})

/** PUT /v1/assets/vigi/branches/:branchId — create or update integration. */
router.put(
  '/branches/:branchId',
  requireRoles(...(SENIOR_ROLES as any)),
  validate(vigiUpsertSchema),
  async (req, res) => {
    try {
      const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } })
      if (!branch) return notFound(res, 'Branch')

      const body = req.body as {
        host: string
        port?: number
        username?: string
        password?: string
        tlsAllowInsecure?: boolean
        enabled?: boolean
      }
      const existing = await prisma.vigiNvrIntegration.findUnique({ where: { branchId: req.params.branchId } })

      let passwordEnc: string
      if (body.password) {
        passwordEnc = encryptCredential(body.password)
      } else if (existing) {
        passwordEnc = existing.passwordEncrypted
      } else {
        return badRequest(res, 'password is required when creating a VIGI integration')
      }

      const fb = body.port ?? 20443
      const parsed = parseVigiHost(body.host, fb)
      const port = body.port ?? parsed.port
      const host = parsed.host
      const tls = body.tlsAllowInsecure ?? false
      const enabled = body.enabled ?? true

      const row = await prisma.vigiNvrIntegration.upsert({
        where: { branchId: req.params.branchId },
        create: {
          branchId: req.params.branchId,
          host,
          port,
          username: body.username,
          passwordEncrypted: passwordEnc,
          tlsAllowInsecure: tls,
          enabled,
        },
        update: {
          host,
          port,
          username: body.username,
          passwordEncrypted: passwordEnc,
          tlsAllowInsecure: tls,
          enabled,
        },
      })

      return ok(res, {
        id: row.id,
        branchId: row.branchId,
        host: row.host,
        port: row.port,
        username: row.username,
        hasPassword: true,
        tlsAllowInsecure: row.tlsAllowInsecure,
        enabled: row.enabled,
        lastSyncAt: row.lastSyncAt,
        lastError: row.lastError,
        updatedAt: row.updatedAt,
      })
    } catch (err) {
      return serverError(res, err)
    }
  },
)

/** DELETE /v1/assets/vigi/branches/:branchId */
router.delete('/branches/:branchId', requireRoles(...(SENIOR_ROLES as any)), async (req, res) => {
  try {
    const existing = await prisma.vigiNvrIntegration.findUnique({ where: { branchId: req.params.branchId } })
    if (!existing) return notFound(res, 'VIGI integration')

    await prisma.$transaction([
      prisma.cameraDevice.updateMany({
        where: { vigiIntegrationId: existing.id },
        data: { vigiSyncKey: null, vigiChannel: null, vigiIntegrationId: null, source: 'manual' },
      }),
      prisma.vigiNvrIntegration.delete({ where: { id: existing.id } }),
    ])

    return ok(res, { message: 'VIGI integration removed; linked cameras were detached' })
  } catch (err) {
    return serverError(res, err)
  }
})

/** POST /v1/assets/vigi/branches/:branchId/sync — pull cameras from NVR into camera_devices. */
router.post('/branches/:branchId/sync', requireRoles(...(SENIOR_ROLES as any)), async (req, res) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } })
    if (!branch) return notFound(res, 'Branch')

    const integration = await prisma.vigiNvrIntegration.findUnique({ where: { branchId: req.params.branchId } })
    if (!integration) return notFound(res, 'VIGI integration')
    if (!integration.enabled) return badRequest(res, 'VIGI integration is disabled')

    const password = decryptCredential(integration.passwordEncrypted)
    const conn = toConn(
      integration.host,
      integration.port,
      integration.username,
      password,
      integration.tlsAllowInsecure,
    )

    const { accessToken } = await vigiObtainAccessToken(conn)
    const raw = await vigiFetchAddedDevices(conn, accessToken)
    const channels = normalizeAddedDevicesPayload(raw)

    let created = 0
    let updated = 0

    for (const ch of channels) {
      const syncKey = `${integration.id}:${ch.channel}`
      const label = ch.label || `VIGI CH${ch.channel}`
      const ip = ch.ip ?? undefined

      const existingCam = await prisma.cameraDevice.findFirst({
        where: { vigiSyncKey: syncKey },
      })

      const rtspMain = buildVigiLiveRtsp(integration.host, ch.channel, 1)

      const data = {
        branchId: branch.id,
        branchName: branch.name,
        label,
        ipAddress: ip ?? null,
        location: `VIGI channel ${ch.channel}`,
        streamUrl: null,
        rtspUrl: rtspMain,
        status: 'online' as const,
        resolution: '1080p',
        nvrDevice: ch.model ? `VIGI ${ch.model}` : 'VIGI NVR',
        source: 'vigi',
        vigiIntegrationId: integration.id,
        vigiChannel: ch.channel,
        vigiSyncKey: syncKey,
        notes: `Imported from TP-Link VIGI OpenAPI. Raw keys: ${Object.keys(ch.raw).slice(0, 8).join(', ')}`,
      }

      if (existingCam) {
        await prisma.cameraDevice.update({
          where: { id: existingCam.id },
          data: {
            label,
            ipAddress: ip ?? existingCam.ipAddress,
            nvrDevice: data.nvrDevice,
            rtspUrl: rtspMain,
            status: 'online',
            lastPingAt: new Date(),
          },
        })
        updated++
      } else {
        await prisma.cameraDevice.create({ data })
        created++
      }
    }

    await prisma.vigiNvrIntegration.update({
      where: { id: integration.id },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
      },
    })

    return ok(res, {
      created,
      updated,
      totalFromNvr: channels.length,
      branchId: branch.id,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    try {
      const integration = await prisma.vigiNvrIntegration.findUnique({
        where: { branchId: req.params.branchId },
      })
      if (integration) {
        await prisma.vigiNvrIntegration.update({
          where: { id: integration.id },
          data: { lastError: msg.slice(0, 2000) },
        })
      }
    } catch {
      /* ignore */
    }
    const c = classifyVigiRouteError(e)
    return err(res, c.message, c.code, c.status)
  }
})

export default router
