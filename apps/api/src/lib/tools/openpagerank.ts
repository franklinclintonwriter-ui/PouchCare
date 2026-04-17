import { getToolsEnv } from '@/lib/tools/config'

export interface OprDomainRow {
  domain: string
  /** Open PageRank decimal 0–10 (not Moz DA). */
  rank: number
  rankInteger: number
}

/**
 * Free tier: https://www.domcop.com/openpagerank/ — requires OPENPAGERANK_API_KEY
 */
export async function fetchOpenPageRanks(domains: string[]): Promise<OprDomainRow[]> {
  const { openPageRankKey } = getToolsEnv()
  if (!openPageRankKey) {
    throw new Error('OPENPAGERANK_API_KEY is not configured')
  }

  const clean = [...new Set(domains.map((d) => d.replace(/^https?:\/\//, '').split('/')[0]?.trim() ?? '').filter(Boolean))]
  if (clean.length === 0) throw new Error('No valid domains')

  const url = new URL('https://openpagerank.com/api/v1.0/getPageRank')
  for (const d of clean) {
    url.searchParams.append('domains[]', d)
  }

  const res = await fetch(url.toString(), {
    headers: { 'API-OPR': openPageRankKey },
  })
  const json = (await res.json()) as {
    status_code?: number
    error?: string
    response?: Array<{
      domain?: string
      page_rank_decimal?: number
      page_rank_integer?: number
      status_code?: number
    }>
  }

  if (!res.ok || json.status_code !== 200) {
    throw new Error(json.error || `Open PageRank HTTP ${res.status}`)
  }

  const rows = json.response ?? []
  return rows
    .filter((r) => r.domain)
    .map((r) => ({
      domain: r.domain!,
      rank: typeof r.page_rank_decimal === 'number' ? r.page_rank_decimal : Number(r.page_rank_integer ?? 0),
      rankInteger: typeof r.page_rank_integer === 'number' ? r.page_rank_integer : Math.round(Number(r.page_rank_decimal ?? 0)),
    }))
}
