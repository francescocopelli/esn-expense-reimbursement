'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import type { Status } from '@/lib/types'

interface AdminReport {
  id: string
  report_number: string
  event_name: string
  status: Status
  created_at: string
  updated_at: string
  board_note: string | null
  profiles: { full_name: string; section: string } | null
}

export default function AdminReportsClient({
  initialReports,
  sections,
}: {
  initialReports: AdminReport[]
  sections: string[]
}) {
  const [statusFilter, setStatusFilter]   = useState<string>('all')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [search, setSearch]               = useState('')
  const router = useRouter()

  const filtered = useMemo(() => initialReports.filter(r => {
    if (statusFilter  !== 'all' && r.status !== statusFilter) return false
    if (sectionFilter !== 'all' && r.profiles?.section !== sectionFilter) return false
    if (search && !r.event_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.profiles?.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !r.report_number.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [initialReports, statusFilter, sectionFilter, search])

  const exportCsv = () => {
    const rows = [
      ['Numero', 'Evento', 'Utente', 'Sezione', 'Stato', 'Data'],
      ...filtered.map(r => [
        r.report_number, r.event_name,
        r.profiles?.full_name ?? '',
        r.profiles?.section ?? '',
        r.status,
        new Date(r.created_at).toLocaleDateString('it-IT'),
      ]),
    ]
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'rimborsi.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Report Globale</h1>
        <button className="btn btn-purple btn-sm" onClick={exportCsv}>💾 Esporta CSV</button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input className="form-control" style={{ maxWidth: 240 }}
          placeholder="Cerca evento, utente, numero..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Tutti gli stati</option>
          <option value="pending">In Attesa</option>
          <option value="approved">Approvata</option>
          <option value="rejected">Rifiutata</option>
          <option value="needs_info">Integrare</option>
        </select>
        <select className="form-select" style={{ width: 'auto' }} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
          <option value="all">Tutte le sezioni</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Numero</th><th>Evento</th><th>Utente</th><th>Sezione</th><th>Stato</th><th>Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/dashboard/review_reimbursement/${r.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td><code style={{ fontSize: '0.8rem', background: '#e9ecef', padding: '2px 6px', borderRadius: 4 }}>{r.report_number}</code></td>
                  <td>{r.event_name}</td>
                  <td>{r.profiles?.full_name ?? <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td><span style={{ background: '#e9ecef', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{r.profiles?.section}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ color: '#6c757d', fontSize: '0.875rem' }}>{new Date(r.created_at).toLocaleDateString('it-IT')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>Nessun rimborso trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-muted text-sm">{filtered.length} rimborsi visualizzati</p>
    </>
  )
}
