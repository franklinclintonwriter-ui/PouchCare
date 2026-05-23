/**
 * Quick HTTP smoke: expects API already listening.
 * Usage: API_SMOKE_URL=http://127.0.0.1:7481 npm run smoke
 */

const base = String(process.env.API_SMOKE_URL || "http://127.0.0.1:7481")
  .trim()
  .replace(/\/$/, "");

async function main() {
  const health = await fetch(`${base}/health`);
  if (!health.ok) throw new Error(`/health → ${health.status}`);

  const cat = await fetch(`${base}/catalog/templates`);
  if (!cat.ok) throw new Error(`/catalog/templates → ${cat.status}`);
  const data = await cat.json();
  if (!Array.isArray(data.templates)) {
    throw new Error("catalog response missing templates[]");
  }

  console.log("smoke ok", base, "templates:", data.templates.length);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
