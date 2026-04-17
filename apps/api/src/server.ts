import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { createServer } from "http";
import { env } from "@/config/env";
import { errorHandler } from "@/middleware/errorHandler";
import { generalRateLimit } from "@/middleware/rateLimit";

// Routes
import authRouter from "@/routes/auth/index";
import staffRouter from "@/routes/staff/index";
import tasksRouter from "@/routes/tasks/index";
import projectsRouter from "@/routes/projects/index";
import attendanceRouter from "@/routes/attendance/index";
import leaveRouter from "@/routes/leave/index";
import reportsRouter from "@/routes/reports/index";
import performanceRouter from "@/routes/performance/index";
import payrollRouter from "@/routes/payroll/index";
import financeRouter from "@/routes/finance/index";
import crmRouter from "@/routes/crm/index";
import assetsRouter from "@/routes/assets/index";
import hrRouter from "@/routes/hr/index";
import servicesRouter from "@/routes/services/index";
import backlinksRouter from "@/routes/services/backlinks";
import broadcastRouter from "@/routes/broadcast/index";
import supportRouter from "@/routes/support/index";
import notificationsRouter from "@/routes/notifications/index";
import inboxRouter from "@/routes/inbox/index";
import searchRouter from "@/routes/search/index";
import analyticsRouter from "@/routes/analytics/index";
import portalAuthRouter from "@/routes/portal/auth";
import portalMeRouter from "@/routes/portal/me";
import portalWalletRouter from "@/routes/portal/wallet";
import portalOrdersRouter from "@/routes/portal/orders";
import portalReferralsRouter from "@/routes/portal/referrals";
import portalCommissionsRouter from "@/routes/portal/commissions";
import portalInvoicesRouter from "@/routes/portal/invoices";
import portalHostingRouter from "@/routes/portal/hosting";
import portalWebsitesRouter from "@/routes/portal/websites";
import portalWebToApkRouter from "@/routes/portal/web-to-apk";
import portalSecurityRouter from "@/routes/portal/security";
import portalNotificationsRouter from "@/routes/portal/notifications";
import adminPortalRouter from "@/routes/admin/portal";
import adminRolePermissionsRouter from "@/routes/admin/role-permissions";
import adminSystemConfigRouter from "@/routes/admin/system-config";
import adminResourcesRouter from "@/routes/admin/resources";
import adminClientsRouter from "@/routes/admin/clients";
import adminOrdersRouter from "@/routes/admin/orders";
import adminOverviewRouter from "@/routes/admin/overview";
import adminAuditRouter from "@/routes/admin/audit";
import adminServicesRouter from "@/routes/admin/services";
import adminAssetsRouter from "@/routes/admin/assets";
import pluginsRouter from "@/routes/plugins/index";
import apiKeysRouter from "@/routes/api-keys/index";
import toolsRouter from "@/routes/tools/index";
import aiRouter from "@/routes/ai/index";
import workspaceRouter from "@/routes/ai/workspace";
import githubRouter from "@/routes/ai/github";
import integrationsRouter from "@/routes/ai/integrations";
import sshRouter from "@/routes/ai/ssh";
import supabaseRouter from "@/routes/ai/supabase";
import fileManagerRouter from "@/routes/fileManager";
import { setupWebSocket } from "@/lib/websocket";
import { startJobs } from "@/jobs/index";
import prisma from "@/lib/prisma";
import {
  assertProductionStorageOrExit,
  isLocalUploadFallbackEnabled,
} from "@/lib/storage";

assertProductionStorageOrExit();

const app = express();
// Behind Nginx reverse proxy — trust the first proxy so req.ip / X-Forwarded-For works correctly
app.set("trust proxy", 1);
const httpServer = createServer(app);

const configuredOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isDevLocalhostOrigin(origin: string): boolean {
  if (env.NODE_ENV !== "development") return false;
  try {
    const u = new URL(origin);
    return (
      u.protocol === "http:" &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

// ── Security ──────────────────────────────────────────
app.use(
  helmet({
    // Default `same-origin` can interfere with cross-subdomain browser requests (SPA → API).
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (isDevLocalhostOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
  }),
);

// ── Parsing ───────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
// @ts-ignore
app.use(compression());

// ── Rate limiting ─────────────────────────────────────
app.use(generalRateLimit);

// ── Static files (local disk uploads only; production uses Cloudflare R2 URLs) ──
if (isLocalUploadFallbackEnabled) {
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
}

// ── Health check ──────────────────────────────────────
app.get("/health", (_, res) => {
  res.json({ status: "ok", ts: new Date().toISOString(), version: "1.0.0" });
});

/** Returns 200 only when PostgreSQL accepts a query (use for readiness probes). */
app.get("/health/ready", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, db: true, ts: new Date().toISOString() });
  } catch {
    return res.status(503).json({
      ok: false,
      db: false,
      error: "database_unreachable",
      hint: "Start PostgreSQL and run prisma db push + db seed (see README)",
    });
  }
});

