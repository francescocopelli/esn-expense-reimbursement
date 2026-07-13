'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { context: 'global_error_boundary' },
      extra: { digest: error.digest },
    })
  }, [error])

  return (
    <html lang="it">
      <body style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <h2>Qualcosa è andato storto</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          L&apos;errore è stato registrato automaticamente. Puoi riprovare o contattare un amministratore.
        </p>
        {error.digest && (
          <p style={{ fontSize: '0.8rem', color: '#999' }}>Codice: {error.digest}</p>
        )}
        <button
          onClick={reset}
          style={{ padding: '0.5rem 1.5rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          Riprova
        </button>
      </body>
    </html>
  )
}
