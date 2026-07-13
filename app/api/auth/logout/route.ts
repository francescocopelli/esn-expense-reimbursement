import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  Sentry.setUser(null)
  Sentry.addBreadcrumb({ category: 'auth', message: 'User signed out', level: 'info' })
  return NextResponse.redirect(
    new URL('/auth/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    { status: 303 }
  )
}
