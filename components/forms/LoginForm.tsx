'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <Image src="/logo.svg" alt="ESN Logo" width={150} height={56} priority className="login-logo" />
          <h1 className="login-title">Accedi</h1>
          <p className="login-subtitle">Online Reimbursement System</p>
        </div>

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
              placeholder="nome@esn.org"
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

          <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full btn-lg">
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="login-footnote">
          Non hai un account?{' '}
          <Link href="/auth/register" style={{color:'var(--esn-dark-blue)', fontWeight:600}}>Registrati</Link>
        </p>
      </div>
    </div>
  )
}
