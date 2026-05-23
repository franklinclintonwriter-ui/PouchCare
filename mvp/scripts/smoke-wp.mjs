/**
 * WordPress / wp-env smoke test
 * Usage: WP_SMOKE_URL=http://localhost:8896 node scripts/smoke-wp.mjs
 */

const base = String(process.env.WP_SMOKE_URL || "http://localhost:8896")
  .trim()
  .replace(/\/$/, "");

async function main() {
  console.log(`Testing WordPress at ${base}...`);

  // 1. Check WordPress home page
  const home = await fetch(base);
  if (!home.ok) throw new Error(`WordPress home → ${home.status}`);
  console.log("  ✓ WordPress home page (200)");

  // 2. Check WP REST API root
  const apiRoot = await fetch(`${base}/wp-json/`);
  if (!apiRoot.ok) throw new Error(`WP REST API root → ${apiRoot.status}`);
  const apiData = await apiRoot.json();
  console.log("  ✓ WP REST API root (200)");

  // 3. Verify PouchCare namespace is registered
  const namespaces = apiData.namespaces || [];
  if (!namespaces.includes("pouchcare/v1")) {
    throw new Error("pouchcare/v1 namespace not registered");
  }
  console.log("  ✓ PouchCare namespace registered");

  // 4. Check customer endpoint returns 401 (auth required, not 404)
  const customerSnap = await fetch(`${base}/wp-json/pouchcare/v1/customer/snapshot`);
  if (customerSnap.status !== 401) {
    throw new Error(`Customer snapshot should return 401, got ${customerSnap.status}`);
  }
  console.log("  ✓ Customer endpoint requires auth (401)");

  // 5. Check admin endpoint returns 401 (auth required, not 404)
  const adminSnap = await fetch(`${base}/wp-json/pouchcare/v1/admin/snapshot`);
  if (adminSnap.status !== 401 && adminSnap.status !== 403) {
    throw new Error(`Admin snapshot should return 401/403, got ${adminSnap.status}`);
  }
  console.log("  ✓ Admin endpoint requires auth (401/403)");

  console.log("\n✓ WordPress smoke test passed!");
}

main().catch((err) => {
  console.error("\n✗ WordPress smoke test failed:", err.message);
  process.exit(1);
});
