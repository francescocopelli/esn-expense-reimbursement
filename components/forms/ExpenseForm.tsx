'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/types'

export default function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await fetch('/api/requests', { method: 'POST', body: formData })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Errore durante l'invio")
      setLoading(false)
      return
    }

    router.refresh()
    onSuccess?.()
    ;(e.target as HTMLFormElement).reset()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label" htmlFor="event_name">Nome Evento *</label>
        <input id="event_name" name="event_name" type="text" required
          className="form-control"
          placeholder="es. Erasmus Welcome Party" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="category">Categoria *</label>
        <select id="category" name="category" required className="form-select">
          <option value="">Seleziona categoria</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="amount">Importo (€) *</label>
        <input id="amount" name="amount" type="number" step="0.01" min="0.01" required
          className="form-control"
          placeholder="0.00" />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="description">Descrizione</label>
        <textarea id="description" name="description" rows={3}
          className="form-control"
          placeholder="Dettagli sulla spesa..." />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="receipt">Ricevuta / Scontrino</label>
        <input id="receipt" name="receipt" type="file" accept="image/*,.pdf"
          className="form-control" />
        <p className="form-text">Foto o PDF, max 10 MB</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full">
        {loading ? 'Invio in corso...' : '📤 Invia Richiesta'}
      </button>
    </form>
  )
}
