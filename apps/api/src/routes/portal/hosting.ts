import { Router } from 'express'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { authenticate, requirePortal, type AuthRequest } from '@/middleware/auth'
import { ok, created, badRequest, notFound, serverError } from '@/lib/response'
import { getPaginationParams, buildMeta } from '@/lib/pagination'
import { validate } from '@/middleware/validate'

const router = Router()
router.use(authenticate, requirePortal)

// Validation schemas
const createDomainSchema = z.object({
  domainName: z.string().min(3).max(253),
  registrar: z.string().optional(),
  autoRenew: z.boolean().optional().default(true),
  notes: z.string().optional(),
})

const updateDomainSchema = z.object({
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
  nameservers: z.array(z.string()).optional(),
})

const dnsRecordSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']),
  name: z.string(),
  value: z.string(),
  ttl: z.number().int().positive().optional().default(3600),
  priority: z.number().int().optional(),
})

// GET /portal/hosting/domains — List domains owned by portal member
router.get('/domains', async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any)

    const where: any = { portalMemberId: req.user!.id }
    const [items, total] = await Promise.all([
      prisma.domain.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.domain.count({ where }),
    ])
    return ok(res, items, buildMeta(total, page, limit))
  } catch (e) {
    console.error('[portal/hosting/domains]', e)
    return serverError(res)
  }
})

// POST /portal/hosting/domains — Register/add new domain
router.post('/domains', validate(createDomainSchema), async (req: AuthRequest, res) => {
  try {
    const { domainName, registrar, autoRenew, notes } = req.body

    // Check if domain already exists
    const existing = await prisma.domain.findUnique({
      where: { domainName },
    })
    if (existing) return badRequest(res, 'Domain already registered')

    // Create domain record with portalMemberId
    const domain = await prisma.domain.create({
      data: {
        domainName,
        registrar: registrar || 'PouchCare',
        status: 'Active',
        registrationDate: new Date(),
        notes: notes || undefined,
        portalMemberId: req.user!.id,
      },
    })

    return created(res, {
      ...domain,
      autoRenew: autoRenew ?? true,
      dnsRecords: [],
    })
  } catch (e) {
    console.error('[portal/hosting/domains]', e)
    return serverError(res)
  }
})

// GET /portal/hosting/domains/:id — Domain detail
router.get('/domains/:id', async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!domain) return notFound(res, 'Domain')

    // Parse DNS records if stored as JSON string
    let dnsRecords: any[] = []
    if (domain.notes) {
      try {
        const parsed = JSON.parse(domain.notes)
        if (parsed.dnsRecords) dnsRecords = parsed.dnsRecords
      } catch {
        // Notes is just text, not JSON
      }
    }

    return ok(res, {
      ...domain,
      dnsRecords,
      ssl: {
        status: domain.sslStatus || 'not-configured',
        expiresAt: null,
        autoRenew: true,
      },
      usage: {
        bandwidthGb: 0,
        storageGb: 0,
      },
    })
  } catch (e) {
    console.error('[portal/hosting/domains]', e)
    return serverError(res)
  }
})

// PATCH /portal/hosting/domains/:id — Update domain
router.patch('/domains/:id', validate(updateDomainSchema), async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!domain) return notFound(res, 'Domain')

    const { autoRenew, notes, nameservers } = req.body

    // Build update data
    const updateData: any = {}
    if (notes !== undefined) updateData.notes = notes
    if (nameservers) {
      // Store nameservers in notes as JSON
      const existing = domain.notes ? JSON.parse(domain.notes).nameservers : []
      updateData.notes = JSON.stringify({
        ...JSON.parse(domain.notes || '{}'),
        nameservers,
      })
    }

    const updated = await prisma.domain.update({
      where: { id: req.params.id },
      data: updateData,
    })

    return ok(res, {
      ...updated,
      autoRenew: autoRenew ?? true,
    })
  } catch (e) {
    console.error('[portal/hosting/domains]', e)
    return serverError(res)
  }
})

// DELETE /portal/hosting/domains/:id — Remove domain
router.delete('/domains/:id', async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!domain) return notFound(res, 'Domain')

    await prisma.domain.delete({
      where: { id: req.params.id },
    })

    return ok(res, { message: 'Domain deleted' })
  } catch (e) {
    console.error('[portal/hosting/domains]', e)
    return serverError(res)
  }
})

