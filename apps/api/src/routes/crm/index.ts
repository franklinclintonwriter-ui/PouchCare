import { Router } from 'express'
import { z } from 'zod'
import type { Prisma, SystemRole } from '@prisma/client'
import { LeadStage, PaymentStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import {
  canAccessCrmLead,
  canAccessSalesOrder,
  crmLeadScopeWhere,
  mergeLeadWhere,
  mergeSalesOrderWhere,
  salesOrderScopeWhere,
} from '@/lib/crmScope'
import { authenticate, requireRoles, CEO_ROLES, MANAGER_ROLES, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import { getPagination, buildMeta } from '@/utils/pagination'
import { ok, created, notFound, serverError, forbidden } from '@/utils/response'

const createLeadSchema = z.object({
  company: z.string().min(1).max(200),
  contactName: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(80).optional(),
  source: z.string().max(120).optional(),
  stage: z.nativeEnum(LeadStage).optional(),
  estimatedValue: z.number().min(0).max(1e12).optional(),
  notes: z.string().max(20000).optional(),
})

const updateLeadSchema = z.object({
  company: z.string().min(1).max(200).optional(),
  contactName: z.string().max(200).optional(),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().max(80).optional(),
  source: z.string().max(120).optional(),
  stage: z.nativeEnum(LeadStage).optional(),
  estimatedValue: z.number().min(0).max(1e12).optional(),
  notes: z.string().max(20000).optional(),
  nextFollowUpDate: z.string().optional(),
  lastContactDate: z.string().optional(),
})

const createOrderSchema = z.object({
  clientName: z.string().min(1).max(200),
  service: z.string().min(1).max(200),
  amountUsd: z.number().min(0).max(1e12),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  invoiceReference: z.string().max(120).optional(),
  notes: z.string().max(20000).optional(),
  branch: z.string().max(120).optional(),
  assignedTo: z.string().uuid().optional(),
})

const updateOrderSchema = z.object({
  clientName: z.string().min(1).max(200).optional(),
  service: z.string().min(1).max(200).optional(),
  amountUsd: z.number().min(0).max(1e12).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  invoiceReference: z.string().max(120).optional(),
  notes: z.string().max(20000).optional(),
})

const router = Router()
router.use(authenticate)

function crmListMeta(role: SystemRole, m: ReturnType<typeof buildMeta>) {
  return { ...m, crmView: role === 'BRANCH_MANAGER' ? ('branch_manager' as const) : ('full' as const) }
}

router.get('/leads', requireRoles(...(MANAGER_ROLES as any)), async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const { stage, status, q, source } = req.query as Record<string, string>
    const role = req.user!.role as SystemRole
    const scope = crmLeadScopeWhere(req.user!.id, role)
    const filter: Prisma.CrmLeadWhereInput = {}
    if (stage || status) filter.stage = (stage || status) as Prisma.EnumLeadStageFilter['equals']
    if (source) filter.source = source
    if (q) {
      filter.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ]
    }
    const where = mergeLeadWhere(filter, scope)

    const [leads, total] = await Promise.all([
      prisma.crmLead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.crmLead.count({ where }),
    ])
    return ok(res, leads, crmListMeta(role, buildMeta(total, page, limit)))
  } catch (err) { return serverError(res, err) }
})

router.get('/leads/:id', requireRoles(...(MANAGER_ROLES as any)), async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessCrmLead(req.user!.id, req.user!.role as SystemRole, req.params.id)
    if (!allowed) return notFound(res)
    const lead = await prisma.crmLead.findUnique({ where: { id: req.params.id } })
    if (!lead) return notFound(res)
    return ok(res, lead)
  } catch (err) { return serverError(res, err) }
})

router.post('/leads', requireRoles(...(MANAGER_ROLES as any)), validate(createLeadSchema), async (req: AuthRequest, res) => {
  try {
    const { company, contactName, email, phone, source, stage, estimatedValue, notes } = req.body as z.infer<typeof createLeadSchema>
    const uid = req.user!.id
    const lead = await prisma.crmLead.create({
      data: {
        company,
        contactName: contactName?.trim() || company,
        email,
        phone,
        source,
        stage: stage ?? LeadStage.NEW,
        estimatedValue,
        notes,
        owner: uid,
        assignedTo: uid,
      },
    })
    return created(res, lead)
  } catch (err) { return serverError(res, err) }
})