/** Under `/v1` so the Vite dev proxy (`/v1` → API) can hit a liveness check from the management app origin. */
app.get("/v1/health", (_, res) => {
  res.json({
    status: "ok",
    mode: env.NODE_ENV,
    ts: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ── API Routes ────────────────────────────────────────
const v1 = "/v1";

// Staff Auth
app.use(`${v1}/auth`, authRouter);

// Staff Operations
app.use(`${v1}/staff`, staffRouter);
app.use(`${v1}/tasks`, tasksRouter);
app.use(`${v1}/projects`, projectsRouter);
app.use(`${v1}/attendance`, attendanceRouter);
app.use(`${v1}/leave`, leaveRouter);
app.use(`${v1}/reports`, reportsRouter);
app.use(`${v1}/performance`, performanceRouter);
app.use(`${v1}/payroll`, payrollRouter);

// Business
app.use(`${v1}/finance`, financeRouter);
app.use(`${v1}/crm`, crmRouter);
// Staff: company domain/server/website inventory (`requireStaff`). Distinct from `/v1/portal/hosting` & `/v1/portal/websites` below.
app.use(`${v1}/assets`, assetsRouter);
app.use(`${v1}/hr`, hrRouter);
app.use(`${v1}/services`, servicesRouter);
app.use(`${v1}/backlink-packages`, backlinksRouter);
app.use(`${v1}/broadcast`, broadcastRouter);
app.use(`${v1}/support`, supportRouter);
app.use(`${v1}/inbox`, inboxRouter);
app.use(`${v1}/notifications`, notificationsRouter);
app.use(`${v1}/search`, searchRouter);
app.use(`${v1}/analytics`, analyticsRouter);

// Client portal (members): hosting + websites are scoped by `portalMemberId` — not the staff `/v1/assets` routers.
// Client Portal
app.use(`${v1}/portal`, portalAuthRouter);
app.use(`${v1}/portal/me`, portalMeRouter);
app.use(`${v1}/portal/wallet`, portalWalletRouter);
app.use(`${v1}/portal/orders`, portalOrdersRouter);
app.use(`${v1}/portal/referrals`, portalReferralsRouter);
app.use(`${v1}/portal/commissions`, portalCommissionsRouter);
app.use(`${v1}/portal/invoices`, portalInvoicesRouter);
app.use(`${v1}/portal/hosting`, portalHostingRouter);
app.use(`${v1}/portal/websites`, portalWebsitesRouter);
app.use(`${v1}/portal/web-to-apk`, portalWebToApkRouter);
app.use(`${v1}/portal/security`, portalSecurityRouter);
app.use(`${v1}/portal/notifications`, portalNotificationsRouter);

// Admin
app.use(`${v1}/admin/portal`, adminPortalRouter);
app.use(`${v1}/admin/role-permissions`, adminRolePermissionsRouter);
app.use(`${v1}/admin/system-config`, adminSystemConfigRouter);
// Admin Panel — unified clients/orders/overview surface (Phase 0–4)
app.use(`${v1}/admin/overview`, adminOverviewRouter);
app.use(`${v1}/admin/clients`, adminClientsRouter);
app.use(`${v1}/admin/orders`, adminOrdersRouter);
app.use(`${v1}/admin/audit`, adminAuditRouter);
app.use(`${v1}/admin/services`, adminServicesRouter);
app.use(`${v1}/admin/assets`, adminAssetsRouter);
app.use(`${v1}/admin`, adminResourcesRouter);

// Plugin Platform
app.use(`${v1}/plugins`, pluginsRouter);
app.use(`${v1}/api-keys`, apiKeysRouter);
app.use(`${v1}/tools`, toolsRouter);
app.use(`${v1}/ai`, aiRouter);
app.use(`${v1}/ai/workspace`, workspaceRouter);
app.use(`${v1}/ai/github`, githubRouter);
app.use(`${v1}/ai/integrations`, integrationsRouter);
app.use(`${v1}/ai/ssh`, sshRouter);
app.use(`${v1}/ai/supabase`, supabaseRouter);
app.use(`${v1}/file-manager`, fileManagerRouter);

// ── Error handler ──────────────────────────────────────────────
app.use(errorHandler);

// ── WebSocket ──────────────────────────────────────────────────
setupWebSocket(httpServer);

// ── Background jobs ────────────────────────────────────────────
startJobs();

// ── Start ──────────────────────────────────────────────────────
const PORT = env.PORT;
httpServer.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

export default app;
