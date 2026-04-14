import { z } from 'zod'
import { SystemRole } from '@prisma/client'

/** Whitelisted fields for admin updates (no password, no computed counters). */
export const staffAdminUpdateSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    email: z.string().email().max(255).optional(),
    systemRole: z.nativeEnum(SystemRole).optional(),
    status: z.string().max(50).optional(),
    branch: z.string().max(200).optional(),
    jobRole: z.string().max(200).nullable().optional(),
    primarySkill: z.string().max(200).nullable().optional(),
    skillLevel: z.string().max(50).nullable().optional(),
    secondarySkills: z.string().max(2000).nullable().optional(),
    toolsKnown: z.string().max(2000).nullable().optional(),
    yearsExperience: z.number().min(0).max(80).optional().nullable(),
    employmentType: z.string().max(80).nullable().optional(),
    salary: z.number().min(0).optional().nullable(),
    email2: z
      .union([z.string().email(), z.literal('')])
      .nullable()
      .optional()
      .transform((v) => (v === '' ? null : v)),
    phone: z.string().max(50).nullable().optional(),
    whatsapp: z.string().max(50).nullable().optional(),
    address: z.string().max(500).nullable().optional(),
    country: z.string().max(120).nullable().optional(),
    nidPassport: z.string().max(120).nullable().optional(),
    emergencyContact: z.string().max(200).nullable().optional(),
    joinDate: z.coerce.date().optional().nullable(),
    terminationDate: z.coerce.date().optional().nullable(),
    exitReason: z.string().max(500).nullable().optional(),
    portfolioUrl: z.string().max(500).nullable().optional(),
    linkedinUrl: z.string().max(500).nullable().optional(),
    githubUrl: z.string().max(500).nullable().optional(),
    certifications: z.string().max(2000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field is required' })
