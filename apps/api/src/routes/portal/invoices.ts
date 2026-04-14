import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal } from '@/middleware/auth'
import { ok, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'

const router = Router()
router.use(authenticate, requirePortal)

// GET /portal/invoices — List invoices for current portal member
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)
    const status = String(req.query.status ?? '')

    const where: any = { portalMemberId: req.user!.id, ...(status ? { status } : {}) }
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    console.error('[portal/invoices]', e)
    return serverError(res)
  }
})

// GET /portal/invoices/:id — Invoice detail
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!invoice) return notFound(res, 'Invoice')

    return ok(res, invoice)
  } catch (e) {
    console.error('[portal/invoices]', e)
    return serverError(res)
  }
})

export default router
