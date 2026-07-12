'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Profile, ExpenseRequest, Status, STATUS_LABELS } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import EsnNavbar from '@/components/EsnNavbar'
import EsnFooter from '@/components/EsnFooter'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type RequestWithProfile = ExpenseRequest & { profiles: Pick<Profile, 'full_name' | 'section'> }

const IS_DEV = process.env.NODE_ENV === 'development'

export default function BoardDashboard({
  profile,
  requests: initialRequests,
}: {
  profile: Profile
  requests: RequestWithProfile[]
}) {
  const [requests,     setRequests]     = useState(initialRequests)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterEvent,  setFilterEvent]  = useState('')
  const [reviewingId,  setReviewingId]  = useState<string | null>(null)
  const [note,         setNote]         = useState('')
  const [debugApiRes,  setDebugApiRes]  = useState<object | null>(null)
  const router   = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, board_note: note }),
    })
    const json = await res.json()
    if (IS_DEV) setDebugApiRes({ status: res.status, ok: res.ok, body: json })
    if (res.ok) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...json } : r))
      setReviewingId(null)
      setNote('')
    }
  }

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterEvent && !r.event_name.toLowerCase().includes(filterEvent.toLowerCase())) return false
    return true
  })

  const totalByCategory = requests.reduce((acc, r) => {
    if (r.status === 'approved') acc[r.category] = (acc[r.category] || 0) + r.amount
    return acc
  }, {} as Record<string, number>)

  const totalApproved = Object.values(totalByCategory).reduce((s, v) => s + v, 0)
  const totalPending  = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  // Debug stats (computed only in dev)
  const nullProfileCount = IS_DEV
    ? requests.filter(r => !r.profiles || !r.profiles.full_name).length
    : 0

  return (
    <>
      <EsnNavbar
        userName={profile.full_name}
        section={profile.section}
        role="board"
        onLogout={handleLogout}
      />

      <main>
        <div className="container">

          <div className="mb-4">
            <h1 className="page-title">Dashboard Board</h1>
            <p className="text-muted text-sm">Vista centralizzata di tutte le richieste di rimborso</p>
          </div>

          {/* ── DEV DEBUG PANEL ─────────────────────────────────────── */}
          {IS_DEV && (
            <details
              style={{
                marginBottom: '1rem',
                background: '#1e1e2e',
                color: '#cdd6f4',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                fontFamily: 'monospace',
                border: '1px solid #45475a',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#a6e3a1' }}>
                🛠 DEV — Debug Panel (clicca per espandere)
              </summary>

              <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.4rem' }}>

                {/* Counters */}
                <div>
                  <span style={{ color: '#89b4fa' }}>requests ricevute:</span>{' '}
                  <strong>{requests.length}</strong>
                  {requests.length === 0 && (
                    <span style={{ color: '#f38ba8' }}>
                      {' '}← ZERO richieste! Controlla la RLS su expense_requests per il ruolo board.
                    </span>
                  )}
                </div>

                <div>
                  <span style={{ color: '#89b4fa' }}>profiles null/mancanti:</span>{' '}
                  <strong style={{ color: nullProfileCount > 0 ? '#f38ba8' : '#a6e3a1' }}>
                    {nullProfileCount}
                  </strong>
                  {nullProfileCount > 0 && (
                    <span style={{ color: '#f38ba8' }}>
                      {' '}← RLS profiles blocca ancora il join. Esegui migration 006.
                    </span>
                  )}
                </div>

                <div>
                  <span style={{ color: '#89b4fa' }}>filtered (con filtri attivi):</span>{' '}
                  <strong>{filtered.length}</strong>
                </div>

                {/* Last PATCH API response */}
                {debugApiRes && (
                  <div>
                    <span style={{ color: '#89b4fa' }}>ultimo PATCH /api/requests/[id]:</span>
                    <pre style={{
                      background: '#181825',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      marginTop: '0.25rem',
                      overflowX: 'auto',
                      color: (debugApiRes as { ok?: boolean }).ok ? '#a6e3a1' : '#f38ba8',
                    }}>
                      {JSON.stringify(debugApiRes, null, 2)}
                    </pre>
                  </div>
                )}

                {/* First 3 raw requests */}
                {requests.length > 0 && (
                  <div>
                    <span style={{ color: '#89b4fa' }}>prime 3 richieste (raw):</span>
                    <pre style={{
                      background: '#181825',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      marginTop: '0.25rem',
                      overflowX: 'auto',
                      maxHeight: '220px',
                    }}>
                      {JSON.stringify(requests.slice(0, 3), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Quick hints */}
                <div style={{ marginTop: '0.5rem', color: '#6c7086', fontSize: '0.75rem' }}>
                  💡 Se requests=0 → la RLS <code>requests_select_board</code> non è attiva o
                  <code> is_board_member()</code> non ha EXECUTE grant. Esegui migration 006.<br />
                  💡 Se profiles=null → la RLS <code>profiles_select_board</code> blocca il join.
                  Il fix è già nel fetch a 2 step di board/page.tsx.
                </div>
              </div>
            </details>
          )}
          {/* ── END DEV DEBUG PANEL ─────────────────────────────────── */}

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="stat-card">
              <span className="stat-card-label">Totale Approvato</span>
              <span className="stat-card-value esn-green">€{totalApproved.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">In Attesa</span>
              <span className="stat-card-value esn-orange">€{totalPending.toFixed(2)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Richieste Totali</span>
              <span className="stat-card-value">{requests.length}</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">In Attesa (#)</span>
              <span className="stat-card-value esn-pink">{requests.filter(r => r.status === 'pending').length}</span>
            </div>
          </div>

          {/* Category breakdown */}
          {Object.keys(totalByCategory).length > 0 && (
            <div className="card mb-4">
              <div className="card-header">Spesa Approvata per Categoria</div>
              <div className="card-body">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(totalByCategory).map(([cat, total]) => (
                    <div key={cat} className="stat-card">
                      <span className="stat-card-label">{cat}</span>
                      <span className="stat-card-value esn-cyan">€{total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-4 items-center mb-4 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as Status | 'all')}
              className="form-select"
              style={{ width: 'auto' }}
            >
              <option value="all">Tutti gli stati</option>
              {(['pending', 'approved', 'rejected'] as Status[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <input
              value={filterEvent}
              onChange={e => setFilterEvent(e.target.value)}
              placeholder="Filtra per evento..."
              className="form-control"
              style={{ width: 'auto' }}
            />
            <span className="text-muted text-sm">{filtered.length} risultati</span>
          </div>

          {/* Requests table */}
          <div className="card">
            {filtered.length === 0 ? (
              <div className="card-body text-center py-8">
                <p style={{ fontSize: '2.5rem' }}>🔍</p>
                <p className="text-muted">Nessuna richiesta trovata.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Evento</th>
                      <th>Membro</th>
                      <th>Categoria</th>
                      <th>Data</th>
                      <th>Importo</th>
                      <th>Stato</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(req => (
                      <tr
                        key={req.id}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                      >
                        <td>
                          <Link
                            href={`/dashboard/member/${req.id}`}
                            style={{
                              color: 'var(--esn-dark-blue)',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => ((e.target as HTMLElement).style.textDecoration = 'underline')}
                            onMouseLeave={e => ((e.target as HTMLElement).style.textDecoration = 'none')}
                          >
                            {req.event_name}
                          </Link>
                          {req.description && (
                            <p className="text-sm text-muted">{req.description}</p>
                          )}
                          {req.board_note && (
                            <p className="text-sm text-muted">💬 {req.board_note}</p>
                          )}
                        </td>

                        <td>
                          <span className="fw-bold">{req.profiles?.full_name}</span>
                          <p className="text-sm text-muted">{req.profiles?.section}</p>
                        </td>

                        <td>{req.category}</td>
                        <td className="text-muted text-sm">
                          {new Date(req.created_at).toLocaleDateString('it-IT')}
                        </td>
                        <td className="fw-bold">€{req.amount.toFixed(2)}</td>
                        <td><StatusBadge status={req.status} /></td>

                        <td>
                          {req.receipt_url && (
                            <a
                              href={req.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline mb-2 w-full"
                            >
                              📎 Ricevuta
                            </a>
                          )}
                          {req.status === 'pending' && (
                            reviewingId === req.id ? (
                              <div style={{ minWidth: '160px' }}>
                                <textarea
                                  value={note}
                                  onChange={e => setNote(e.target.value)}
                                  rows={2}
                                  placeholder="Nota opzionale..."
                                  className="form-control mb-2"
                                  style={{ fontSize: '0.8125rem' }}
                                />
                                <div className="flex gap-2 mb-2">
                                  <button
                                    onClick={() => handleReview(req.id, 'approved')}
                                    className="btn btn-sm btn-success"
                                    style={{ flex: 1 }}
                                  >
                                    ✅ Approva
                                  </button>
                                  <button
                                    onClick={() => handleReview(req.id, 'rejected')}
                                    className="btn btn-sm btn-danger"
                                    style={{ flex: 1 }}
                                  >
                                    ❌ Rifiuta
                                  </button>
                                </div>
                                <button
                                  onClick={() => { setReviewingId(null); setNote('') }}
                                  className="btn btn-sm btn-outline w-full"
                                >
                                  Annulla
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReviewingId(req.id)}
                                className="btn btn-sm btn-esn-cyan"
                              >
                                👁 Rivedi
                              </button>
                            )
                          )}
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
