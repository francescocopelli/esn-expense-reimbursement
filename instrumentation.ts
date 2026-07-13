import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
      sendDefaultPii: false,

      beforeBreadcrumb(breadcrumb) {
        if (
          breadcrumb.category === 'fetch' ||
          breadcrumb.category === 'xhr'
        ) {
          const url: string = (breadcrumb.data?.url as string) ?? ''
          if (url.includes('/auth/v1/') || url.includes('supabase.co/auth')) {
            return null
          }
          if (breadcrumb.data) {
            delete breadcrumb.data.body
            delete breadcrumb.data.headers
          }
        }
        return breadcrumb
      },

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

      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV,

      ignoreErrors: [
        'NEXT_REDIRECT',
        'NEXT_NOT_FOUND',
      ],
    })

    // Startup breadcrumb — confirms Sentry is active on this deployment
    Sentry.addBreadcrumb({
      category: 'app.lifecycle',
      message: `Server started — env=${process.env.NODE_ENV} runtime=nodejs`,
      level: 'info',
    })
    Sentry.captureMessage(
      `[ESN] Server startup — ${process.env.NODE_ENV}`,
      { level: 'info', tags: { runtime: 'nodejs', event: 'startup' } }
    )
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
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
  }
}

export const onRequestError = Sentry.captureRequestError
