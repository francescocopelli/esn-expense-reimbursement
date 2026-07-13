'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Global error boundary for Next.js App Router.
 * Captures unhandled errors in Server Components and sends them to Sentry.
 * No PII is included — only the error message and stack trace.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="it">
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h2>Si è verificato un errore imprevisto.</h2>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Il problema è stato segnalato automaticamente. Puoi riprovare o contattare un amministratore.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#003F87',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Riprova
        </button>
      </body>
    </html>
  )
}
