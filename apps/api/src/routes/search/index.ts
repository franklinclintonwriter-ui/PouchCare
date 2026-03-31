import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate, requireStaff  } from '@/middleware/auth'
import { ok, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)

router.get('/', requireStaff, async (req, res) => {
  try {
    const { q = '', type } = req.query as Record<string, string>
    if (!q || q.length < 2) return ok(res, { results: [] })

    const mode = 'insensitive' as const
    const results: Record<string, any[]> = {}

    if (!type || type === 'staff') {
      results.staff = await prisma.staffMember.findMany({
        where: { OR: [{ name: { contains: q, mode } }, { email: { contains: q, mode } }] },
        take: 5,
        select: { id: true, name: true, email: true, systemRole: true, branch: true },
      })
    }
    if (!type || type === 'task') {
      results.tasks = await prisma.task.findMany({
        where: { title: { contains: q, mode } },
        take: 5,
        select: { id: true, taskId: true, title: true, status: true, priority: true },
      })
    }
    if (!type || type === 'project') {
      results.projects = await prisma.project.findMany({
        where: { OR: [{ name: { contains: q, mode } }, { clientName: { contains: q, mode } }] },
        take: 5,
        select: { id: true, projectId: true, name: true, status: true },
      })
    }
    if (!type || type === 'lead') {
      results.leads = await prisma.crmLead.findMany({
        where: { OR: [{ company: { contains: q, mode } }, { contactName: { contains: q, mode } }] },
        take: 5,
        select: { id: true, leadId: true, company: true, stage: true },
      })
    }
    if (!type || type === 'client') {
      results.clients = await prisma.portalMember.findMany({
        where: { OR: [{ fullName: { contains: q, mode } }, { email: { contains: q, mode } }] },
        take: 5,
        select: { id: true, fullName: true, email: true, status: true },
      })
    }
    if (!type || type === 'domain') {
      results.domains = await prisma.domain.findMany({
        where: { domainName: { contains: q, mode } },
        take: 5,
        select: { id: true, domainName: true, status: true },
      })
    }

    return ok(res, { results, query: q })
  } catch (err) { serverError(res, err) }
})

export default router
