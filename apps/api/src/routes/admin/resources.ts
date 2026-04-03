import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, isOps } from '@/middleware/auth'
import { ok, created, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'

const router = Router()
router.use(authenticate, isOps)

// Branches
router.get('/branches', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.branch.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.branch.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.post('/branches', async (req, res) => {
  try {
    const item = await prisma.branch.create({ data: req.body })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/branches/:id', async (req, res) => {
  try {
    const item = await prisma.branch.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/branches/:id', async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Branch deleted' })
  } catch (err) { return serverError(res, err) }
})

// Devices
router.get('/devices', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { deviceName: { contains: q, mode: 'insensitive' } },
        { deviceType: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.device.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.device.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/devices/:id', async (req, res) => {
  try {
    const item = await prisma.device.findUnique({ where: { id: req.params.id } })
    if (!item) return notFound(res)
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.post('/devices', async (req, res) => {
  try {
    const item = await prisma.device.create({ data: req.body })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/devices/:id', async (req, res) => {
  try {
    const item = await prisma.device.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/devices/:id', async (req, res) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Device deleted' })
  } catch (err) { return serverError(res, err) }
})

// Client Accounts
router.get('/client-accounts', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const q = String(req.query.q ?? '').trim()
    const status = String(req.query.status ?? '').trim()
    const where: any = {}
    if (q) {
      where.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { country: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    const [items, total] = await Promise.all([
      prisma.clientAccount.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.clientAccount.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/client-accounts/:id', async (req, res) => {
  try {
    const item = await prisma.clientAccount.findUnique({ where: { id: req.params.id } })
    if (!item) return notFound(res)
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.post('/client-accounts', async (req, res) => {
  try {
    const item = await prisma.clientAccount.create({ data: req.body })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/client-accounts/:id', async (req, res) => {
  try {
    const item = await prisma.clientAccount.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/client-accounts/:id', async (req, res) => {
  try {
    await prisma.clientAccount.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Client account deleted' })
  } catch (err) { return serverError(res, err) }
})

// Exchange Rates
router.get('/exchange-rates', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const [items, total] = await Promise.all([
      prisma.exchangeRate.findMany({ orderBy: { effectiveDate: 'desc' }, skip, take: limit }),
      prisma.exchangeRate.count(),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.post('/exchange-rates', async (req, res) => {
  try {
    const payload = { ...req.body }
    if (payload.effectiveDate) payload.effectiveDate = new Date(payload.effectiveDate)
    const item = await prisma.exchangeRate.create({ data: payload })
    return created(res, item)
  } catch (err) { return serverError(res, err) }
})

router.put('/exchange-rates/:id', async (req, res) => {
  try {
    const payload = { ...req.body }
    if (payload.effectiveDate) payload.effectiveDate = new Date(payload.effectiveDate)
    const item = await prisma.exchangeRate.update({ where: { id: req.params.id }, data: payload })
    return ok(res, item)
  } catch (err) { return serverError(res, err) }
})

router.delete('/exchange-rates/:id', async (req, res) => {
  try {
    await prisma.exchangeRate.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Exchange rate deleted' })
  } catch (err) { return serverError(res, err) }
})

export default router