// GET /portal/hosting/search — Domain availability check
router.get('/search', async (req: AuthRequest, res) => {
  try {
    const { query } = req.query as any
    if (!query || query.length < 3) {
      return badRequest(res, 'Query must be at least 3 characters')
    }

    // Check which TLDs are already registered in our system
    const tlds = ['com', 'net', 'io', 'co']
    const candidates = tlds.map(tld => `${query}.${tld}`)
    const existing = await prisma.domain.findMany({
      where: { domainName: { in: candidates } },
      select: { domainName: true },
    })
    const taken = new Set(existing.map(d => d.domainName))

    const pricing: Record<string, { price: number; registrar: string }> = {
      com: { price: 12.99, registrar: 'GoDaddy' },
      net: { price: 11.99, registrar: 'Namecheap' },
      io:  { price: 34.99, registrar: 'GoDaddy' },
      co:  { price: 29.99, registrar: 'Namecheap' },
    }

    const suggestions = tlds.map(tld => ({
      domain: `${query}.${tld}`,
      available: !taken.has(`${query}.${tld}`),
      price: pricing[tld].price,
      registrar: pricing[tld].registrar,
    }))

    return ok(res, suggestions)
  } catch (e) {
    console.error('[portal/hosting/search]', e)
    return serverError(res)
  }
})

// POST /portal/hosting/domains/:id/dns — Add DNS record
router.post('/domains/:id/dns', validate(dnsRecordSchema), async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!domain) return notFound(res, 'Domain')

    const record = {
      id: `dns_${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    }

    // Parse existing DNS records
    let existing = domain.notes ? JSON.parse(domain.notes) : {}
    if (!existing.dnsRecords) existing.dnsRecords = []
    existing.dnsRecords.push(record)

    await prisma.domain.update({
      where: { id: req.params.id },
      data: { notes: JSON.stringify(existing) },
    })

    return created(res, record)
  } catch (e) {
    console.error('[portal/hosting/domains/:id/dns]', e)
    return serverError(res)
  }
})

// PATCH /portal/hosting/domains/:id/dns/:recordId — Update DNS record
router.patch('/domains/:id/dns/:recordId', validate(dnsRecordSchema), async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!domain) return notFound(res, 'Domain')

    const existing = domain.notes ? JSON.parse(domain.notes) : {}
    if (!existing.dnsRecords) return notFound(res, 'DNS record')

    const recordIdx = existing.dnsRecords.findIndex((r: any) => r.id === req.params.recordId)
    if (recordIdx === -1) return notFound(res, 'DNS record')

    existing.dnsRecords[recordIdx] = {
      ...existing.dnsRecords[recordIdx],
      ...req.body,
      updatedAt: new Date().toISOString(),
    }

    await prisma.domain.update({
      where: { id: req.params.id },
      data: { notes: JSON.stringify(existing) },
    })

    return ok(res, existing.dnsRecords[recordIdx])
  } catch (e) {
    console.error('[portal/hosting/domains/:id/dns/:recordId]', e)
    return serverError(res)
  }
})

// DELETE /portal/hosting/domains/:id/dns/:recordId — Remove DNS record
router.delete('/domains/:id/dns/:recordId', async (req: AuthRequest, res) => {
  try {
    const domain = await prisma.domain.findFirst({
      where: { id: req.params.id, portalMemberId: req.user!.id },
    })
    if (!domain) return notFound(res, 'Domain')

    const existing = domain.notes ? JSON.parse(domain.notes) : {}
    if (!existing.dnsRecords) return notFound(res, 'DNS record')

    const recordIdx = existing.dnsRecords.findIndex((r: any) => r.id === req.params.recordId)
    if (recordIdx === -1) return notFound(res, 'DNS record')

    existing.dnsRecords.splice(recordIdx, 1)

    await prisma.domain.update({
      where: { id: req.params.id },
      data: { notes: JSON.stringify(existing) },
    })

    return ok(res, { message: 'DNS record deleted' })
  } catch (e) {
    console.error('[portal/hosting/domains/:id/dns/:recordId]', e)
    return serverError(res)
  }
})

export default router
