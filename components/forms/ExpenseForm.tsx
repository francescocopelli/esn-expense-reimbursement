'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/types'

interface ItemRow {
  title: string
  category: string
  amount: string
  file: File | null
}

const emptyItem = (): ItemRow => ({ title: '', category: '', amount: '', file: null })

export default function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const [eventName, setEventName] = useState('')
  const [items, setItems]         = useState<ItemRow[]>([emptyItem()])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const router = useRouter()

  const updateItem = (index: number, field: keyof ItemRow, value: string | File | null) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const addItem = () => setItems(prev => [...prev, emptyItem()])

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const totalAmount = items.reduce((sum, item) => {
    const v = parseFloat(item.amount)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('event_name', eventName)
    formData.append('item_count', String(items.length))

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      formData.append(`items[${i}][title]`,    item.title)
      formData.append(`items[${i}][category]`, item.category)
      formData.append(`items[${i}][amount]`,   item.amount)
      if (item.file) formData.append(`items[${i}][receipt]`, item.file)
    }

    const res = await fetch('/api/reports', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok && res.status !== 207) {
      setError(data.error || "Errore durante l'invio")
      setLoading(false)
      return
    }

    if (res.status === 207 && data.warnings?.length) {
      setError('Rimborso creato con avvisi: ' + data.warnings.join('; '))
    }

    router.refresh()
    onSuccess?.()
    setEventName('')
    setItems([emptyItem()])
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Nome Evento */}
      <div className="form-group">
        <label className="form-label" htmlFor="event_name">Nome Evento *</label>
        <input
          id="event_name" type="text" required
          className="form-control"
          placeholder="es. Erasmus Welcome Party"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
        />
      </div>

      {/* Voci di Spesa */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Voci di Spesa *</label>

        {items.map((item, i) => (
          <div key={i} style={{
            border: '1px solid #dee2e6',
            borderRadius: 8,
            padding: '1rem',
            marginBottom: '0.75rem',
            background: '#f8f9fa',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '0.9rem', color: '#495057' }}>Voce {i + 1}</strong>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem' }}
                  title="Rimuovi voce"
                >✕</button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Titolo *</label>
              <input
                type="text" required className="form-control"
                placeholder="es. Biglietti treno"
                value={item.title}
                onChange={e => updateItem(i, 'title', e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Categoria *</label>
                <select
                  required className="form-select"
                  value={item.category}
                  onChange={e => updateItem(i, 'category', e.target.value)}
                >
                  <option value="">Seleziona...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Importo (€) *</label>
                <input
                  type="number" step="0.01" min="0.01" required className="form-control"
                  placeholder="0.00"
                  value={item.amount}
                  onChange={e => updateItem(i, 'amount', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ricevuta / Scontrino</label>
              <input
                type="file" accept="image/*,.pdf" className="form-control"
                onChange={e => updateItem(i, 'file', e.target.files?.[0] ?? null)}
              />
              <p className="form-text">Foto o PDF, max 10 MB</p>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="btn"
          style={{ border: '1px dashed #6c757d', background: 'transparent', color: '#6c757d', width: '100%' }}
        >
          + Aggiungi voce
        </button>
      </div>

      {/* Totale */}
      <div style={{
        background: '#e8f4fd',
        borderRadius: 8,
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 600,
      }}>
        <span>Totale rimborso</span>
        <span style={{ fontSize: '1.1rem', color: '#0d6efd' }}>
          €{totalAmount.toFixed(2)}
        </span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full">
        {loading ? 'Invio in corso...' : '📤 Invia Rimborso'}
      </button>
    </form>
  )
}
