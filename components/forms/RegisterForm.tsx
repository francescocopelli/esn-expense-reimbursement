'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterForm() {
  const [fullName,   setFullName]   = useState('')
  const [section,    setSection]    = useState('ESN Pisa')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState<string | null>(null)
  const [info,       setInfo]       = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, section, role: 'member' } },
    })

    if (error) {
      // Rate limit esplicito
      if (
        error.message.toLowerCase().includes('rate limit') ||
        error.message.toLowerCase().includes('email rate') ||
        error.status === 429
      ) {
        setError(
          'Troppi tentativi di registrazione. Attendi qualche minuto e riprova, oppure contatta un amministratore.'
        )
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Se la sessione è già attiva (email confirm disabilitata) → redirect diretto
    if (data.session) {
      router.push('/dashboard/member')
      return
    }

    // Se email confirm è abilitata → mostra messaggio senza bloccare
    setInfo(
      `Registrazione completata! Controlla la casella “${email}” e clicca il link di conferma per accedere.`
    )
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <Image src="/logo.svg" alt="ESN Logo" width={150} height={56} priority className="login-logo" />
          <h1 className="login-title">Registrati</h1>
          <p className="login-subtitle">Crea il tuo account ESN</p>
        </div>

        {info ? (
          <div className="alert alert-success" style={{marginTop: '1rem'}}>
            <strong>✅ Quasi fatto!</strong><br />{info}
            <div style={{marginTop:'1rem'}}>
              <Link href="/auth/login" className="btn btn-esn-cyan w-full">Vai al login</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Nome e Cognome</label>
              <input id="fullName" type="text" value={fullName}
                onChange={e => setFullName(e.target.value)}
                required className="form-control" placeholder="Mario Rossi" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="section">Sezione ESN</label>
              <input id="section" type="text" value={section}
                onChange={e => setSection(e.target.value)}
                required className="form-control" placeholder="ESN Pisa" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required className="form-control" placeholder="nome@esn.org" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6} className="form-control" />
              <p className="form-text">Minimo 6 caratteri</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full btn-lg">
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </button>
          </form>
        )}

        <p className="login-footnote">
          Hai già un account?{' '}
          <Link href="/auth/login" style={{color:'var(--esn-dark-blue)', fontWeight:600}}>Accedi</Link>
        </p>
      </div>
    </div>
  )
}
