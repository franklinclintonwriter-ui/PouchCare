/**
 * TP-Link VIGI NVR OpenAPI (local HTTPS, default port 20443).
 * @see https://www.tp-link.com/en/support/faq/4797/
 *
 * Auth: Digest with SHA-256 (A1 = SHA256(user:realm:pass), A2 = SHA256(method:uri),
 * response = SHA256(A1:nonce:A2)), then Bearer access_token for API calls.
 */

import * as https from 'https'
import type { IncomingHttpHeaders } from 'http'
import { createHash } from 'crypto'

export type VigiConnection = {
  host: string
  port: number
  username: string
  password: string
  tlsAllowInsecure: boolean
}

export function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

function parseDigestChallenge(wwwAuthenticate: string | undefined): { realm: string; nonce: string } {
  if (!wwwAuthenticate) return { realm: 'TP-LINK NVR', nonce: '' }
  const realm = /realm="([^"]*)"/i.exec(wwwAuthenticate)?.[1] ?? 'TP-LINK NVR'
  const nonce = /nonce="([^"]*)"/i.exec(wwwAuthenticate)?.[1] ?? ''
  return { realm, nonce }
}

function buildDigestAuthorization(
  params: {
    username: string
    password: string
    realm: string
    nonce: string
    method: string
    uriPath: string
  },
): string {
  const { username, password, realm, nonce, method, uriPath } = params
  const A1 = sha256Hex(`${username}:${realm}:${password}`)
  const A2 = sha256Hex(`${method}:${uriPath}`)
  const response = sha256Hex(`${A1}:${nonce}:${A2}`)
  return (
    `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uriPath}", ` +
    `response="${response}", algorithm=SHA-256`
  )
}

type RawResponse = { statusCode: number; headers: IncomingHttpHeaders; body: string }

function httpsJson(
  host: string,
  port: number,
  pathWithQuery: string,
  options: {
    method: string
    headers: Record<string, string>
    tlsAllowInsecure: boolean
  },
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host,
        port,
        path: pathWithQuery,
        method: options.method,
        headers: options.headers,
        rejectUnauthorized: !options.tlsAllowInsecure,
        servername: host,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c as Buffer))
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8')
          resolve({ statusCode: res.statusCode ?? 0, headers: res.headers, body })
        })
      },
    )
    req.on('error', reject)
    req.end()
  })
}

function extractAccessToken(body: string): string | null {
  try {
    const j = JSON.parse(body) as Record<string, unknown>
    const candidates = [
      j.access_token,
      j.accessToken,
      (j.data as Record<string, unknown> | undefined)?.access_token,
      (j.result as Record<string, unknown> | undefined)?.access_token,
    ]
    for (const c of candidates) {
      if (typeof c === 'string' && c.length > 0) {
        try {
          return decodeURIComponent(c)
        } catch {
          return c
        }
      }
    }
    return null
  } catch {
    return null
  }
}

/** Step 1–2: obtain Bearer access_token from /openapi/token */
export async function vigiObtainAccessToken(conn: VigiConnection): Promise<{ accessToken: string; rawBody: string }> {
  const uriPath = '/openapi/token'
  const first = await httpsJson(conn.host, conn.port, uriPath, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    tlsAllowInsecure: conn.tlsAllowInsecure,
  })

  const www =
    (first.headers['www-authenticate'] as string | undefined) ??
    (first.headers['WWW-Authenticate'] as string | undefined)

  if (first.statusCode !== 401 || !www) {
    const tok = extractAccessToken(first.body)
    if (tok) return { accessToken: tok, rawBody: first.body }
    throw new Error(
      `VIGI token: expected 401 + Digest challenge, got HTTP ${first.statusCode}. Body: ${first.body.slice(0, 200)}`,
    )
  }

  const { realm, nonce } = parseDigestChallenge(www)
  if (!nonce) {
    throw new Error('VIGI token: missing nonce in WWW-Authenticate header')
  }

  const auth = buildDigestAuthorization({
    username: conn.username,
    password: conn.password,
    realm,
    nonce,
    method: 'GET',
    uriPath,
  })

  const second = await httpsJson(conn.host, conn.port, uriPath, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: auth,
    },
    tlsAllowInsecure: conn.tlsAllowInsecure,
  })

  if (second.statusCode >= 400) {
    throw new Error(`VIGI token: HTTP ${second.statusCode} ${second.body.slice(0, 400)}`)
  }

  const accessToken = extractAccessToken(second.body)
  if (!accessToken) {
    throw new Error(`VIGI token: no access_token in response: ${second.body.slice(0, 400)}`)
  }

  return { accessToken, rawBody: second.body }
}

