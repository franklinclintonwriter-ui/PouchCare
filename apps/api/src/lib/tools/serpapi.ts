import { getToolsEnv } from '@/lib/tools/config'

export interface SerpOrganicRow {
  id: string
  position: number
  url: string
  title: string
  features: string[]
}

type SerpApiOrganicJson = {
  error?: string
  organic_results?: Array<{
    position?: number
    link?: string
    title?: string
    snippet?: string
    rich_snippet?: unknown
    about_this_result?: unknown
  }>
}

function mapOrganicToRows(organic: SerpApiOrganicJson['organic_results']): SerpOrganicRow[] {
  const list = organic ?? []
  return list.map((r, i) => {
    const pos = r.position ?? i + 1
    const features: string[] = []
    if (r.snippet) features.push('snippet')
    if (r.rich_snippet) features.push('rich_snippet')
    if (r.about_this_result) features.push('about')
    if (features.length === 0) features.push('none')
    return {
      id: `serp-${pos}-${encodeURIComponent(r.link || '').slice(0, 40)}`,
      position: pos,
      url: r.link || '',
      title: r.title || '(no title)',
      features,
    }
  })
}

async function serpApiGoogleJson(params: {
  q: string
  hl: string
  gl: string
  num: number
  start: number
  apiKey: string
  location?: string
  google_domain?: string
  device?: string
}): Promise<SerpApiOrganicJson> {
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', params.q)
  url.searchParams.set('hl', params.hl || 'en')
  url.searchParams.set('gl', (params.gl || 'us').toLowerCase())
  url.searchParams.set('num', String(params.num))
  url.searchParams.set('start', String(params.start))
  url.searchParams.set('api_key', params.apiKey)
  if (params.location?.trim()) {
    url.searchParams.set('location', params.location.trim())
  }
  if (params.google_domain?.trim()) {
    url.searchParams.set('google_domain', params.google_domain.trim().replace(/^https?:\/\//i, ''))
  }
  if (params.device?.trim()) {
    url.searchParams.set('device', params.device.trim())
  }

  const res = await fetch(url.toString(), { method: 'GET' })
  const json = (await res.json()) as SerpApiOrganicJson

  if (!res.ok) {
    throw new Error(json.error || `SerpAPI HTTP ${res.status}`)
  }
  if (json.error) {
    throw new Error(json.error)
  }
  return json
}

/**
 * Google organic results via SerpAPI (https://serpapi.com). Requires SERPAPI_API_KEY.
 */
export async function fetchGoogleSerpTop(params: {
  q: string
  hl: string
  gl: string
  num?: number
  location?: string
  google_domain?: string
}): Promise<SerpOrganicRow[]> {
  const { serpApiKey } = getToolsEnv()
  if (!serpApiKey) {
    throw new Error('SERPAPI_API_KEY is not configured')
  }

  const num = Math.min(100, Math.max(10, params.num ?? 100))
  const json = await serpApiGoogleJson({
    q: params.q,
    hl: params.hl,
    gl: params.gl,
    num,
    start: 0,
    apiKey: serpApiKey,
    location: params.location,
    google_domain: params.google_domain,
  })
  return mapOrganicToRows(json.organic_results)
}

/** Normalize user input (domain or URL) to a registrable host for matching (no leading www.). */
export function normalizeSerpTargetHost(input: string): string {
  const raw = input.trim().toLowerCase()
  if (!raw) return ''
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const h = new URL(withProto).hostname
    return h.replace(/^www\./, '')
  } catch {
    return raw.replace(/^www\./, '').split('/')[0] ?? ''
  }
}

function resultHostMatches(link: string, targetHost: string): boolean {
  if (!targetHost || !link) return false
  try {
    const h = new URL(link).hostname.toLowerCase().replace(/^www\./, '')
    return h === targetHost || h.endsWith(`.${targetHost}`)
  } catch {
    return false
  }
}

export interface SerpRankCheckResult {
  position: number | null
  matchedUrl: string | null
  title: string | null
  scannedOrganic: number
  pagesFetched: number
}

/**
 * Find the first organic result whose URL hostname matches the target domain (including subdomains).
 * Scans up to `maxScan` organic positions using SerpApi pagination (`start` + `num`).
 */
export async function fetchGoogleSerpRankForDomain(params: {
  q: string
  hl: string
  gl: string
  target: string
  location?: string
  google_domain?: string
  /** Results per request (SerpApi allows up to 100 for Google organic). */
  num?: number
  /** Do not scan beyond this absolute organic rank (e.g. 100). */
  maxScan?: number
}): Promise<SerpRankCheckResult> {
  const { serpApiKey } = getToolsEnv()
  if (!serpApiKey) {
    throw new Error('SERPAPI_API_KEY is not configured')
  }

  const targetHost = normalizeSerpTargetHost(params.target)
  if (!targetHost) {
    throw new Error('target domain or URL is required')
  }

  const num = Math.min(100, Math.max(10, params.num ?? 100))
  const maxScan = Math.min(200, Math.max(10, params.maxScan ?? 100))

  let scanned = 0
  let pagesFetched = 0

  for (let start = 0; start < maxScan; start += num) {
    const json = await serpApiGoogleJson({
      q: params.q,
      hl: params.hl,
      gl: params.gl,
      num,
      start,
      apiKey: serpApiKey,
      location: params.location,
      google_domain: params.google_domain,
    })
    pagesFetched += 1

    const organic = json.organic_results ?? []
    if (organic.length === 0) {
      break
    }

    for (let i = 0; i < organic.length; i++) {
      const r = organic[i]!
      const pos = r.position ?? start + i + 1
      const link = r.link || ''
      scanned += 1
      if (pos > maxScan) {
        return {
          position: null,
          matchedUrl: null,
          title: null,
          scannedOrganic: scanned,
          pagesFetched,
        }
      }
      if (resultHostMatches(link, targetHost)) {
        return {
          position: pos,
          matchedUrl: link,
          title: r.title ?? null,
          scannedOrganic: scanned,
          pagesFetched,
        }
      }
    }

    if (organic.length < num) {
      break
    }
  }

  return {
    position: null,
    matchedUrl: null,
    title: null,
    scannedOrganic: scanned,
    pagesFetched,
  }
}
