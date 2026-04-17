import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { verifyAccess } from "./jwt";

interface Client {
  ws: WebSocket;
  userId: string;
  type: string;
  role: string;
}

const clients = new Map<string, Client>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/v1/realtime" });

  wss.on("connection", (ws, req) => {
    // Support both first-message auth and legacy query-param auth.
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const legacyToken = url.searchParams.get("token");

    const authenticate = (token: string) => {
      try {
        const payload = verifyAccess(token);
        const client: Client = {
          ws,
          userId: payload.sub,
          type: payload.type,
          role: payload.role,
        };
        clients.set(payload.sub, client);

        ws.on("message", (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
          } catch {}
        });

        ws.on("close", () => clients.delete(payload.sub));
        ws.send(JSON.stringify({ type: "connected", userId: payload.sub }));
      } catch {
        ws.close(1008, "Invalid token");
      }
    };

    if (legacyToken) {
      // Legacy: token in query param (backwards compat)
      authenticate(legacyToken);
    } else {
      // Secure: wait for first message with { type: 'auth', token: '...' }
      const authTimeout = setTimeout(
        () => ws.close(1008, "Auth timeout"),
        10_000,
      );

      ws.once("message", (data) => {
        clearTimeout(authTimeout);
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === "auth" && typeof msg.token === "string") {
            authenticate(msg.token);
          } else {
            ws.close(1008, "Unauthorized");
          }
        } catch {
          ws.close(1008, "Unauthorized");
        }
      });
    }
  });

  // SSH Terminal WebSocket on /v1/ssh-terminal
  const sshWss = new WebSocketServer({ server, path: "/v1/ssh-terminal" });

  sshWss.on("connection", (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    const workspaceId = url.searchParams.get("workspaceId");

    if (!token || !workspaceId) {
      ws.close(1008, "Missing token or workspaceId");
      return;
    }

    let userId: string;
    try {
      const payload = verifyAccess(token);
      if (!["CEO", "CO_MD"].includes(payload.role)) {
        ws.close(1008, "SSH access is CEO/MD only");
        return;
      }
      userId = payload.sub;
    } catch {
      ws.close(1008, "Invalid token");
      return;
    }

    const { env: envConfig } = require("@/config/env");
    const { Client } = require("ssh2");

    if (!envConfig.SSH_HOST) {
      ws.close(1008, "SSH not configured");
      return;
    }

    const sshConn = new Client();
    const sshConfig: any = {
      host: envConfig.SSH_HOST,
      port: envConfig.SSH_PORT,
      username: envConfig.SSH_USERNAME,
    };
    if (envConfig.SSH_PRIVATE_KEY) {
      sshConfig.privateKey = Buffer.from(envConfig.SSH_PRIVATE_KEY, "base64");
    } else if (envConfig.SSH_PASSWORD) {
      sshConfig.password = envConfig.SSH_PASSWORD;
    }

    sshConn.on("ready", () => {
      sshConn.shell(
        { term: "xterm-256color", cols: 120, rows: 30 },
        (err: any, stream: any) => {
          if (err) {
            ws.close(1011, "Shell failed");
            return;
          }

          // Set working directory
          stream.write(
            `cd /home/${envConfig.SSH_USERNAME}/projects/${workspaceId} 2>/dev/null; clear\n`,
          );

          stream.on("data", (data: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(data.toString("utf8"));
          });

          ws.on("message", (data: any) => {
            const msg = data.toString();
            try {
              const parsed = JSON.parse(msg);
              if (parsed.type === "resize" && parsed.cols && parsed.rows) {
                stream.setWindow(parsed.rows, parsed.cols, 0, 0);
                return;
              }
            } catch {
              // Not JSON — raw terminal input
            }
            stream.write(msg);
          });

          ws.on("close", () => {
            stream.end();
            sshConn.end();
          });

          stream.on("close", () => {
            ws.close();
            sshConn.end();
          });
        },
      );
    });

    sshConn.on("error", (err: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\nSSH Error: ${err.message}\r\n`);
      }
      ws.close(1011, "SSH connection failed");
    });

    sshConn.connect(sshConfig);
  });

  return wss;
}

export function notify(userId: string, payload: object) {
  const client = clients.get(userId);
  if (client?.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}

export function broadcast(payload: object, type?: "staff" | "portal") {
  clients.forEach((client) => {
    if (type && client.type !== type) return;
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(payload));
    }
  });
}

/** Notify all connected staff clients to refresh attendance-related UI. */
export function broadcastAttendanceUpdate(extra?: Record<string, unknown>) {
  broadcast({ type: "attendance:update", ts: Date.now(), ...extra }, "staff");
}
