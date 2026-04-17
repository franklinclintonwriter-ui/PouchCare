import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { authenticate, requireStaff, requireRoles, type AuthRequest } from '@/middleware/auth'
import { validate } from '@/middleware/validate'
import prisma from '@/lib/prisma'
import { ok, created, notFound, badRequest, serverError } from '@/lib/response'
import { getPagination, buildMeta } from '@/lib/pagination'
import {
  uploadFile,
  deleteFile,
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
} from '@/lib/storage'
import { SystemRole } from '@prisma/client'

const router = Router()
router.use(authenticate, requireStaff)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const HR_ROLES = ['CEO', 'CO_MD', 'OP_MANAGER', 'HR_MANAGER'] as SystemRole[]

const uploadSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORIES as unknown as [string, ...string[]]),
  documentType: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  issueDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
})

function canManageDocuments(req: AuthRequest, staffId: string): boolean {
  if (!req.user) return false
  if (HR_ROLES.includes(req.user.role)) return true
  return req.user.id === staffId
}

router.get('/:staffId/documents', async (req: AuthRequest, res) => {
  try {
    const { staffId } = req.params
    if (!canManageDocuments(req, staffId)) {
      return badRequest(res, 'You do not have permission to view these documents')
    }

    const { page, limit, skip } = getPagination(req)
    const { category } = req.query as { category?: string }

    const where: any = { staffMemberId: staffId }
    if (category && DOCUMENT_CATEGORIES.includes(category as any)) {
      where.category = category
    }

    const [documents, total] = await Promise.all([
      prisma.staffDocument.findMany({
        where,
        orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.staffDocument.count({ where }),
    ])

    return ok(res, documents, buildMeta(total, page, limit))
  } catch (err) {
    return serverError(res, err)
  }
})

router.post(
  '/:staffId/documents',
  upload.single('file'),
  async (req: AuthRequest, res) => {
    try {
      const { staffId } = req.params
      if (!canManageDocuments(req, staffId)) {
        return badRequest(res, 'You do not have permission to upload documents for this staff member')
      }

      const member = await prisma.staffMember.findUnique({ where: { id: staffId } })
      if (!member) return notFound(res, 'Staff member')

      if (!req.file) return badRequest(res, 'No file uploaded')

      if (!ALLOWED_DOCUMENT_TYPES.includes(req.file.mimetype)) {
        return badRequest(res, `File type ${req.file.mimetype} is not allowed. Allowed: PDF, images, Word documents`)
      }

      const parsed = uploadSchema.safeParse(req.body)
      if (!parsed.success) {
        return badRequest(res, parsed.error.errors.map((e) => e.message).join(', '))
      }

      const { category, documentType, title, description, issueDate, expiryDate } = parsed.data

      const validTypes = DOCUMENT_TYPES[category as keyof typeof DOCUMENT_TYPES] ?? []
      if (!validTypes.includes(documentType as never) && documentType !== 'other') {
        return badRequest(res, `Invalid document type "${documentType}" for category "${category}"`)
      }

      const uploadResult = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, {
        folder: `staff-documents/${staffId}`,
        allowedTypes: ALLOWED_DOCUMENT_TYPES,
        maxSizeMb: 10,
      })

      const document = await prisma.staffDocument.create({
        data: {
          staffMemberId: staffId,
          category,
          documentType,
          title,
          description: description || null,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          fileUrl: uploadResult.fileUrl,
          thumbnailUrl: uploadResult.thumbnailUrl || null,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          uploadedBy: req.user!.id,
        },
      })

      // Mirror document metadata to Supabase
      try {
        const { mirrorToSupabase } = require('@/lib/supabase')
        mirrorToSupabase('staff_documents', {
          staff_id: staffId,
          document_type: documentType,
          title,
          file_url: uploadResult.fileUrl,
          file_size: uploadResult.fileSize,
          mime_type: uploadResult.mimeType,
          category,
          is_verified: false,
        })
      } catch {}

      return created(res, document)
    } catch (err) {
      console.error('Document upload error:', err)
      return serverError(res, err)
    }
  }
)

router.get('/:staffId/documents/:docId', async (req: AuthRequest, res) => {
  try {
    const { staffId, docId } = req.params
    if (!canManageDocuments(req, staffId)) {
      return badRequest(res, 'You do not have permission to view this document')
    }

    const document = await prisma.staffDocument.findFirst({
      where: { id: docId, staffMemberId: staffId },
    })

    if (!document) return notFound(res, 'Document')
    return ok(res, document)
  } catch (err) {
    return serverError(res, err)
  }
})

router.put('/:staffId/documents/:docId', async (req: AuthRequest, res) => {
  try {
    const { staffId, docId } = req.params
    if (!canManageDocuments(req, staffId)) {
      return badRequest(res, 'You do not have permission to update this document')
    }

    const document = await prisma.staffDocument.findFirst({
      where: { id: docId, staffMemberId: staffId },
    })

    if (!document) return notFound(res, 'Document')

    const { title, description, issueDate, expiryDate } = req.body

    const updated = await prisma.staffDocument.update({
      where: { id: docId },
      data: {
        title: title ?? document.title,
        description: description !== undefined ? description : document.description,
        issueDate: issueDate ? new Date(issueDate) : document.issueDate,
        expiryDate: expiryDate ? new Date(expiryDate) : document.expiryDate,
      },
    })

    return ok(res, updated)
  } catch (err) {
    return serverError(res, err)
  }
})

router.put('/:staffId/documents/:docId/verify', requireRoles(...HR_ROLES), async (req: AuthRequest, res) => {
  try {
    const { staffId, docId } = req.params
    const document = await prisma.staffDocument.findFirst({
      where: { id: docId, staffMemberId: staffId },
    })

    if (!document) return notFound(res, 'Document')

    const updated = await prisma.staffDocument.update({
      where: { id: docId },
      data: {
        isVerified: true,
        verifiedBy: req.user!.id,
        verifiedAt: new Date(),
      },
    })

    return ok(res, updated)
  } catch (err) {
    return serverError(res, err)
  }
})

router.delete('/:staffId/documents/:docId', async (req: AuthRequest, res) => {
  try {
    const { staffId, docId } = req.params
    if (!canManageDocuments(req, staffId)) {
      return badRequest(res, 'You do not have permission to delete this document')
    }

    const document = await prisma.staffDocument.findFirst({
      where: { id: docId, staffMemberId: staffId },
    })

    if (!document) return notFound(res, 'Document')

    await deleteFile(document.fileUrl)
    if (document.thumbnailUrl) {
      await deleteFile(document.thumbnailUrl)
    }

    await prisma.staffDocument.delete({ where: { id: docId } })

    return ok(res, { message: 'Document deleted' })
  } catch (err) {
    return serverError(res, err)
  }
})

router.get('/document-categories', (_req, res) => {
  return ok(res, {
    categories: DOCUMENT_CATEGORIES,
    types: DOCUMENT_TYPES,
  })
})

export default router
