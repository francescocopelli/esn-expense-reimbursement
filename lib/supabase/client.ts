import { createBrowserClient } from '@supabase/ssr'

/**
 * Resolve the Supabase anon/publishable key with fallback.
 * Supports both old (ANON_KEY) and new (PUBLISHABLE_KEY) naming.
 */
function resolveSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''

  if (process.env.NODE_ENV === 'development' && !key) {
    console.error(
      '[supabase/client] ❌ Missing env var: set either ' +
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return key
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveSupabaseKey()
  )
}
