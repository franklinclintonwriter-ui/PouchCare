import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff, requireRoles, CEO_ROLES } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError } from '@/utils/response'

const createLeadSchema = z.object({
  company: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
})

const updateLeadSchema = z.object({
  company: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  estimatedValue: z.number().optional(),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  lastContactDate: z.string().optional(),
})

const createOrderSchema = z.object({
  clientName: z.string().min(1),
  service: z.string().min(1),
  amountUsd: z.number().min(0),
  paymentStatus: z.string().optional(),
  invoiceReference: z.string().optional(),
  notes: z.string().optional(),
})

const updateOrderSchema = z.object({
  clientName: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
  amountUsd: z.number().min(0).optional(),
  paymentStatus: z.string().optional(),
  invoiceReference: z.string().optional(),
  notes: z.string().optional(),
})

const router = Router()
router.use(authenticate)

router.get('/leads', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const { stage, status, q, source } = req.query as Record<string, string>
    const where: any = {}
    if (stage || status) where.stage = stage || status
    if (source) where.source = source
    if (q) where.OR = [
      { company: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]

    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.crmLead.count({ where }),
    ])
    return ok(res, leads, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.get('/leads/:id', requireStaff, async (req, res) => {
  try {
    const lead = await prisma.crmLead.findUnique({ where: { id: req.params.id } })
    if (!lead) return notFound(res)
    return ok(res, lead)
  } catch (err) { return serverError(res, err) }
})

router.post('/leads', requireStaff, validate(createLeadSchema), async (req, res) => {
  try {
    const { company, contactName, email, phone, source, stage, estimatedValue, notes } = req.body as z.infer<typeof createLeadSchema>
    const lead = await prisma.crmLead.create({
      data: { company, contactName, email, phone, source, stage: stage as any, estimatedValue, notes, owner: req.user!.id },
    })
    return created(res, lead)
  } catch (err) { return serverError(res, err) }
})

router.put('/leads/:id', requireStaff, validate(updateLeadSchema), async (req, res) => {
  try {
    const { company, contactName, email, phone, source, stage, estimatedValue, notes, nextFollowUpDate, lastContactDate } = req.body as z.infer<typeof updateLeadSchema>
    const data: Record<string, any> = {}
    if (company !== undefined) data.company = company
    if (contactName !== undefined) data.contactName = contactName
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone
    if (source !== undefined) data.source = source
    if (stage !== undefined) data.stage = stage
    if (estimatedValue !== undefined) data.estimatedValue = estimatedValue
    if (notes !== undefined) data.notes = notes
    if (nextFollowUpDate) data.nextFollowUpDate = new Date(nextFollowUpDate)
    if (lastContactDate) {
      data.lastContactDate = new Date(lastContactDate)
      data.followUpCount = { increment: 1 }
    }
    const lead = await prisma.crmLead.update({ where: { id: req.params.id }, data })
    return ok(res, lead)
  } catch (err) { return serverError(res, err) }
})

router.delete('/leads/:id', requireRoles(...CEO_ROLES as any), async (req, res) => {
  try {
    await prisma.crmLead.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Lead deleted' })
  } catch (err) { return serverError(res, err) }
})

// GET /v1/crm/pipeline — leads grouped by stage
router.get('/pipeline', requireStaff, async (_req, res) => {
  try {
    const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const pipeline = await Promise.all(stages.map(async (stage) => {
      const leads = await prisma.crmLead.findMany({
        where: { stage: stage as any },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      const totalValue = leads.reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0)
      return { stage, count: leads.length, totalValue, leads }
    }))
    return ok(res, pipeline)
  } catch (err) { return serverError(res, err) }
})

router.get('/orders', requireStaff, async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const { q, status } = req.query as Record<string, string>
    const where: any = {}
    if (status) where.paymentStatus = status
    if (q) {
      where.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { service: { contains: q, mode: 'insensitive' } },
        { invoiceReference: { contains: q, mode: 'insensitive' } },
      ]
    }
    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({ where, skip, take: limit, orderBy: { orderDate: 'desc' } }),
      prisma.salesOrder.count({ where }),
    ])
    return ok(res, orders, buildMeta(total, page, limit))
  } catch (err) { return serverError(res, err) }
})

router.post('/orders', requireStaff, validate(createOrderSchema), async (req, res) => {
  try {
    const { clientName, service, amountUsd, paymentStatus, invoiceReference, notes } = req.body as z.infer<typeof createOrderSchema>
    const order = await prisma.salesOrder.create({
      data: { clientName, service, amountUsd, paymentStatus: paymentStatus as any, invoiceReference, notes, orderDate: new Date() },
    })
    return created(res, order)
  } catch (err) { return serverError(res, err) }
})

router.get('/orders/:id', requireStaff, async (req, res) => {
  try {
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } })
    if (!order) return notFound(res)
    return ok(res, order)
  } catch (err) { return serverError(res, err) }
})

router.put('/orders/:id', requireStaff, validate(updateOrderSchema), async (req, res) => {
  try {
    const { clientName, service, amountUsd, paymentStatus, invoiceReference, notes } = req.body as z.infer<typeof updateOrderSchema>
    const data: Record<string, any> = {}
    if (clientName !== undefined) data.clientName = clientName
    if (service !== undefined) data.service = service
    if (amountUsd !== undefined) data.amountUsd = amountUsd
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus
    if (invoiceReference !== undefined) data.invoiceReference = invoiceReference
    if (notes !== undefined) data.notes = notes
    const order = await prisma.salesOrder.update({ where: { id: req.params.id }, data })
    return ok(res, order)
  } catch (err) { return serverError(res, err) }
})

router.delete('/orders/:id', requireRoles(...CEO_ROLES as any), async (req, res) => {
  try {
    await prisma.salesOrder.delete({ where: { id: req.params.id } })
    return ok(res, { message: 'Order deleted' })
  } catch (err) { return serverError(res, err) }
})

export default router
