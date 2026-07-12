'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Demo accounts — used only in development (NODE_ENV === 'development')
// In production these buttons are hidden; real ESN accounts go through Supabase Auth.
const DEV_ACCOUNTS = [
  { label: 'Mario Rossi (Member)',    email: 'mario@esn-dev.local',   password: 'dev1234' },
  { label: 'Giulia Bianchi (Board)',  email: 'giulia@esn-dev.local',  password: 'dev1234' },
]

const IS_DEV = process.env.NODE_ENV === 'development'

export default function LoginForm() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  const handleDevLogin = async (acc: typeof DEV_ACCOUNTS[0]) => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    })
    if (error) {
      setError(`Dev login fallito: ${error.message}`)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <Image
            src="/logo.svg"
            alt="ESN Logo"
            width={150}
            height={56}
            priority
            className="login-logo"
          />
          <h1 className="login-title">Accedi</h1>
          <p className="login-subtitle">Online Reimbursement System</p>
        </div>

        {/* DEV ONLY: quick account selector — hidden in production */}
        {IS_DEV && (
          <div
            className="alert alert-warning"
            style={{ fontSize: '0.8125rem', marginBottom: '1.25rem' }}
          >
            <strong>🛠 Modalità sviluppo</strong>
            <p style={{ margin: '0.5rem 0' }}>Accedi con un account demo:</p>
            <div className="flex flex-col gap-2">
              {DEV_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDevLogin(acc)}
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

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="form-control"
              placeholder={IS_DEV ? 'nome@esn-dev.local' : 'nome@esn.org'}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="form-control"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-esn-cyan w-full btn-lg"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="login-footnote">
          Non hai un account?{' '}
          <Link
            href="/auth/register"
            style={{ color: 'var(--esn-dark-blue)', fontWeight: 600 }}
          >
            Registrati
          </Link>
        </p>
      </div>
    </div>
  )
}
