import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, MANAGER_ROLES, CEO_ROLES  } from '@/middleware/auth'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)
router.use(authenticate)

router.get('/leads', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const { stage, q, source } = req.query as Record<string, string>
    const where: any = {}
    if (stage)  where.stage = stage
    if (source) where.source = source
    if (q) where.OR = [
      { company:     { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { email:       { contains: q, mode: 'insensitive' } },
    ]
    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.crmLead.count({ where }),
    ])
    return ok(res, leads, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.get('/leads/:id', requireStaff, async (req, res) => {
  try {
    const lead = await prisma.crmLead.findUnique({ where: { id: req.params.id } })
    if (!lead) return notFound(res)
    return ok(res, lead)
  } catch (err) { serverError(res, err) }
})

router.post('/leads', requireStaff, async (req, res) => {
  try {
    const lead = await prisma.crmLead.create({ data: { ...req.body, owner: req.user!.id } })
    return created(res, lead)
  } catch (err) { serverError(res, err) }
})

router.put('/leads/:id', requireStaff, async (req, res) => {
  try {
    const data = { ...req.body }
    if (data.nextFollowUpDate) data.nextFollowUpDate = new Date(data.nextFollowUpDate)
    if (data.lastContactDate) {
      data.lastContactDate = new Date(data.lastContactDate)
      data.followUpCount   = { increment: 1 }
    }
    const lead = await prisma.crmLead.update({ where: { id: req.params.id }, data })
    return ok(res, lead)
  } catch (err) { serverError(res, err) }
})

router.delete('/leads/:id', requireRoles(...CEO_ROLES as any), async (req, res) => {
  try {
    await prisma.crmLead.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Lead deleted' })
  } catch (err) { serverError(res, err) }
})

// Sales Orders
router.get('/orders', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({ skip, take: limit, orderBy: { orderDate: 'desc' } }),
      prisma.salesOrder.count(),
    ])
    return ok(res, orders, buildMeta(page, limit, total))
  } catch (err) { serverError(res, err) }
})

router.post('/orders', requireStaff, async (req, res) => {
  try {
    const order = await prisma.salesOrder.create({
      data: { ...req.body, orderDate: new Date() },
    })
    return created(res, order)
  } catch (err) { serverError(res, err) }
})

router.put('/orders/:id', requireStaff, async (req, res) => {
  try {
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data: req.body })
    return ok(res, order)
  } catch (err) { serverError(res, err) }
})

export default router

// GET /v1/crm/pipeline — leads grouped by stage
router.get('/pipeline', requireStaff, async (req, res) => {
  try {
    const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const pipeline = await Promise.all(stages.map(async (stage) => {
      const leads = await prisma.crmLead.findMany({ where: { stage: stage as any }, orderBy: { createdAt: 'desc' }, take: 20 })
      const totalValue = leads.reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0)
      return { stage, count: leads.length, totalValue, leads }
    }))
    return ok(res, pipeline)
  } catch { return serverError(res) }
})

// GET /v1/crm/orders — sales orders
router.get('/orders', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req)
    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.salesOrder.count(),
    ])
    return ok(res, orders, buildMeta(total, page, limit))
  } catch { return serverError(res) }
})
