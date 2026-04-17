/**
 * /v1/admin/assets/client/:clientId — client-scoped asset aggregator.
 * Reads existing Website / Domain / Server tables, filtered to a single client
 * (by portalMemberId). Provides the data for the ClientDetail "Assets" tab.
 */
import { Router } from 'express'
import prisma from '@/lib/prisma'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { ok, notFound, serverError } from '@/lib/response'

const router = Router()
router.use(authenticate)

router.get(
  '/client/:clientId',
  requirePermission('admin.assets.read'),
  async (req, res) => {
    try {
      const id = req.params.clientId
      const memberId = id.startsWith('acct:') ? null : id
      if (!memberId) {
        return ok(res, { websites: [], domains: [], servers: [] })
      }

      // Server has no portal-member FK in the current schema, so it returns [] —
      // it remains a staff-only inventory resource.
      const [websites, domains] = await Promise.all([
        prisma.website
          .findMany({
            where: { portalMemberId: memberId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
          .catch(() => []),
        prisma.domain
          .findMany({
            where: { portalMemberId: memberId },
            orderBy: { createdAt: 'desc' },
            take: 50,
          })
          .catch(() => []),
      ])

      const member = await prisma.portalMember.findUnique({
        where: { id: memberId },
        select: { id: true, fullName: true, email: true },
      })
      if (!member) return notFound(res, 'Member')

      return ok(res, { websites, domains, servers: [] })
    } catch (e) {
      return serverError(res, e)
    }
  },
)

export default router
