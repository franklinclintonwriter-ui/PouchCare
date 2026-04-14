import { getToolsEnv } from '@/lib/tools/config'

export interface SerpOrganicRow {
  id: string
  position: number
  url: string
  title: string
  features: string[]
}

/**
 * Google organic results via SerpAPI (https://serpapi.com). Requires SERPAPI_API_KEY.
 */
export async function fetchGoogleSerpTop(params: {
  q: string
  hl: string
  gl: string
  num?: number
}): Promise<SerpOrganicRow[]> {
  const { serpApiKey } = getToolsEnv()
  if (!serpApiKey) {
    throw new Error('SERPAPI_API_KEY is not configured')
  }

  const num = Math.min(100, Math.max(10, params.num ?? 100))
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', params.q)
  url.searchParams.set('hl', params.hl || 'en')
  url.searchParams.set('gl', (params.gl || 'us').toLowerCase())
  url.searchParams.set('num', String(num))
  url.searchParams.set('api_key', serpApiKey)

  const res = await fetch(url.toString(), { method: 'GET' })
  const json = (await res.json()) as {
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

  if (!res.ok) {
    throw new Error(json.error || `SerpAPI HTTP ${res.status}`)
  }
  if (json.error) {
    throw new Error(json.error)
  }

  const organic = json.organic_results ?? []
  return organic.map((r, i) => {
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