router.put('/leads/:id', requireRoles(...(MANAGER_ROLES as any)), validate(updateLeadSchema), async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessCrmLead(req.user!.id, req.user!.role as SystemRole, req.params.id)
    if (!allowed) return notFound(res)
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
router.get('/pipeline', requireRoles(...(MANAGER_ROLES as any)), async (req: AuthRequest, res) => {
  try {
    const role = req.user!.role as SystemRole
    const scope = crmLeadScopeWhere(req.user!.id, role)
    const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']
    const pipeline = await Promise.all(
      stages.map(async (stageKey) => {
        const filter: Prisma.CrmLeadWhereInput = { stage: stageKey as LeadStage }
        const where = mergeLeadWhere(filter, scope)
        const [agg, leads] = await Promise.all([
          prisma.crmLead.aggregate({
            where,
            _count: true,
            _sum: { estimatedValue: true },
          }),
          prisma.crmLead.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 20,
          }),
        ])
        return {
          stage: stageKey,
          count: agg._count,
          totalValue: agg._sum.estimatedValue ?? 0,
          leads,
        }
      }),
    )
    return ok(res, pipeline, {
      crmView: role === 'BRANCH_MANAGER' ? 'branch_manager' : 'full',
    })
  } catch (err) { return serverError(res, err) }
})

router.get('/orders', requireRoles(...(MANAGER_ROLES as any)), async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query as Record<string, string>)
    const { q, status } = req.query as Record<string, string>
    const role = req.user!.role as SystemRole
    const scope = await salesOrderScopeWhere(req.user!.id, role)
    const filter: Prisma.SalesOrderWhereInput = {}
    if (status) filter.paymentStatus = status as Prisma.EnumPaymentStatusFilter['equals']
    if (q) {
      filter.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { service: { contains: q, mode: 'insensitive' } },
        { invoiceReference: { contains: q, mode: 'insensitive' } },
      ]
    }
    const where = mergeSalesOrderWhere(filter, scope)
    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({ where, skip, take: limit, orderBy: { orderDate: 'desc' } }),
      prisma.salesOrder.count({ where }),
    ])
    return ok(res, orders, crmListMeta(role, buildMeta(total, page, limit)))
  } catch (err) { return serverError(res, err) }
})

router.post('/orders', requireRoles(...(MANAGER_ROLES as any)), validate(createOrderSchema), async (req: AuthRequest, res) => {
  try {
    const body = req.body as z.infer<typeof createOrderSchema>
    const { clientName, service, amountUsd, paymentStatus, invoiceReference, notes } = body
    let branch: string | undefined = body.branch?.trim() || undefined
    let assignedTo: string | undefined = body.assignedTo
    if (req.user!.role === 'BRANCH_MANAGER') {
      const me = await prisma.staffMember.findUnique({
        where: { id: req.user!.id },
        select: { branch: true },
      })
      branch = me?.branch?.trim() || undefined
      assignedTo = req.user!.id
      if (!branch) return forbidden(res, 'Branch is required for your account to create orders')
    }
    const order = await prisma.salesOrder.create({
      data: {
        clientName,
        service,
        amountUsd,
        paymentStatus: paymentStatus ?? PaymentStatus.UNPAID,
        invoiceReference,
        notes,
        orderDate: new Date(),
        ...(branch ? { branch } : {}),
        ...(assignedTo ? { assignedTo } : {}),
      },
    })
    return created(res, order)
  } catch (err) { return serverError(res, err) }
})

router.get('/orders/:id', requireRoles(...(MANAGER_ROLES as any)), async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessSalesOrder(req.user!.id, req.user!.role as SystemRole, req.params.id)
    if (!allowed) return notFound(res)
    const order = await prisma.salesOrder.findUnique({ where: { id: req.params.id } })
    if (!order) return notFound(res)
    return ok(res, order)
  } catch (err) { return serverError(res, err) }
})

router.put('/orders/:id', requireRoles(...(MANAGER_ROLES as any)), validate(updateOrderSchema), async (req: AuthRequest, res) => {
  try {
    const allowed = await canAccessSalesOrder(req.user!.id, req.user!.role as SystemRole, req.params.id)
    if (!allowed) return notFound(res)
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