/** GET /openapi/added_devices — channel / camera list (shape varies by firmware). */
export async function vigiFetchAddedDevices(conn: VigiConnection, accessToken: string): Promise<unknown> {
  const path = '/openapi/added_devices'
  const res = await httpsJson(conn.host, conn.port, path, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    tlsAllowInsecure: conn.tlsAllowInsecure,
  })
  if (res.statusCode >= 400) {
    throw new Error(`VIGI added_devices: HTTP ${res.statusCode} ${res.body.slice(0, 400)}`)
  }
  try {
    return JSON.parse(res.body) as unknown
  } catch {
    return { raw: res.body }
  }
}

export type NormalizedVigiChannel = {
  channel: number
  label: string
  ip: string | null
  model: string | null
  raw: Record<string, unknown>
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10)
  return null
}

/** Best-effort normalization across firmware JSON shapes. */
export function normalizeAddedDevicesPayload(payload: unknown): NormalizedVigiChannel[] {
  const out: NormalizedVigiChannel[] = []

  const pushFromObject = (o: Record<string, unknown>, indexFallback: number) => {
    const channel =
      num(o.channel) ??
      num(o.Channel) ??
      num(o.channel_id) ??
      num(o.channelId) ??
      num(o.ch) ??
      indexFallback
    if (channel == null || channel < 0) return

    const label =
      (typeof o.name === 'string' && o.name) ||
      (typeof o.device_name === 'string' && o.device_name) ||
      (typeof o.deviceName === 'string' && o.deviceName) ||
      (typeof o.DeviceName === 'string' && o.DeviceName) ||
      `Channel ${channel}`

    const ip =
      (typeof o.ip === 'string' && o.ip) ||
      (typeof o.ip_address === 'string' && o.ip_address) ||
      (typeof o.ipAddress === 'string' && o.ipAddress) ||
      (typeof o.IPAddress === 'string' && o.IPAddress) ||
      null

    const model =
      (typeof o.model === 'string' && o.model) ||
      (typeof o.model_name === 'string' && o.model_name) ||
      (typeof o.device_model === 'string' && o.device_model) ||
      null

    out.push({ channel, label, ip, model, raw: o })
  }

  const visit = (node: unknown, depth = 0): void => {
    if (depth > 8) return
    if (node == null) return
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          pushFromObject(item as Record<string, unknown>, i + 1)
        } else {
          visit(item, depth + 1)
        }
      })
      return
    }
    if (typeof node === 'object') {
      const o = node as Record<string, unknown>
      const arrays = ['data', 'devices', 'device_list', 'added_devices', 'list', 'result', 'channels', 'channel_list']
      for (const k of arrays) {
        if (Array.isArray(o[k])) {
          visit(o[k], depth + 1)
        }
      }
      for (const v of Object.values(o)) {
        if (Array.isArray(v)) visit(v, depth + 1)
      }
      if (typeof o.channel !== 'undefined' || typeof o.Channel !== 'undefined') {
        pushFromObject(o, 0)
      }
    }
  }

  visit(payload, 0)

  const seen = new Set<number>()
  const dedup: NormalizedVigiChannel[] = []
  for (const row of out.sort((a, b) => a.channel - b.channel)) {
    if (seen.has(row.channel)) continue
    seen.add(row.channel)
    dedup.push(row)
  }
  return dedup
}

export async function vigiProbe(conn: VigiConnection): Promise<{
  ok: boolean
  deviceCount?: number
  error?: string
  sample?: NormalizedVigiChannel[]
}> {
  try {
    const { accessToken } = await vigiObtainAccessToken(conn)
    const raw = await vigiFetchAddedDevices(conn, accessToken)
    const norm = normalizeAddedDevicesPayload(raw)
    return { ok: true, deviceCount: norm.length, sample: norm.slice(0, 16) }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
