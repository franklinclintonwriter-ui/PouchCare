import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  }
  return _client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY)
}

export function supabaseStatus() {
  return {
    configured: isSupabaseConfigured(),
    url: env.SUPABASE_URL ? env.SUPABASE_URL.replace(/\/+$/, '') : null,
    hasStorage: isSupabaseConfigured(),
    hasRealtime: isSupabaseConfigured(),
    hasAnalytics: isSupabaseConfigured(),
  }
}

/** Fire-and-forget insert into a Supabase table. Never throws. */
export async function mirrorToSupabase(table: string, data: Record<string, unknown>) {
  try {
    const client = getSupabase()
    if (!client) return
    await client.from(table).insert(data)
  } catch {
    // Silent — analytics mirroring should never block the main flow
  }
}
