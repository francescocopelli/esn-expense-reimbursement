'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExpenseItem } from '@/lib/types'

interface Props {
  reportId: string
  integrationNote: string
  items: ExpenseItem[]
}

export default function ResubmitPanel({ reportId, integrationNote, items }: Props) {
  const [files, setFiles]     = useState<Record<string, File | null>>({})
  const [notes, setNotes]     = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.id, i.note ?? '']))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    const fd = new FormData()
    fd.append('item_count', String(items.length))
    items.forEach((item, i) => {
      fd.append(`items[${i}][id]`,   item.id)
      fd.append(`items[${i}][note]`, notes[item.id] ?? '')
      const file = files[item.id]
      if (file) fd.append(`items[${i}][receipt]`, file)
    })

    const res  = await fetch(`/api/reports/${reportId}/resubmit`, { method: 'PUT', body: fd })
    const data = await res.json()

    if (!res.ok && res.status !== 207) {
      setError(data.error ?? 'Errore durante il reinvio')
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/dashboard/my_reimbursement')
  }

  return (
    <div className="card" style={{ borderColor: '#fd7e14', borderWidth: 2 }}>
      <div className="card-header" style={{ background: '#fff3e0', borderBottomColor: '#fd7e14' }}>
        <h3 style={{ margin: 0, color: '#a04000' }}>⚠️ Integrazione Richiesta</h3>
      </div>
      <div className="card-body">
        <div style={{ background: '#fff8f0', border: '1px solid #ffb74d', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <strong style={{ color: '#a04000' }}>Messaggio dal revisore:</strong>
          <p style={{ margin: '0.5rem 0 0', color: '#5a3000' }}>{integrationNote}</p>
        </div>

        <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Aggiorna le voci che richiedono documentazione aggiuntiva, poi clicca <strong>Reinvia</strong>.
          Le voci che non modifichi rimangono invariate.
        </p>

        <form onSubmit={handleSubmit}>
          {items.map((item, idx) => (
            <div key={item.id} style={{ border: '1px solid #dee2e6', borderRadius: 8, padding: '0.875rem', marginBottom: '0.75rem', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem' }}>
                  {idx + 1}. {item.title}
                  {' '}<span style={{ background: '#e9ecef', padding: '1px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 400 }}>{item.category}</span>
                  {' '}<span style={{ color: '#0d6efd', fontWeight: 700, fontSize: '0.9rem' }}>€{Number(item.amount).toFixed(2)}</span>
                </strong>
                {item.receipt_url && (
                  <a href={item.receipt_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#0d6efd' }}>📎 Ricevuta attuale</a>
                )}
              </div>

              {item.board_note && (
                <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 6, padding: '0.5rem 0.75rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#5a3000' }}>
                  <strong>Nota revisore:</strong> {item.board_note}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Aggiorna nota</label>
                <textarea className="form-control" rows={2} style={{ fontSize: '0.85rem' }}
                  value={notes[item.id] ?? ''}
                  onChange={e => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Carica nuova ricevuta</label>
                <input type="file" accept="image/*,.pdf" className="form-control"
                  onChange={e => setFiles(prev => ({ ...prev, [item.id]: e.target.files?.[0] ?? null }))} />
              </div>
            </div>
          ))}

          {error && <div className="alert alert-danger">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full" style={{ marginTop: '0.5rem' }}>
            {loading ? 'Invio in corso...' : '📤 Reinvia Rimborso'}
          </button>
        </form>
      </div>
    </div>
  )
}
