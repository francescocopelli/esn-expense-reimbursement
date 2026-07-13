import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

/**
 * Service-role client: bypasses Row Level Security.
 * Use ONLY in server-side code (API routes, Server Components).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Diagnose missing/empty env vars loudly via Sentry before crashing
  if (!url || !key) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(', ')

    Sentry.captureMessage(`[ESN] createAdminClient: missing env vars — ${missing}`, {
      level: 'fatal',
      tags: { context: 'supabase_admin', event: 'missing_env' },
      extra: {
        NEXT_PUBLIC_SUPABASE_URL_present: !!url,
        SUPABASE_SERVICE_ROLE_KEY_present: !!key,
        SUPABASE_SERVICE_ROLE_KEY_length: key?.length ?? 0,
      },
    })

    throw new Error(
      `[supabase/admin] Missing env vars: ${missing}. ` +
      'Set them in Vercel → Project → Settings → Environment Variables.'
    )
  }

  // Extra guard: warn if the key looks like an anon key (starts with 'eyJ' but is short)
  // A service role JWT is typically > 200 chars
  if (key.length < 100) {
    Sentry.captureMessage('[ESN] createAdminClient: SUPABASE_SERVICE_ROLE_KEY looks too short — may be wrong key', {
      level: 'error',
      tags: { context: 'supabase_admin', event: 'suspicious_key' },
      extra: { keyLength: key.length },
    })
  }

  Sentry.addBreadcrumb({
    category: 'supabase',
    message: `createAdminClient: initialized (keyLength=${key.length})`,
    level: 'info',
    data: { urlPresent: true, keyLength: key.length },
  })

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}
