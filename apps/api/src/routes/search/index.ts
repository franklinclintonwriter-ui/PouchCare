import { Router } from 'express'
import type { Prisma, SystemRole } from '@prisma/client'
import prisma from '@/lib/prisma'
import { crmLeadScopeWhere, mergeLeadWhere } from '@/lib/crmScope'
import { authenticate, requireStaff, MANAGER_ROLES } from '@/middleware/auth'
import { isStaffAllowed } from '@/lib/managementPermissions'
import { ok, serverError } from '@/utils/response'

const router = Router()
router.use(authenticate)

router.get('/', requireStaff, async (req, res) => {
  try {
    const { q = '', type } = req.query as Record<string, string>
    if (!q || q.length < 2) return ok(res, { results: [] })

    const results: Record<string, any[]> = {}
    const role = req.user!.role as SystemRole
    const canPipeline = MANAGER_ROLES.includes(role)

    if (!type || type === 'staff') {
      results.staff = await prisma.staffMember.findMany({
        where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
        take: 5,
        select: { id: true, name: true, email: true, systemRole: true, branch: true },
      })
    }
    if (!type || type === 'task') {
      results.tasks = await prisma.task.findMany({
        where: { title: { contains: q } },
        take: 5,
        select: { id: true, taskId: true, title: true, status: true, priority: true },
      })
    }
    if (!type || type === 'project') {
      results.projects = await prisma.project.findMany({
        where: { OR: [{ name: { contains: q } }, { clientName: { contains: q } }] },
        take: 5,
        select: { id: true, projectId: true, name: true, status: true },
      })
    }
    if ((!type || type === 'lead') && canPipeline) {
      const textWhere: Prisma.CrmLeadWhereInput = {
        OR: [{ company: { contains: q } }, { contactName: { contains: q } }],
      }
      const scope = crmLeadScopeWhere(req.user!.id, role)
      const where = mergeLeadWhere(textWhere, scope)
      results.leads = await prisma.crmLead.findMany({
        where,
        take: 5,
        select: { id: true, leadId: true, company: true, stage: true },
      })
    }
    if (!type || type === 'client') {
      const canPortal = await isStaffAllowed(role, 'admin_portal.access')
      if (canPortal) {
        results.clients = await prisma.portalMember.findMany({
          where: { OR: [{ fullName: { contains: q } }, { email: { contains: q } }] },
          take: 5,
          select: { id: true, fullName: true, email: true, status: true },
        })
      }
    }
    // Domain hits are staff global search over `Domain` rows (same table may include portal-linked rows; route remains staff `/v1/search`).
    if (!type || type === 'domain') {
      results.domains = await prisma.domain.findMany({
        where: { domainName: { contains: q } },
        take: 5,
        select: { id: true, domainName: true, status: true },
      })
    }

    return ok(res, { results, query: q })
  } catch (err) { return serverError(res, err) }
})

export default router
