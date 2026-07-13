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

// Matches all Sentry ingest hostnames:
//   sentry.io
//   *.ingest.sentry.io          (legacy)
//   *.ingest.us.sentry.io       (US region)
//   *.ingest.de.sentry.io       (EU/DE region)
//   *.ingest.<any>.sentry.io    (future regions)
function isValidSentryHost(hostname: string): boolean {
  return (
    hostname === SENTRY_HOST ||
    /\.ingest(\.[a-z]{2})?\.sentry\.io$/.test(hostname)
  )
}

const SENTRY_PROJECT_ID = process.env.SENTRY_PROJECT_ID ?? ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    if (!body) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

    const firstLine = body.split('\n')[0]
    let header: Record<string, unknown>
    try {
      header = JSON.parse(firstLine)
    } catch {
      return NextResponse.json({ error: 'Invalid envelope header' }, { status: 400 })
    }

    if (!header.dsn) {
      const sentryUrl = `https://${SENTRY_HOST}/api/envelope/`
      const response = await fetch(sentryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-sentry-envelope' },
        body,
      })
      return new NextResponse(response.body, { status: response.status })
    }

    const dsn = new URL(header.dsn as string)
    if (!isValidSentryHost(dsn.hostname)) {
      console.error(`[sentry-tunnel] Invalid DSN host: ${dsn.hostname}`)
      return NextResponse.json({ error: 'Invalid DSN host' }, { status: 400 })
    }

    const projectId = dsn.pathname.replace(/^\//, '')

    if (SENTRY_PROJECT_ID && projectId !== SENTRY_PROJECT_ID) {
      console.error(
        `[sentry-tunnel] Project ID mismatch: envelope has "${projectId}", ` +
        `SENTRY_PROJECT_ID env is "${SENTRY_PROJECT_ID}". ` +
        'Update SENTRY_PROJECT_ID on Vercel to match your DSN.'
      )
      return NextResponse.json(
        { error: 'Project ID mismatch', envelope: projectId, configured: SENTRY_PROJECT_ID },
        { status: 400 }
      )
    }

    // Forward to the exact ingest host from the DSN (preserves regional routing)
    const sentryUrl = `https://${dsn.hostname}/api/${projectId}/envelope/`

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
    console.error('[sentry-tunnel] Unexpected error:', e)
    return NextResponse.json({ error: 'Tunnel error' }, { status: 500 })
  }
}
