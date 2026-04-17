/**
 * TP-Link VIGI NVR JPEG snapshot over HTTPS (typical web UI ports 443 / 8443).
 * Digest auth (MD5 or SHA-256 per WWW-Authenticate) — same credentials as NVR web login.
 * @see https://www.tp-link.com/nordic/support/faq/4908/ — NVR: https://IP/snapshot?channel=N
 */

import * as https from 'https'
import type { IncomingHttpHeaders } from 'http'
import { createHash } from 'crypto'
import { env } from '@/config/env'
import { sha256Hex, tlsServerNameForHost } from '@/lib/vigiOpenApi'

function md5Hex(s: string): string {
  return createHash('md5').update(s, 'utf8').digest('hex')
}

function parseDigestChallenge(wwwAuthenticate: string | undefined): {
  realm: string
  nonce: string
  algorithm: 'MD5' | 'SHA-256'
} {
  if (!wwwAuthenticate) return { realm: 'TP-LINK NVR', nonce: '', algorithm: 'MD5' }
  const realm = /realm="([^"]*)"/i.exec(wwwAuthenticate)?.[1] ?? 'TP-LINK NVR'
  const nonce = /nonce="([^"]*)"/i.exec(wwwAuthenticate)?.[1] ?? ''
  const algorithm: 'MD5' | 'SHA-256' = /algorithm=SHA-256/i.test(wwwAuthenticate) ? 'SHA-256' : 'MD5'
  return { realm, nonce, algorithm }
}

function buildDigestAuth(params: {
  username: string
  password: string
  realm: string
  nonce: string
  method: string
  uriPath: string
  algorithm: 'MD5' | 'SHA-256'
}): string {
  const { username, password, realm, nonce, method, uriPath, algorithm } = params
  if (algorithm === 'SHA-256') {
    const A1 = sha256Hex(`${username}:${realm}:${password}`)
    const A2 = sha256Hex(`${method}:${uriPath}`)
    const response = sha256Hex(`${A1}:${nonce}:${A2}`)
    return (
      `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uriPath}", ` +
      `response="${response}", algorithm=SHA-256`
    )
  }
  const ha1 = md5Hex(`${username}:${realm}:${password}`)
  const ha2 = md5Hex(`${method}:${uriPath}`)
  const response = md5Hex(`${ha1}:${nonce}:${ha2}`)
  return (
    `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uriPath}", ` +
    `algorithm=MD5, response="${response}"`
  )
}

type RawBin = { statusCode: number; headers: IncomingHttpHeaders; body: Buffer }

function httpsBinary(
  host: string,
  port: number,
  pathWithQuery: string,
  options: {
    method: string
    headers: Record<string, string>
    tlsAllowInsecure: boolean
  },
): Promise<RawBin> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host,
        port,
        path: pathWithQuery,
        method: options.method,
        headers: options.headers,
        rejectUnauthorized: !options.tlsAllowInsecure,
        servername: tlsServerNameForHost(host),
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c as Buffer))
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          })
        })
      },
    )
    const t = env.VIGI_HTTPS_TIMEOUT_MS
    req.setTimeout(t, () => {
      req.destroy()
      reject(new Error(`VIGI snapshot HTTPS timeout after ${t}ms (${host}:${port}${pathWithQuery})`))
    })
    req.on('error', reject)
    req.end()
  })
}

function isJpeg(buf: Buffer, headers: IncomingHttpHeaders): boolean {
  const ct = (headers['content-type'] as string | undefined)?.toLowerCase() ?? ''
  if (ct.includes('image/jpeg')) return true
  return buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8
}

/**
 * Fetch one JPEG frame from the NVR snapshot URL (HTTPS).
 * Tries OpenAPI port first (often 20443 serves both API + snapshot on VIGI NVR), then 443 / 8443.
 */
export async function fetchVigiSnapshotJpeg(params: {
  host: string
  username: string
  password: string
  channel: number
  tlsAllowInsecure: boolean
  /** Same as NVR OpenAPI HTTPS port (default 20443) — tried first for snapshot. */
  openApiPort?: number
  /** Full override of port order */
  ports?: number[]
}): Promise<{ buffer: Buffer; httpsPort: number }> {
  const { host, username, password, channel, tlsAllowInsecure } = params
  const uriPath = `/snapshot?channel=${encodeURIComponent(String(channel))}`
  const ports = params.ports?.length
    ? params.ports
    : Array.from(
        new Set(
          [params.openApiPort ?? 20443, 443, 8443, 20443].filter(
            (p): p is number => typeof p === 'number' && p > 0 && p < 65536,
          ),
        ),
      )
  let lastErr: Error | null = null

  for (const port of ports) {
    try {
      const first = await httpsBinary(host, port, uriPath, {
        method: 'GET',
        headers: { Accept: 'image/jpeg,image/*,*/*' },
        tlsAllowInsecure,
      })

      if (first.statusCode === 200 && isJpeg(first.body, first.headers)) {
        return { buffer: first.body, httpsPort: port }
      }

      const www =
        (first.headers['www-authenticate'] as string | undefined) ??
        (first.headers['WWW-Authenticate'] as string | undefined)

      if (first.statusCode !== 401 || !www) {
        lastErr = new Error(
          `VIGI snapshot: HTTP ${first.statusCode} on port ${port} (${first.body.slice(0, 120).toString('utf8')})`,
        )
        continue
      }

      const { realm, nonce, algorithm } = parseDigestChallenge(www)
      if (!nonce) {
        lastErr = new Error('VIGI snapshot: missing Digest nonce')
        continue
      }

      const auth = buildDigestAuth({
        username,
        password,
        realm,
        nonce,
        method: 'GET',
        uriPath,
        algorithm,
      })

      const second = await httpsBinary(host, port, uriPath, {
        method: 'GET',
        headers: {
          Accept: 'image/jpeg,image/*,*/*',
          Authorization: auth,
        },
        tlsAllowInsecure,
      })

      if (second.statusCode === 200 && isJpeg(second.body, second.headers)) {
        return { buffer: second.body, httpsPort: port }
      }

      lastErr = new Error(
        `VIGI snapshot: auth failed HTTP ${second.statusCode} on port ${port} (${second.body.slice(0, 200).toString('utf8')})`,
      )
    } catch (e: unknown) {
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
  }

  throw lastErr ?? new Error(`VIGI snapshot: could not load JPEG (tried HTTPS ports ${ports.join(', ')})`)
}
