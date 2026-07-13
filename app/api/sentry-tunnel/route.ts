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
const SENTRY_PROJECT_IDS = [process.env.SENTRY_PROJECT_ID ?? '']

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const envelope = body.split('\n')
    const header = JSON.parse(envelope[0])

    const dsn = new URL(header.dsn as string)
    if (dsn.hostname !== SENTRY_HOST) {
      return NextResponse.json({ error: 'Invalid DSN host' }, { status: 400 })
    }

    const projectId = dsn.pathname.replace('/', '')
    if (!SENTRY_PROJECT_IDS.includes(projectId)) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    const sentryUrl = `https://${SENTRY_HOST}/api/${projectId}/envelope/`
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
