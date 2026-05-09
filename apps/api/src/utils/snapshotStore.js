import prisma from "./prisma.js";

export function cloneSnapshotData(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return JSON.parse(JSON.stringify(raw));
  }
  return {};
}

/**
 * Load → mutator → upsert. Mutator receives a plain object (cloned).
 * @param {string} key
 * @param {(data: object) => object | Promise<object>} mutator
 */
export async function mutateSnapshotByKey(key, mutator) {
  const row = await prisma.portalSnapshot.findUnique({ where: { key } });
  const base = cloneSnapshotData(row?.data);
  const next = await mutator(base);
  const data = next !== undefined && next !== null ? next : base;
  await prisma.portalSnapshot.upsert({
    where: { key },
    create: { key, data },
    update: { data },
  });
  return data;
}
