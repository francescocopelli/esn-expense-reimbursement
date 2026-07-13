/**
 * Centralized Sentry helpers.
 * Import from here instead of @sentry/nextjs directly for consistent tags.
 */
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export type ApiContext = {
  route: string
  method?: string
  userId?: string
  [key: string]: unknown
}

/**
 * Wraps an API route handler with Sentry error capture + breadcrumb.
 * On unhandled throw → 500 JSON + Sentry event.
 */
export function withSentry<TArgs extends unknown[]>(
  ctx: ApiContext,
  handler: (...args: TArgs) => Promise<Response>
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs): Promise<Response> => {
    Sentry.addBreadcrumb({
      category: 'api.request',
      message: `${ctx.method ?? 'REQUEST'} ${ctx.route}`,
      level: 'info',
      data: { route: ctx.route, userId: ctx.userId },
    })
    try {
      return await handler(...args)
    } catch (err) {
      Sentry.captureException(err, {
        tags: { route: ctx.route, method: ctx.method ?? 'unknown' },
        extra: { ...ctx },
      })
      console.error(`[${ctx.route}] unhandled:`, err)
      return NextResponse.json(
        { error: 'Errore interno del server' },
        { status: 500 }
      )
    }
  }
}

/** Log a DB error to Sentry without throwing. */
export function captureDbError(
  label: string,
  error: { message?: string; code?: string; details?: string; hint?: string } | null,
  extra?: Record<string, unknown>
) {
  if (!error) return
  Sentry.captureMessage(`[DB] ${label}`, {
    level: 'error',
    extra: {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      ...extra,
    },
    tags: { context: label },
  })
}

/** Log a warning breadcrumb (non-fatal). */
export function breadcrumb(
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.addBreadcrumb({ message, data, level, category: 'app' })
}
