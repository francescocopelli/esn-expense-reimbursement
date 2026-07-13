import * as Sentry from '@sentry/nextjs'

// Edge Runtime config (middleware)
Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  sendDefaultPii: false,

  beforeSend(event) {
    if (event.user) {
      event.user = { id: event.user.id }
    }
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        const h = event.request.headers as Record<string, string>
        delete h['cookie']
        delete h['authorization']
        delete h['x-forwarded-for']
        delete h['x-real-ip']
      }
    }
    return event
  },

  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,

  ignoreErrors: ['NEXT_REDIRECT', 'NEXT_NOT_FOUND'],
})
