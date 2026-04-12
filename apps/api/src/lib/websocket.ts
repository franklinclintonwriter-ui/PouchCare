import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { verifyAccess } from './jwt'

interface Client {
  ws: WebSocket
  userId: string
  type: string
  role: string
}

const clients = new Map<string, Client>()

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/v1/realtime' })

  wss.on('connection', (ws, req) => {
    // Auth via query param: ?token=...
    const url = new URL(req.url!, `http://${req.headers.host}`)
    const token = url.searchParams.get('token')

    if (!token) { ws.close(1008, 'Unauthorized'); return }

    try {
      const payload = verifyAccess(token)
      const client: Client = { ws, userId: payload.sub, type: payload.type, role: payload.role }
      clients.set(payload.sub, client)

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }))
        } catch {}
      })

      ws.on('close', () => clients.delete(payload.sub))
      ws.send(JSON.stringify({ type: 'connected', userId: payload.sub }))
    } catch { ws.close(1008, 'Invalid token') }
  })

  return wss
}

export function notify(userId: string, payload: object) {
  const client = clients.get(userId)
  if (client?.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload))
  }
}

export function broadcast(payload: object, type?: 'staff' | 'portal') {
  clients.forEach((client) => {
    if (type && client.type !== type) return
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload))
    }
  })
}

/** Notify all connected staff clients to refresh attendance-related UI. */
export function broadcastAttendanceUpdate(extra?: Record<string, unknown>) {
  broadcast({ type: 'attendance:update', ts: Date.now(), ...extra }, 'staff')
}
