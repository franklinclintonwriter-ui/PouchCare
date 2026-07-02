#!/usr/bin/env node
// PouchCare — Cloudflare Tunnel setup (Linux/macOS/Windows, no browser login)
//
// Creates or reuses a REMOTE-MANAGED Cloudflare Tunnel, wires ingress rules for
// each hostname to a local port, creates/updates the DNS CNAMEs, fetches the
// tunnel run token, and writes TUNNEL_TOKEN to the repo-root .env.
//
// Requires (from process env, root .env, or apps/api/.env):
//   CLOUDFLARE_API_TOKEN    Account > Cloudflare Tunnel > Edit  AND  Zone > DNS > Edit
//   CLOUDFLARE_ACCOUNT_ID
//   CLOUDFLARE_ZONE_ID      (or CLOUDFLARE_ZONE_NAME, default: pouchcare.com)
//
// Optional:
//   CF_TUNNEL_NAME          default: pouchcare
//   CF_HOSTS                comma list of "hostname=port" pairs. Default maps
//                           the four PouchCare hostnames to their local ports.
//
// Usage (repo root):
//   node scripts/cf-tunnel-setup.mjs
//   npm run tunnel:setup

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API = "https://api.cloudflare.com/client/v4";

// ── env loading ──────────────────────────────────────────────────────────────
function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = {
  ...parseEnvFile(path.join(ROOT, "apps", "api", ".env")),
  ...parseEnvFile(path.join(ROOT, ".env")),
};
const env = (k) => process.env[k] ?? fileEnv[k];

const TOKEN = env("CLOUDFLARE_API_TOKEN");
const ACCOUNT_ID = env("CLOUDFLARE_ACCOUNT_ID");
let ZONE_ID = env("CLOUDFLARE_ZONE_ID");
const ZONE_NAME = env("CLOUDFLARE_ZONE_NAME") || "pouchcare.com.bd";
const TUNNEL_NAME = env("CF_TUNNEL_NAME") || "pouchcare";

// hostname -> local port
// Frontends (root, www, m, office) are served by Cloudflare Pages, so the
// tunnel only needs to expose the API origin running on this machine.
const DEFAULT_HOSTS = [["api.pouchcare.com.bd", 7000]];
const HOSTS = env("CF_HOSTS")
  ? env("CF_HOSTS")
      .split(",")
      .map((p) => {
        const [h, port] = p.split("=");
        return [h.trim(), Number(port)];
      })
  : DEFAULT_HOSTS;

if (!TOKEN || !ACCOUNT_ID) {
  console.error("Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID.");
  console.error(
    "Set them in the repo-root .env or apps/api/.env, then re-run.",
  );
  console.error(
    "Token needs: Account > Cloudflare Tunnel > Edit  AND  Zone > DNS > Edit.",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function cf(method, url, body) {
  const res = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const errs = (json.errors || [])
      .map((e) => `${e.code} ${e.message}`)
      .join("; ");
    throw new Error(
      `CF ${method} ${url} failed: ${res.status} ${errs || JSON.stringify(json)}`,
    );
  }
  return json;
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("[PouchCare] Cloudflare Tunnel setup\n");

  // 1. Resolve zone id
  if (!ZONE_ID) {
    console.log(`Resolving zone id for "${ZONE_NAME}"...`);
    const z = await cf("GET", `/zones?name=${encodeURIComponent(ZONE_NAME)}`);
    ZONE_ID = z.result?.[0]?.id;
    if (!ZONE_ID)
      throw new Error(
        `Zone "${ZONE_NAME}" not found (check token Zone permissions).`,
      );
  }
  console.log(`Zone id: ${ZONE_ID}`);

  // 2. Find or create tunnel (remote-managed)
  console.log(`\nLooking for tunnel "${TUNNEL_NAME}"...`);
  const list = await cf(
    "GET",
    `/accounts/${ACCOUNT_ID}/cfd_tunnel?name=${encodeURIComponent(TUNNEL_NAME)}&is_deleted=false`,
  );
  let tunnel = (list.result || []).find(
    (t) => t.name === TUNNEL_NAME && !t.deleted_at,
  );
  if (tunnel) {
    console.log(`Using existing tunnel id=${tunnel.id}`);
  } else {
    console.log("Creating tunnel...");
    const created = await cf("POST", `/accounts/${ACCOUNT_ID}/cfd_tunnel`, {
      name: TUNNEL_NAME,
      config_src: "cloudflare",
    });
    tunnel = created.result;
    console.log(`Created tunnel id=${tunnel.id}`);
  }
  const tunnelId = tunnel.id;

  // 3. Configure ingress
  console.log("\nConfiguring ingress rules:");
  const ingress = HOSTS.map(([hostname, port]) => {
    console.log(`  ${hostname} -> http://127.0.0.1:${port}`);
    return { hostname, service: `http://127.0.0.1:${port}` };
  });
  ingress.push({ service: "http_status:404" });
  await cf(
    "PUT",
    `/accounts/${ACCOUNT_ID}/cfd_tunnel/${tunnelId}/configurations`,
    {
      config: { ingress },
    },
  );
  console.log("Ingress configured.");

  // 4. DNS CNAMEs -> <tunnelId>.cfargotunnel.com (proxied)
  const cnameTarget = `${tunnelId}.cfargotunnel.com`;
  console.log(`\nEnsuring DNS records -> ${cnameTarget}`);
  for (const [hostname] of HOSTS) {
    const existing = await cf(
      "GET",
      `/zones/${ZONE_ID}/dns_records?name=${encodeURIComponent(hostname)}`,
    );
    const rec = (existing.result || []).find((r) => r.name === hostname);
    const dnsBody = {
      type: "CNAME",
      name: hostname,
      content: cnameTarget,
      proxied: true,
      ttl: 1,
    };
    if (rec) {
      await cf("PUT", `/zones/${ZONE_ID}/dns_records/${rec.id}`, dnsBody);
      console.log(`  updated ${hostname}`);
    } else {
      await cf("POST", `/zones/${ZONE_ID}/dns_records`, dnsBody);
      console.log(`  created ${hostname}`);
    }
  }

  // 5. Fetch run token and write to .env
  const tokResp = await cf(
    "GET",
    `/accounts/${ACCOUNT_ID}/cfd_tunnel/${tunnelId}/token`,
  );
  const runToken = tokResp.result;
  writeEnvKey(path.join(ROOT, ".env"), "TUNNEL_TOKEN", runToken);
  console.log("\nWrote TUNNEL_TOKEN to .env (value hidden).");

  console.log("\nDone. Next:");
  console.log("  1. Start the apps locally:   npm run dev");
  console.log("  2. Start the tunnel:         npm run tunnel:up");
  console.log("\nThen visit: https://" + HOSTS[0][0]);
}

function writeEnvKey(envPath, key, value) {
  let lines = [];
  if (fs.existsSync(envPath))
    lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  const idx = lines.findIndex((l) => l.trim().startsWith(`${key}=`));
  if (idx >= 0) lines[idx] = `${key}=${value}`;
  else {
    if (lines.length && lines[lines.length - 1] !== "") lines.push("");
    lines.push(`${key}=${value}`);
  }
  fs.writeFileSync(envPath, lines.join("\n").replace(/\n+$/, "\n"), {
    encoding: "utf8",
  });
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
