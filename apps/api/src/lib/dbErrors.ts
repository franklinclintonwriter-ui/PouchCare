import { Prisma } from "@prisma/client";

/** True when Prisma cannot reach PostgreSQL (wrong URL, server down, firewall). */
export function isDbConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1001", "P1002", "P1017"].includes(e.code);
  }
  if (e instanceof Error) {
    return /Can't reach database server|P1001|connection (refused|timed out)/i.test(
      e.message,
    );
  }
  return false;
}

export const DB_UNAVAILABLE_MESSAGE =
  "Database is unavailable. Start PostgreSQL on the host in DATABASE_URL (e.g. docker compose up -d from repo root), then run: cd apps/api && npx prisma db push && npx prisma db seed";
