import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import EsnNavbar from '@/components/EsnNavbar'
import EsnFooter from '@/components/EsnFooter'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  Sentry.addBreadcrumb({
    category: 'page',
    message: 'HomePage: getUser',
    level: 'info',
    data: { userId: user?.id ?? null, error: userError?.message ?? null },
  })

  // Logged-in users: read role and redirect to the right dashboard
  if (user) {
    Sentry.setUser({ id: user.id })

    let role = 'member'
    try {
      const admin = createAdminClient()
      const { data: profile, error: profileError } = await admin
        .from('profiles').select('role').eq('id', user.id).single()

      Sentry.addBreadcrumb({
        category: 'page',
        message: 'HomePage: profile fetch for redirect',
        level: 'info',
        data: { userId: user.id, role: profile?.role ?? null, error: profileError?.message ?? null },
      })

      role = profile?.role ?? 'member'
    } catch (err: any) {
      Sentry.captureException(err, { tags: { context: 'homepage', event: 'admin_client_error' } })
    }

    if (role === 'admin') redirect('/dashboard/admin')
    if (role === 'board') redirect('/dashboard/review_reimbursement')
    redirect('/dashboard/my_reimbursement')
  }

  // Unauthenticated users: show public homepage
  Sentry.addBreadcrumb({
    category: 'page',
    message: 'HomePage: rendering public homepage (unauthenticated)',
    level: 'info',
  })

  return (
    <>
      <EsnNavbar />
      <main style={{ padding: 0 }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="home-hero">
          <div className="container">
            <div className="home-hero-inner">
              <div className="home-hero-text">
                <p className="home-hero-eyebrow">Erasmus Student Network</p>
                <h1 className="home-hero-title">
                  Rimborsi spese<br />
                  <span className="home-hero-accent">semplici e trasparenti</span>
                </h1>
                <p className="home-hero-sub">
                  La piattaforma ufficiale ESN per la gestione e il rimborso
                  delle spese dei membri. Carica le ricevute, segui lo stato
                  delle richieste e ricevi il rimborso in pochi click.
                </p>
                <div className="home-hero-cta">
                  <Link href="/auth/login" className="btn btn-esn-cyan btn-lg">Accedi</Link>
                  <Link href="/auth/register" className="btn btn-outline btn-lg">Registrati</Link>
                </div>
              </div>
              <div className="home-hero-visual" aria-hidden>
                <div className="home-hero-card">
                  <div className="home-hero-card-row">
                    <span className="home-hero-dot" style={{ background: 'var(--esn-cyan)' }} />
                    <span className="home-hero-card-label">Rimborso approvato</span>
                    <span className="home-hero-card-amount esn-green">+€ 124,50</span>
                  </div>
                  <div className="home-hero-card-row">
                    <span className="home-hero-dot" style={{ background: 'var(--esn-orange)' }} />
                    <span className="home-hero-card-label">In revisione</span>
                    <span className="home-hero-card-amount" style={{ color: 'var(--esn-orange)' }}>€ 78,00</span>
                  </div>
                  <div className="home-hero-card-row">
                    <span className="home-hero-dot" style={{ background: 'var(--esn-pink)' }} />
                    <span className="home-hero-card-label">Nuovo rimborso</span>
                    <span className="home-hero-card-amount" style={{ color: 'var(--esn-pink)' }}>€ 210,00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section className="home-features">
          <div className="container">
            <h2 className="home-section-title">Come funziona</h2>
            <div className="home-features-grid">
              <div className="home-feature-card">
                <div className="home-feature-icon" style={{ background: 'rgba(0,174,239,0.1)', color: 'var(--esn-cyan)' }}>📄</div>
                <h3 className="home-feature-title">Invia la richiesta</h3>
                <p className="home-feature-desc">Compila il modulo di rimborso, allega le ricevute in PDF o immagine e invia tutto in pochi secondi.</p>
              </div>
              <div className="home-feature-card">
                <div className="home-feature-icon" style={{ background: 'rgba(122,193,67,0.1)', color: 'var(--esn-green)' }}>🔍</div>
                <h3 className="home-feature-title">Revisione board</h3>
                <p className="home-feature-desc">Il board ESN esamina la richiesta, può approvare o richiedere integrazioni direttamente dalla piattaforma.</p>
              </div>
              <div className="home-feature-card">
                <div className="home-feature-icon" style={{ background: 'rgba(237,0,140,0.1)', color: 'var(--esn-pink)' }}>💸</div>
                <h3 className="home-feature-title">Ricevi il rimborso</h3>
                <p className="home-feature-desc">Una volta approvata, la richiesta viene elaborata e l'importo accreditato secondo le procedure ESN.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA FINALE ───────────────────────────────────────── */}
        <section className="home-cta-section">
          <div className="container">
            <div className="home-cta-box">
              <h2 className="home-cta-title">Sei già membro ESN?</h2>
              <p className="home-cta-sub">Accedi con le tue credenziali e inizia a gestire le tue spese in modo semplice.</p>
              <Link href="/auth/login" className="btn btn-esn-cyan btn-lg">Accedi alla piattaforma</Link>
            </div>
          </div>
        </section>

      </main>
      <EsnFooter />
    </>
  )
}
