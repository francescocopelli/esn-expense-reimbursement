'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile, ExpenseReport } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import ExpenseForm from '@/components/forms/ExpenseForm'

interface Props {
  profile: Profile
  reports: ExpenseReport[]
}

export default function BoardSubmitPage({ profile, reports }: Props) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  const totalAmount = (r: ExpenseReport) =>
    (r.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0)

  const approvedTotal = reports
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + totalAmount(r), 0)

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>📋 I Miei Rimborsi</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              {profile.full_name} · {profile.section} ·{' '}
              <Link href="/dashboard/review" style={{ color: '#0d6efd', textDecoration: 'none', fontWeight: 500 }}>
                Vai alla Revisione →
              </Link>
            </p>
          </div>
          <button
            className="btn btn-esn-cyan"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? '✕ Chiudi' : '+ Nuovo Rimborso'}
          </button>
        </div>

        {showForm && (
          <div className="card-body">
            <ExpenseForm onSuccess={() => { setShowForm(false); router.refresh() }} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Rimborsi Totali</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'pending').length}</div>
          <div className="stat-label">In Attesa</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">€{approvedTotal.toFixed(2)}</div>
          <div className="stat-label">Approvati</div>
        </div>
      </div>

      {/* Reports list */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Storico Rimborsi</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {reports.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              Nessun rimborso inserito. Clicca &ldquo;+ Nuovo Rimborso&rdquo; per iniziare.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>N° Rimborso</th>
                  <th>Evento</th>
                  <th>Voci</th>
                  <th>Totale</th>
                  <th>Stato</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr
                    key={r.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/member/${r.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td><code style={{ fontSize: '0.8rem', background: '#e9ecef', padding: '2px 6px', borderRadius: 4 }}>{r.report_number}</code></td>
                    <td>{r.event_name}</td>
                    <td style={{ textAlign: 'center' }}>{(r.items ?? []).length}</td>
                    <td><strong>€{totalAmount(r).toFixed(2)}</strong></td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>{new Date(r.created_at).toLocaleDateString('it-IT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
