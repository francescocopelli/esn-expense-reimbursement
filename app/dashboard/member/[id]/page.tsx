import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import EsnNavbar from '@/components/EsnNavbar'
import EsnFooter from '@/components/EsnFooter'
import LogoutButton from '@/components/LogoutButton'

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Members can only view their own requests
  const { data: req } = await supabase
    .from('expense_requests')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!req) notFound()

  const formattedDate = new Date(req.created_at).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      <EsnNavbar
        userName={profile?.full_name ?? ''}
        section={profile?.section ?? ''}
        role="member"
        onLogout={undefined}
      />

      {/* Logout is handled client-side via LogoutButton injected into navbar area */}
      <div style={{ position: 'fixed', top: '0.6rem', right: '1rem', zIndex: 1030 }}>
        <LogoutButton />
      </div>

      <main>
        <div className="container">

          {/* Back navigation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Link href="/dashboard/member" className="btn btn-outline btn-sm">
              ← Torna alle richieste
            </Link>
          </div>

          <h1 className="page-title">Dettaglio Richiesta</h1>

          <div className="card">
            <div
              className="card-header"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span className="fw-bold">{req.event_name}</span>
              <StatusBadge status={req.status} />
            </div>

            <div className="card-body">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.25rem' }}>
                <div>
                  <p className="form-label">Categoria</p>
                  <p>{req.category}</p>
                </div>
                <div>
                  <p className="form-label">Importo</p>
                  <p className="fw-bold" style={{ fontSize: '1.375rem' }}>
                    €{req.amount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="form-label">Data invio</p>
                  <p>{formattedDate}</p>
                </div>
                {req.description && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p className="form-label">Descrizione</p>
                    <p>{req.description}</p>
                  </div>
                )}
              </div>

              {/* Receipt */}
              {req.receipt_url && (
                <div style={{ marginBottom: '1rem' }}>
                  <p className="form-label">Ricevuta allegata</p>
                  <a
                    href={req.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    📎 Visualizza ricevuta
                  </a>
                </div>
              )}

              {/* Board note */}
              {req.board_note && (
                <div className="alert alert-warning">
                  <strong>💬 Nota del board:</strong>
                  <p style={{ margin: '0.25rem 0 0' }}>{req.board_note}</p>
                </div>
              )}

              {/* Rejection notice */}
              {req.status === 'rejected' && (
                <div className="alert alert-danger" style={{ marginTop: '0.75rem' }}>
                  Questa richiesta è stata <strong>rifiutata</strong>.
                  {!req.board_note && ' Nessuna nota aggiuntiva è stata fornita.'}
                </div>
              )}

              {/* Approval notice */}
              {req.status === 'approved' && (
                <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>
                  ✅ Questa richiesta è stata <strong>approvata</strong>.
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      <EsnFooter />
    </>
  )
}
