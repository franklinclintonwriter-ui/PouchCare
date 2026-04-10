/**
 * Optional third-party keys for SEO tools. Server starts without them; routes return 503 when missing.
 * Set in apps/api/.env — see .env.example.
 */
export function getToolsEnv() {
  return {
    serpApiKey: (process.env.SERPAPI_API_KEY ?? '').trim(),
    openPageRankKey: (process.env.OPENPAGERANK_API_KEY ?? '').trim(),
    dataForSeoLogin: (process.env.DATAFORSEO_LOGIN ?? '').trim(),
    dataForSeoPassword: (process.env.DATAFORSEO_PASSWORD ?? '').trim(),
  }
}

export function toolsStatus() {
  const e = getToolsEnv()
  return {
    serpApi: Boolean(e.serpApiKey),
    openPageRank: Boolean(e.openPageRankKey),
    dataForSeo: Boolean(e.dataForSeoLogin && e.dataForSeoPassword),
  }
}
