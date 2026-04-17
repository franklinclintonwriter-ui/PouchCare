/**
 * End-to-end checks for client portal login (no browser; no CORS).
 *
 * Usage:
 *   npx tsx scripts/portal-login-e2e.ts
 *   npx tsx scripts/portal-login-e2e.ts https://api.pouchcare.com
 *
 * Interpreting results:
 * - health fails → API down, wrong URL, or TLS/network.
 * - login 401 "Invalid credentials" → API up; user missing or wrong password in THAT database.
 * - login 503 → PostgreSQL unreachable on the server.
 * - Run from your machine against production to verify server + DB; browser issues (CORS) require DevTools on the SPA.
 */

const DEFAULT_BASE = process.env.API_BASE_URL ?? "http://127.0.0.1:7000";

async function main() {
  const base = (process.argv[2] ?? DEFAULT_BASE).replace(/\/+$/, "");

  console.log(`\n[PouchCare] Portal login E2E → ${base}\n`);

  // 1) Health
  try {
    const h = await fetch(`${base}/health`);
    const ht = await h.text();
    console.log(`GET /health → ${h.status} ${h.ok ? "OK" : ""}`);
    if (!h.ok) console.log(ht.slice(0, 500));
  } catch (e) {
    console.error("GET /health failed:", e instanceof Error ? e.message : e);
    console.error("→ Fix: API URL, TLS, firewall, or start the API.\n");
    process.exit(1);
  }

  // 2) DB readiness
  try {
    const r = await fetch(`${base}/health/ready`);
    const j = (await r.json()) as { ok?: boolean; db?: boolean; error?: string };
    console.log(
      `GET /health/ready → ${r.status} db=${j.db ?? "?"} ${j.ok ? "OK" : j.error ?? ""}`,
    );
    if (!r.ok || j.db === false) {
      console.error(
        "→ PostgreSQL not reachable from API. Logins will fail until DB is fixed.\n",
      );
    }
  } catch (e) {
    console.warn("/health/ready:", e instanceof Error ? e.message : e);
  }

  // 3) CORS preflight (simulates browser)
  try {
    const pre = await fetch(`${base}/v1/portal/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://pouchcare.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    const acao = pre.headers.get("access-control-allow-origin");
    console.log(
      `OPTIONS /v1/portal/login (Origin: https://pouchcare.com) → ${pre.status} Access-Control-Allow-Origin: ${acao ?? "(missing)"}`,
    );
    if (!acao || acao === "null") {
      console.warn(
        "→ If Allow-Origin is missing or wrong, browser login will fail. Set ALLOWED_ORIGINS on the API (include https://pouchcare.com, trim spaces).",
      );
    }
  } catch (e) {
    console.warn("OPTIONS preflight:", e instanceof Error ? e.message : e);
  }

  // 4) Wrong password (expect 401 + error message)
  const bad = await fetch(`${base}/v1/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john@example.com",
      password: "definitely-wrong-password-xyz",
    }),
  });
  const badJson = (await bad.json()) as { success?: boolean; error?: string };
  console.log(
    `POST /v1/portal/login (bad password) → ${bad.status} error=${JSON.stringify(badJson.error ?? badJson)}`,
  );
  if (bad.status !== 401) {
    console.warn("→ Expected 401 for wrong password.");
  }

  // 5) Seeded user (only works if DB seeded with demo data)
  const good = await fetch(`${base}/v1/portal/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john@example.com",
      password: "Password123!",
    }),
  });
  const goodJson = (await good.json()) as {
    success?: boolean;
    data?: { access_token?: string; user?: { email?: string } };
    error?: string;
  };
  if (good.ok && goodJson.success && goodJson.data?.access_token) {
    console.log(
      `POST /v1/portal/login (john@example.com) → ${good.status} OK token=${goodJson.data.access_token.slice(0, 16)}…`,
    );
  } else {
    console.log(
      `POST /v1/portal/login (john@example.com) → ${good.status} ${JSON.stringify(goodJson.error ?? goodJson)}`,
    );
    console.warn(
      "→ If 401: user not in this DB or wrong password. Run prisma seed on this environment or register a new account.",
    );
  }

  console.log("\nDone.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
