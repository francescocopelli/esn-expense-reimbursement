import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client: bypasses Row Level Security.
 * Use ONLY in server-side code (API routes, Server Components).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[supabase/admin] Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    )
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}
