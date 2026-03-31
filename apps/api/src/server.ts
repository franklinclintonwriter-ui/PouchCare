import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { env } from '@/config/env'
import { errorHandler } from '@/middleware/errorHandler'
import { generalRateLimit } from '@/middleware/rateLimit'

// Routes
import authRouter from '@/routes/auth/index'
import staffRouter from '@/routes/staff/index'
import tasksRouter from '@/routes/tasks/index'
import projectsRouter from '@/routes/projects/index'
import attendanceRouter from '@/routes/attendance/index'
import leaveRouter from '@/routes/leave/index'
import reportsRouter from '@/routes/reports/index'
import performanceRouter from '@/routes/performance/index'
import payrollRouter from '@/routes/payroll/index'
import financeRouter from '@/routes/finance/index'
import crmRouter from '@/routes/crm/index'
import assetsRouter from '@/routes/assets/index'
import hrRouter from '@/routes/hr/index'
import servicesRouter from '@/routes/services/index'
import backlinksRouter from '@/routes/services/backlinks'
import broadcastRouter from '@/routes/broadcast/index'
import supportRouter from '@/routes/support/index'
import notificationsRouter from '@/routes/notifications/index'
import searchRouter from '@/routes/search/index'
import analyticsRouter from '@/routes/analytics/index'
import portalAuthRouter from '@/routes/portal/auth'
import portalMeRouter from '@/routes/portal/me'
import portalWalletRouter from '@/routes/portal/wallet'
import portalOrdersRouter from '@/routes/portal/orders'
import portalReferralsRouter from '@/routes/portal/referrals'
import portalCommissionsRouter from '@/routes/portal/commissions'
import adminPortalRouter from '@/routes/admin/portal'
import adminResourcesRouter from '@/routes/admin/resources'
import { setupWebSocket } from '@/lib/websocket'
import { startJobs } from '@/jobs/index'

const app = express()
const httpServer = createServer(app)

// ── Security ──────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
// @ts-ignore
app.use(compression())

// ── Rate limiting ─────────────────────────────────────
app.use(generalRateLimit)

// ── Health check ──────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' })
})

// ── API Routes ────────────────────────────────────────
const v1 = '/v1'

// Staff Auth
app.use(`${v1}/auth`, authRouter)

// Staff Operations
app.use(`${v1}/staff`, staffRouter)
app.use(`${v1}/tasks`, tasksRouter)
app.use(`${v1}/projects`, projectsRouter)
app.use(`${v1}/attendance`, attendanceRouter)
app.use(`${v1}/leave`, leaveRouter)
app.use(`${v1}/reports`, reportsRouter)
app.use(`${v1}/performance`, performanceRouter)
app.use(`${v1}/payroll`, payrollRouter)

// Business
app.use(`${v1}/finance`, financeRouter)
app.use(`${v1}/crm`, crmRouter)
app.use(`${v1}/assets`, assetsRouter)
app.use(`${v1}/hr`, hrRouter)
app.use(`${v1}/services`, servicesRouter)
app.use(`${v1}/backlink-packages`, backlinksRouter)
app.use(`${v1}/broadcast`, broadcastRouter)
app.use(`${v1}/support`, supportRouter)
app.use(`${v1}/notifications`, notificationsRouter)
app.use(`${v1}/search`, searchRouter)
app.use(`${v1}/analytics`, analyticsRouter)

// Client Portal
app.use(`${v1}/portal`, portalAuthRouter)
app.use(`${v1}/portal/me`, portalMeRouter)
app.use(`${v1}/portal/wallet`, portalWalletRouter)
app.use(`${v1}/portal/orders`, portalOrdersRouter)
app.use(`${v1}/portal/referrals`, portalReferralsRouter)
app.use(`${v1}/portal/commissions`, portalCommissionsRouter)

// Admin
app.use(`${v1}/admin/portal`, adminPortalRouter)
app.use(`${v1}/admin`, adminResourcesRouter)

// ── Error handler ────────────────────────────────────
app.use(errorHandler)

// ── WebSocket ─────────────────────────────────────────
setupWebSocket(httpServer)

// ── Start ─────────────────────────────────────────────
const PORT = env.PORT || 7000
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 PouchCare API running on port ${PORT}`)
  console.log(`   Mode: ${env.NODE_ENV}`)
  startJobs()
})

export default app
