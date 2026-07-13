import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // ---- GDPR compliance ----
  // Never send IP addresses or user PII automatically
  sendDefaultPii: false,

  // Strip any cookie / auth header values from breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Drop fetch/xhr breadcrumbs to Supabase auth endpoints (contain tokens)
    if (
      breadcrumb.category === 'fetch' ||
      breadcrumb.category === 'xhr'
    ) {
      const url: string = (breadcrumb.data?.url as string) ?? ''
      if (
        url.includes('/auth/v1/') ||
        url.includes('supabase.co/auth')
      ) {
        return null // drop entirely
      }
      // Remove request body and headers from all fetch breadcrumbs
      if (breadcrumb.data) {
        delete breadcrumb.data.body
        delete breadcrumb.data.headers
        delete breadcrumb.data.requestBodySize
      }
    }
    return breadcrumb
  },

  // Scrub PII from events before sending
  beforeSend(event) {
    // Remove user context entirely (we set only anonymous id if needed)
    if (event.user) {
      event.user = { id: event.user.id } // keep only opaque ID, no email/name
    }
    // Strip cookies and auth headers from request data
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete (event.request.headers as Record<string, string>)['cookie']
        delete (event.request.headers as Record<string, string>)['authorization']
      }
    }
    return event
  },

  // ---- Performance ----
  // 10% of transactions in production — adjust as needed
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Replay: only on errors, never record personal interactions
  replaysOnErrorSampleRate: 0,   // disabled — Session Replay requires explicit cookie consent
  replaysSessionSampleRate: 0,

  // Use tunnel route instead of direct DSN calls
  tunnel: '/api/sentry-tunnel',

  environment: process.env.NODE_ENV,

  // Ignore non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /^No error$/,
    'AbortError',
  ],
})
