'use client'

import { useState } from 'react'
import { Profile, ExpenseRequest } from '@/lib/types'
import ExpenseForm from '@/components/forms/ExpenseForm'
import StatusBadge from '@/components/StatusBadge'
import EsnNavbar from '@/components/EsnNavbar'
import EsnFooter from '@/components/EsnFooter'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MemberDashboard({
  profile,
  requests,
}: {
  profile: Profile
  requests: ExpenseRequest[]
}) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const totalPending  = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const totalApproved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0)

  return (
    <>
      <EsnNavbar
        userName={profile.full_name}
        section={profile.section}
        role="member"
        onLogout={handleLogout}
      />

      <main>
        <div className="container">

          {/* Welcome */}
          <div className="mb-4">
            <h1 className="page-title">Ciao, {profile.full_name.split(' ')[0]}! 👋</h1>
            <p className="text-muted text-sm">Gestisci le tue richieste di rimborso</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="stat-card">
              <span className="stat-card-label">In Attesa</span>
              <span className="stat-card-value esn-orange">€{totalPending.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Approvato</span>
              <span className="stat-card-value esn-green">€{totalApproved.toFixed(2)}</span>
            </div>
          </div>

          {/* New Request */}
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <span>Nuova Richiesta</span>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`btn btn-sm ${showForm ? 'btn-outline' : 'btn-esn-cyan'}`}
              >
                {showForm ? '✕ Chiudi' : '+ Aggiungi'}
              </button>
            </div>
            {showForm && (
              <div className="card-body">
                <ExpenseForm onSuccess={() => setShowForm(false)} />
              </div>
            )}
          </div>

          {/* Requests List */}
          <div className="card">
            <div className="card-header">
              Le Mie Richieste
            </div>
            {requests.length === 0 ? (
              <div className="card-body text-center py-8">
                <p style={{fontSize:'2.5rem'}}>📋</p>
                <p className="text-muted">Nessuna richiesta inviata.</p>
                <p className="text-muted text-sm mt-2">Clicca &ldquo;Aggiungi&rdquo; per iniziare.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Categoria</th>
                      <th>Data</th>
                      <th>Importo</th>
                      <th>Stato</th>
                      <th>Ricevuta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id}>
                        <td>
                          <span className="fw-bold">{req.event_name}</span>
                          {req.board_note && (
                            <p className="text-sm text-muted mt-2">💬 Board: {req.board_note}</p>
                          )}
                        </td>
                        <td>{req.category}</td>
                        <td className="text-muted text-sm">{new Date(req.created_at).toLocaleDateString('it-IT')}</td>
                        <td className="fw-bold">€{req.amount.toFixed(2)}</td>
                        <td><StatusBadge status={req.status} /></td>
                        <td>
                          {req.receipt_url
                            ? <a href={req.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm">📎 Vedi</a>
                            : <span className="text-muted text-sm">—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      <EsnFooter />
    </>
  )
}
