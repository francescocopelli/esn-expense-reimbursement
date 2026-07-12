'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import type { Profile, ExpenseReport, Status } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

interface Props {
  profile: Profile
  reports: (ExpenseReport & { profiles: { full_name: string; section: string } })[]
}

type FilterStatus = Status | 'all'

export default function BoardDashboard({ profile, reports }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterMember, setFilterMember] = useState('')
  const router = useRouter()

  const totalAmount = (r: ExpenseReport) =>
    (r.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0)

  const filtered = reports.filter(r => {
    const statusOk = filterStatus === 'all' || r.status === filterStatus
    const memberOk = !filterMember ||
      r.profiles?.full_name?.toLowerCase().includes(filterMember.toLowerCase())
    return statusOk && memberOk
  })

  const pendingCount  = reports.filter(r => r.status === 'pending').length
  const approvedTotal = reports
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + totalAmount(r), 0)

  return (
    <div className="container">
      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>🗂 Revisione Rimborsi</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              {profile.full_name} · {profile.section} · {' '}
              <Link href="/dashboard/board"
                style={{ color: '#0d6efd', textDecoration: 'none', fontWeight: 500 }}>
                ← I Miei Rimborsi
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Rimborsi Totali</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Da Revisionare</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">€{approvedTotal.toFixed(2)}</div>
          <div className="stat-label">Approvati</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select className="form-select" style={{ maxWidth: 180 }}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as FilterStatus)}>
            <option value="all">Tutti gli stati</option>
            <option value="pending">In Attesa</option>
            <option value="approved">Approvati</option>
            <option value="rejected">Rifiutati</option>
          </select>
          <input type="text" className="form-control" style={{ maxWidth: 240 }}
            placeholder="Cerca membro..."
            value={filterMember}
            onChange={e => setFilterMember(e.target.value)}
          />
        </div>
      </div>

      {/* Reports table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>Nessun rimborso trovato.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>N° Rimborso</th>
                  <th>Membro</th>
                  <th>Evento</th>
                  <th>Voci</th>
                  <th>Totale</th>
                  <th>Stato</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/review/${r.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td><code style={{ fontSize: '0.8rem', background: '#e9ecef', padding: '2px 6px', borderRadius: 4 }}>{r.report_number}</code></td>
                    <td>
                      <strong>{r.profiles?.full_name ?? '—'}</strong>
                      <br /><small style={{ color: '#6c757d' }}>{r.profiles?.section ?? ''}</small>
                    </td>
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
