'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as Sentry from '@sentry/nextjs'

const DEV_ACCOUNTS = [
  { label: 'Mario Rossi (Member)',   email: 'mario@esn-dev.local',  password: 'dev1234' },
  { label: 'Giulia Bianchi (Board)', email: 'giulia@esn-dev.local', password: 'dev1234' },
]

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LoginForm() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const doLogin = async (em: string, pw: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: em, password: pw }),
      })

      // Surface non-OK responses as user-visible errors (not "network error")
      if (!res.ok) {
        let message = 'Errore durante il login'
        try {
          const json = await res.json()
          message = json.error ?? message
        } catch {
          message = `Errore ${res.status}: ${res.statusText}`
        }
        // Report unexpected server errors (5xx) to Sentry
        if (res.status >= 500) {
          Sentry.captureMessage(`Login API ${res.status}`, { level: 'error', extra: { status: res.status } })
        }
        setError(message)
        setLoading(false)
        return
      }

      const json = await res.json()

      // Full page navigation so the new cookies are sent on the next request
      window.location.href = json.redirectTo ?? '/'
    } catch (err) {
      // True network failure (offline, CORS, DNS) — report to Sentry
      Sentry.captureException(err, { tags: { context: 'login_fetch' } })
      setError('Errore di rete. Controlla la connessione e riprova.')
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doLogin(email, password)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <Image src="/logo.svg" alt="ESN Logo" width={150} height={56} priority className="login-logo" />
          <h1 className="login-title">Accedi</h1>
          <p className="login-subtitle">Online Reimbursement System</p>
        </div>

        {IS_DEV && (
          <div className="alert alert-warning" style={{ fontSize: '0.8125rem', marginBottom: '1.25rem' }}>
            <strong>\uD83D\uDEE0 Modalità sviluppo</strong>
            <p style={{ margin: '0.5rem 0' }}>Accedi con un account demo:</p>
            <div className="flex flex-col gap-2">
              {DEV_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => doLogin(acc.email, acc.password)}
                  disabled={loading}
                  className="btn btn-outline-gray btn-sm w-full"
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <hr style={{ margin: '0.75rem 0' }} />
            <span className="text-muted">Oppure inserisci manualmente:</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required className="form-control"
              placeholder={IS_DEV ? 'nome@esn-dev.local' : 'nome@esn.org'}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              required className="form-control"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full btn-lg">
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="login-footnote" style={{ color: '#6c757d' }}>
          Per ottenere un account contatta un amministratore ESN.
        </p>
      </div>
    </div>
  )
}
