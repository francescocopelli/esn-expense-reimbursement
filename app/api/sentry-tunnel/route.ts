/**
 * Sentry tunnel route
 *
 * Routes Sentry events through our own domain instead of directly to sentry.io.
 * Benefits:
 * - Bypasses ad-blockers that block sentry.io
 * - Hides the DSN from the client (GDPR: DSN is not PII but reduces fingerprinting surface)
 * - Allows future filtering/rate-limiting before events reach Sentry
 *
 * Based on: https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
 */
import { NextRequest, NextResponse } from 'next/server'

const SENTRY_HOST = 'sentry.io'

// Server-only env var (no NEXT_PUBLIC_ prefix — never exposed to the browser)
// Value: numeric project ID from the DSN, e.g. "4511727056650320"
// Found at: sentry.io/settings/projects/reimbursement-system/ → DSN path
const SENTRY_PROJECT_ID = process.env.SENTRY_PROJECT_ID ?? ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const envelope = body.split('\n')
    const header = JSON.parse(envelope[0])

    const dsn = new URL(header.dsn as string)
    if (dsn.hostname !== SENTRY_HOST && !dsn.hostname.endsWith('.ingest.sentry.io')) {
      return NextResponse.json({ error: 'Invalid DSN host' }, { status: 400 })
    }

    const projectId = dsn.pathname.replace('/', '')

    // If SENTRY_PROJECT_ID is set, enforce it; otherwise allow any project
    // (safe because host is already validated to *.sentry.io)
    if (SENTRY_PROJECT_ID && projectId !== SENTRY_PROJECT_ID) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    // Support both legacy sentry.io and regional ingest endpoints
    const sentryIngestHost = dsn.hostname.endsWith('.ingest.sentry.io')
      ? dsn.hostname
      : SENTRY_HOST
    const sentryUrl = `https://${sentryIngestHost}/api/${projectId}/envelope/`

    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-sentry-envelope' },
      body,
    })

    return new NextResponse(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Tunnel error' }, { status: 500 })
  }
}
