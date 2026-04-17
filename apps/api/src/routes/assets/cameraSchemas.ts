import { z } from 'zod'

export const cameraStatusEnum = z.enum(['online', 'offline', 'recording'])

export const cameraCreateSchema = z.object({
  branchId: z.string().uuid(),
  branchName: z.string().trim().max(200).optional().nullable(),
  label: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional().nullable(),
  ipAddress: z.string().trim().max(120).optional().nullable(),
  streamUrl: z.string().trim().max(2000).optional().nullable(),
  rtspUrl: z.string().trim().max(2000).optional().nullable(),
  status: cameraStatusEnum.optional(),
  resolution: z.string().trim().max(40).optional().nullable(),
  fps: z.coerce.number().int().min(0).max(240).optional().nullable(),
  angle: z.string().trim().max(120).optional().nullable(),
  hasAudio: z.boolean().optional(),
  hasMotionDetect: z.boolean().optional(),
  nvrDevice: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
})

export const cameraUpdateSchema = cameraCreateSchema
  .omit({ branchId: true })
  .partial()
  .extend({
    branchId: z.string().uuid().optional(),
    branchName: z.string().trim().max(200).optional().nullable(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' })

export const cameraStatusPatchSchema = z.object({
  status: cameraStatusEnum,
})
