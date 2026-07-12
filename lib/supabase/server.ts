import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> }

/**
 * Resolve the Supabase anon/publishable key.
 * @supabase/ssr >= 0.6 renamed NEXT_PUBLIC_SUPABASE_ANON_KEY to
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. We support both to avoid silent
 * breakage when the Vercel env var is set with the old name.
 */
function resolveSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!key) {
    throw new Error(
      '[supabase/server] Missing env var: set either ' +
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.warn(
      '[supabase/server] ⚠️  Using deprecated NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Rename it to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local'
    )
  }

  return key
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    resolveSupabaseKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Server Component — ignorare
          }
        },
      },
    }
  )
}
