/**
 * Save TP-Link VIGI NVR credentials for a branch (same encryption as PUT /v1/assets/vigi/branches/:id).
 *
 * **Do not commit passwords.** Pass via environment:
 *
 * PowerShell:
 *   cd apps/api
 *   $env:VIGI_PASSWORD="your-password"
 *   $env:VIGI_HOST="192.168.31.228"
 *   npm run vigi:upsert-local
 *
 * bash:
 *   export VIGI_PASSWORD=your-password
 *   npm run vigi:upsert-local
 *
 * Optional: VIGI_BRANCH_NAME (default: seed branch), VIGI_PORT (20443), VIGI_USERNAME (admin),
 * VIGI_TLS_INSECURE (true; set false if using a valid TLS cert),
 * VIGI_SKIP_PROBE=1 to save credentials without contacting the NVR (e.g. off-LAN).
 *
 * Reachability: the machine running this script (and your deployed API) must open TCP to host:port.
 * Private LAN IPs (192.168.x.x) only work on that LAN. For CEO/remote monitoring, use a hostname the
 * API can reach from the cloud (DDNS + forward, Tailscale, Cloudflare Tunnel, VPN), not only a local IP.
 */

import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { encryptCredential } from "../src/lib/credentialsCrypto";
import { vigiProbe } from "../src/lib/vigiOpenApi";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const prisma = new PrismaClient();

const DEFAULT_BRANCH = "PouchCare - Digital Marketing";

async function main() {
  const branchName = (process.env.VIGI_BRANCH_NAME ?? DEFAULT_BRANCH).trim();
  const host = (process.env.VIGI_HOST ?? "192.168.31.228").trim();
  const port = parseInt(process.env.VIGI_PORT ?? "20443", 10);
  const username = (process.env.VIGI_USERNAME ?? "admin").trim();
  const password = process.env.VIGI_PASSWORD?.trim();
  const tlsInsecure = process.env.VIGI_TLS_INSECURE !== "false";

  if (!password) {
    console.error(
      "Missing VIGI_PASSWORD. Set it in the environment (do not commit it).\n",
    );
    process.exit(1);
  }

  const branch = await prisma.branch.findFirst({
    where: { name: branchName },
  });
  if (!branch) {
    console.error(
      `Branch not found: "${branchName}". Create it via seed or set VIGI_BRANCH_NAME to an existing branch name.`,
    );
    process.exit(1);
  }

  const passwordEncrypted = encryptCredential(password);

  const row = await prisma.vigiNvrIntegration.upsert({
    where: { branchId: branch.id },
    create: {
      branchId: branch.id,
      host,
      port,
      username,
      passwordEncrypted,
      tlsAllowInsecure: tlsInsecure,
      enabled: true,
    },
    update: {
      host,
      port,
      username,
      passwordEncrypted,
      tlsAllowInsecure: tlsInsecure,
      enabled: true,
    },
  });

  console.log(
    `Saved VIGI integration for branch "${branch.name}" (${row.id})\n  ${host}:${port} user=${username} tlsInsecure=${tlsInsecure}\n`,
  );

  if (process.env.VIGI_SKIP_PROBE === "1") {
    console.log(
      "Skipped NVR probe (VIGI_SKIP_PROBE=1). When on the same LAN as the NVR, run again without this or use Management → Test connection.",
    );
    return;
  }

  const probe = await vigiProbe({
    host,
    port,
    username,
    password,
    tlsAllowInsecure: tlsInsecure,
  });

  if (!probe.ok) {
    console.warn(
      "NVR probe failed (credentials still saved):",
      probe.error ?? "unknown",
    );
    console.warn(
      "When the API can reach the NVR (same LAN / VPN), use Management → Monitor → Test connection, then Sync cameras.",
    );
    console.warn(
      "Typical causes: this PC is not on 192.168.31.x, wrong port, or firewall on the NVR/PC.",
    );
    return;
  }

  console.log("Probe OK:", {
    deviceCount: probe.deviceCount,
    sample: probe.sample,
  });
  console.log(
    "\nNext: Management app → Monitor → select this branch → **Sync cameras** to import channels into Camera devices.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
