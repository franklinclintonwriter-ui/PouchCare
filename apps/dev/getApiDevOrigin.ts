import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_PORT = 7000

/**
 * Vite dev proxy target: same host/port as `PORT` in apps/api/.env (default 7000).
 */
export function apiDevOrigin(): string {
  const envPath = path.resolve(__dirname, '../api/.env')
  let port = DEFAULT_PORT
  try {
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const m = trimmed.match(/^PORT\s*=\s*(\d+)/)
        if (m) {
          const p = parseInt(m[1], 10)
          if (!Number.isNaN(p) && p > 0) port = p
          break
        }
      }
    }
  } catch {
    /* use default */
  }
  return `http://127.0.0.1:${port}`
}
