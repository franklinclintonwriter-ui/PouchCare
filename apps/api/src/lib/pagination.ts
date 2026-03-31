export function getPaginationParams(query: Record<string, any>) {
  const page  = Math.max(1, parseInt(query.page  as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  return { page, limit, skip: (page - 1) * limit }
}
export const getPagination = getPaginationParams

export function buildMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) }
}
export const paginatedMeta = buildMeta
export const paginate = getPaginationParams
export const paginatedResponse = buildMeta
