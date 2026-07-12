'use client'

import { useState } from 'react'
import type { ExpenseCategory } from '@/lib/types'

export default function CategoriesClient({ initialCategories }: { initialCategories: ExpenseCategory[] }) {
  const [cats, setCats]       = useState<ExpenseCategory[]>(initialCategories)
  const [newName, setNewName] = useState('')
  const [newMax, setNewMax]   = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState<string | null>(null)

  const add = async () => {
    if (!newName.trim()) return
    setLoading(true); setErr(null)
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName.trim(),
        max_amount: newMax ? parseFloat(newMax) : null,
      }),
    })
    if (res.ok) {
      const cat = await res.json()
      setCats(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName(''); setNewMax('')
    } else {
      const e = await res.json()
      setErr(e.error ?? 'Errore durante il salvataggio.')
    }
    setLoading(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Eliminare questa categoria?')) return
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
    if (res.ok) setCats(prev => prev.filter(c => c.id !== id))
  }

  return (
    <>
      <h1 className="page-title">Categorie di Spesa</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Aggiungi categoria</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Nome</label>
              <input className="form-control" style={{ minWidth: 200 }} placeholder="es. Merchandising" value={newName} onChange={e => { setErr(null); setNewName(e.target.value) }} onKeyDown={e => e.key === 'Enter' && add()} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Importo max (€) <span style={{ fontWeight: 400, color: '#6c757d' }}>opzionale</span></label>
              <input className="form-control" style={{ width: 140 }} type="number" min="0" step="0.01" placeholder="es. 500" value={newMax} onChange={e => setNewMax(e.target.value)} />
            </div>
            <button className="btn btn-purple" disabled={loading || !newName.trim()} onClick={add}>
              {loading ? 'Salvataggio...' : '+ Aggiungi'}
            </button>
          </div>
          {err && <p className="text-danger" style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>{err}</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Importo massimo</th>
                <th>Creata il</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.max_amount != null ? `€${Number(c.max_amount).toFixed(2)}` : <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td style={{ color: '#6c757d', fontSize: '0.875rem' }}>{new Date(c.created_at).toLocaleDateString('it-IT')}</td>
                  <td><button className="btn btn-sm btn-outline-gray" onClick={() => remove(c.id)}>🗑</button></td>
                </tr>
              ))}
              {cats.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>Nessuna categoria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
