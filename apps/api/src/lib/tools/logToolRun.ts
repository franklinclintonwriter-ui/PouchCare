import prisma from '@/lib/prisma'
import type { ToolRunType } from '@prisma/client'

export async function logToolRun(
  staffId: string,
  toolType: ToolRunType,
  queryLabel: string,
  meta?: Record<string, unknown>,
) {
  try {
    await prisma.toolRun.create({
      data: {
        staffId,
        toolType,
        queryLabel: queryLabel.slice(0, 2000),
        meta: meta ? (meta as object) : undefined,
      },
    })
  } catch (e) {
    console.warn('[tools] logToolRun failed', e)
  }
}
