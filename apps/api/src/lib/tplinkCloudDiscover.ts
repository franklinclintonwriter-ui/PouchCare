/**
 * Best-effort TP-Link cloud login + device list (same flow as the Tapo / VIGI mobile apps use).
 * Used to discover NVR/camera IPs for the branch form — VIGI OpenAPI on the NVR still uses digest auth separately.
 *
 * Unofficial API; may change. Tries regional cloud endpoints.
 */

import { randomUUID } from 'crypto'

const CLOUD_URLS = [
  'https://eu-wap.tplinkcloud.com/',
  'https://use1-wap.tplinkcloud.com/',
  'https://aps1-wap.tplinkcloud.com/',
] as const

type CloudJson = {
  error_code?: number
  msg?: string
  result?: {
    token?: string
    deviceList?: TplinkRawDevice[]
  }
}

type TplinkRawDevice = {
  deviceType?: string
  alias?: string
  deviceName?: string
  deviceId?: string
  deviceMac?: string
  deviceModel?: string
  ip?: string
  fwVer?: string
  status?: number
  [key: string]: unknown
}

function checkCloudError(data: CloudJson): void {
  const code = data.error_code
  if (code === undefined || code === 0) return
  if (code === -20601) throw new Error('Incorrect email or password')
  if (code === -1501) throw new Error('Invalid credentials')
  if (code === -20675) throw new Error('Cloud token expired or invalid')
  throw new Error(data.msg ?? `TP-Link cloud error ${code}`)
}

/**
 * TP-Link cloud sometimes returns `alias` as base64(UTF-8); other times it is plain text.
 * Blind base64 decode turns plain names into mojibake — only decode when the string looks like base64
 * and the decoded bytes look like real UTF-8 text.
 */
function decodeAlias(alias: unknown): string {
  if (typeof alias !== 'string' || !alias) return ''
  const trimmed = alias.trim()
  if (!trimmed) return ''

  const looksLikeBase64 =
    /^[A-Za-z0-9+/]+=*$/.test(trimmed) && trimmed.length >= 8 && trimmed.length % 4 !== 1

  if (looksLikeBase64) {
    try {
      const buf = Buffer.from(trimmed, 'base64')
      if (buf.length === 0) return trimmed
      const dec = buf.toString('utf8')
      const controlRatio =
        [...dec].filter((ch) => {
          const c = ch.codePointAt(0)!
          return c < 32 && c !== 9 && c !== 10 && c !== 13
        }).length / Math.max(dec.length, 1)
      const replacementRatio =
        [...dec].filter((ch) => ch === '\uFFFD').length / Math.max(dec.length, 1)
      if (controlRatio < 0.08 && replacementRatio < 0.05 && dec.length > 0) {
        return dec
      }
    } catch {
      /* use plain */
    }
  }

  return trimmed
}

async function postCloud(url: string, body: object, token?: string): Promise<CloudJson> {
  const u = new URL(url)
  if (token) u.searchParams.set('token', token)
  const res = await fetch(u.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: CloudJson
  try {
    data = JSON.parse(text) as CloudJson
  } catch {
    throw new Error(`TP-Link cloud: invalid JSON (${res.status}): ${text.slice(0, 200)}`)
  }
  if (!res.ok) {
    throw new Error(`TP-Link cloud: HTTP ${res.status} ${text.slice(0, 200)}`)
  }
  checkCloudError(data)
  return data
}

export type TplinkDiscoveredDevice = {
  deviceId: string
  alias: string
  deviceType: string
  deviceModel: string
  mac: string
  ip: string | null
  status: number | null
  likelyNvr: boolean
}

function isLikelyNvr(d: TplinkRawDevice): boolean {
  const t = (d.deviceType ?? '').toUpperCase()
  const model = (d.deviceModel ?? '').toUpperCase()
  const name = `${d.deviceName ?? ''} ${decodeAlias(d.alias)}`.toUpperCase()
  const blob = `${t} ${model} ${name}`
  return /NVR|RECORDER|NETWORK VIDEO|硬盘录像/i.test(blob)
}

/**
 * Login with TP-Link / VIGI app email + password and return devices visible to that account.
 */
export async function tplinkCloudListDevices(
  email: string,
  password: string,
): Promise<{ devices: TplinkDiscoveredDevice[]; cloudUrlUsed: string }> {
  const trimmedEmail = email.trim()
  const trimmedPass = password
  if (!trimmedEmail || !trimmedPass) {
    throw new Error('Email and password are required')
  }

  let lastErr: Error | null = null
  for (const base of CLOUD_URLS) {
    try {
      const loginBody = {
        method: 'login',
        params: {
          appType: 'Tapo_Android',
          cloudUserName: trimmedEmail,
          cloudPassword: trimmedPass,
          terminalUUID: randomUUID(),
        },
      }
      const loginRes = await postCloud(base, loginBody)
      const token = loginRes.result?.token
      if (!token) {
        throw new Error('TP-Link cloud: no token in login response')
      }

      const listRes = await postCloud(base, { method: 'getDeviceList' }, token)
      const list = listRes.result?.deviceList ?? []

      const devices: TplinkDiscoveredDevice[] = list.map((d: TplinkRawDevice) => {
        const nameFromDevice = typeof d.deviceName === 'string' ? decodeAlias(d.deviceName) : ''
        const nameFromAlias = decodeAlias(d.alias)
        const aliasRaw =
          (nameFromAlias && nameFromAlias.length >= 1 ? nameFromAlias : '') ||
          nameFromDevice ||
          'Device'
        const ip = typeof d.ip === 'string' && d.ip.trim() ? d.ip.trim() : null
        return {
          deviceId: typeof d.deviceId === 'string' ? d.deviceId : '',
          alias: aliasRaw,
          deviceType: typeof d.deviceType === 'string' ? d.deviceType : 'unknown',
          deviceModel: typeof d.deviceModel === 'string' ? d.deviceModel : '',
          mac: typeof d.deviceMac === 'string' ? d.deviceMac : '',
          ip,
          status: typeof d.status === 'number' ? d.status : null,
          likelyNvr: isLikelyNvr(d),
        }
      })

      return { devices, cloudUrlUsed: base }
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
  }

  throw lastErr ?? new Error('TP-Link cloud login failed')
}
