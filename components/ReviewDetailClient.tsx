'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExpenseReport, ExpenseItem } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'

interface Props {
  report: ExpenseReport
  submitter: { full_name: string; section: string }
  reviewerName: string
}

export default function ReviewDetailClient({ report, submitter }: Props) {
  const items = report.items ?? []

  // per-item board notes keyed by item id
  const [itemNotes, setItemNotes] = useState<Record<string, string>>(
    Object.fromEntries(items.map(item => [item.id, item.board_note ?? '']))
  )
  const [globalNote, setGlobalNote] = useState(report.board_note ?? '')
  const [loading, setLoading]       = useState(false)
  const router = useRouter()

  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0)
  const isPending   = report.status === 'pending'

  const handleReview = async (status: 'approved' | 'rejected') => {
    setLoading(true)

    const item_notes = items.map(item => ({
      id: item.id,
      board_note: itemNotes[item.id]?.trim() || null,
    }))

    await fetch(`/api/reports/${report.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, board_note: globalNote.trim() || null, item_notes }),
    })

    setLoading(false)
    router.push('/dashboard/review')
  }

  return (
    <>
      {/* Report header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0 }}>{report.event_name}</h2>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              <code style={{ background: '#e9ecef', padding: '2px 6px', borderRadius: 4 }}>{report.report_number}</code>
              {' · '}{submitter.full_name} · {submitter.section}
              {' · '}{new Date(report.created_at).toLocaleDateString('it-IT')}
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>
      </div>

      {/* Items table */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 style={{ margin: 0 }}>Voci di Spesa</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>#</th>
                <th>Titolo</th>
                <th>Categoria</th>
                <th>Nota membro</th>
                <th style={{ textAlign: 'right' }}>Importo</th>
                <th style={{ textAlign: 'center' }}>Ricevuta</th>
                {isPending && <th style={{ minWidth: 200 }}>Nota revisore</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item: ExpenseItem, idx: number) => (
                <tr key={item.id}>
                  <td style={{ color: '#6c757d', fontSize: '0.85rem' }}>{idx + 1}</td>
                  <td><strong>{item.title}</strong></td>
                  <td>
                    <span style={{ background: '#e9ecef', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ color: '#495057', fontSize: '0.875rem', maxWidth: 180 }}>
                    {item.note || <span style={{ color: '#aaa' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>€{Number(item.amount).toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {item.receipt_url
                      ? <a href={item.receipt_url} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#0d6efd', textDecoration: 'none' }}>📎 Apri</a>
                      : <span style={{ color: '#aaa' }}>—</span>}
                  </td>
                  {isPending && (
                    <td>
                      <textarea
                        className="form-control"
                        rows={2}
                        style={{ fontSize: '0.8rem', minWidth: 180 }}
                        placeholder="Nota su questa voce..."
                        value={itemNotes[item.id] ?? ''}
                        onChange={e => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      />
                    </td>
                  )}
                  {!isPending && (
                    <td style={{ fontSize: '0.875rem', color: '#495057' }}>
                      {item.board_note || <span style={{ color: '#aaa' }}>—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8f9fa', fontWeight: 700 }}>
                <td colSpan={isPending ? 6 : 5} style={{ textAlign: 'right', padding: '0.75rem 1rem' }}>Totale</td>
                <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '1.05rem', color: '#0d6efd' }}>
                  €{totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Review form */}
      {isPending ? (
        <div className="card">
          <div className="card-header"><h3 style={{ margin: 0 }}>Decisione</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">
                Nota globale per il membro{' '}
                <span style={{ color: '#6c757d', fontWeight: 400 }}>(opzionale)</span>
              </label>
              <textarea className="form-control" rows={3}
                placeholder="Nota generale sul rimborso..."
                value={globalNote}
                onChange={e => setGlobalNote(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-esn-cyan" disabled={loading}
                onClick={() => handleReview('approved')}>
                ✅ Approva
              </button>
              <button className="btn" disabled={loading}
                style={{ background: '#dc3545', color: '#fff', border: 'none' }}
                onClick={() => handleReview('rejected')}>
                ❌ Rifiuta
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            {report.board_note && (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                <strong>Nota board:</strong> {report.board_note}
              </div>
            )}
            <p style={{ color: '#6c757d', margin: 0, fontSize: '0.9rem' }}>
              Questo rimborso è già stato revisionato.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
