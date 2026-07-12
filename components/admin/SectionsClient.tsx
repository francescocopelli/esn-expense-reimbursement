'use client'

import { useState } from 'react'
import type { EsnSection } from '@/lib/types'

export default function SectionsClient({ initialSections }: { initialSections: EsnSection[] }) {
  const [sections, setSections]   = useState<EsnSection[]>(initialSections)
  const [newName, setNewName]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState<string | null>(null)
  const [editId, setEditId]       = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const add = async () => {
    if (!newName.trim()) return
    setLoading(true); setErr(null)
    const res = await fetch('/api/admin/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      const section = await res.json()
      setSections(prev => [...prev, section].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
    } else {
      const e = await res.json()
      setErr(e.error ?? 'Errore durante il salvataggio.')
    }
    setLoading(false)
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    setEditSaving(true)
    const res = await fetch('/api/admin/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setSections(prev =>
        prev.map(s => s.id === id ? updated : s).sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditId(null)
    }
    setEditSaving(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Eliminare questa sezione? Gli utenti che la usano non verranno modificati.')) return
    const res = await fetch(`/api/admin/sections?id=${id}`, { method: 'DELETE' })
    if (res.ok) setSections(prev => prev.filter(s => s.id !== id))
  }

  return (
    <>
      <h1 className="page-title">Sezioni ESN</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Aggiungi sezione</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              className="form-control" style={{ maxWidth: 320 }}
              placeholder="Nome sezione (es. ESN Venezia)"
              value={newName}
              onChange={e => { setErr(null); setNewName(e.target.value) }}
              onKeyDown={e => e.key === 'Enter' && add()}
            />
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
            <thead><tr><th>Nome sezione</th><th>Creata il</th><th style={{ width: 120 }}></th></tr></thead>
            <tbody>
              {sections.map(s => (
                <tr key={s.id}>
                  <td>
                    {editId === s.id ? (
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          autoFocus
                          className="form-control"
                          style={{ maxWidth: 260, padding: '0.2rem 0.4rem', fontSize: '0.875rem' }}
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(s.id)}
                        />
                        <button className="btn btn-sm btn-esn-cyan" disabled={editSaving} onClick={() => saveEdit(s.id)}>
                          {editSaving ? '...' : '✓'}
                        </button>
                        <button className="btn btn-sm btn-outline-gray" onClick={() => setEditId(null)}>✕</button>
                      </div>
                    ) : (
                      <span
                        style={{ cursor: 'pointer', borderBottom: '1px dashed #aaa' }}
                        title="Clicca per rinominare"
                        onClick={() => { setEditId(s.id); setEditName(s.name) }}
                      >
                        <strong>{s.name}</strong>
                      </span>
                    )}
                  </td>
                  <td style={{ color: '#6c757d', fontSize: '0.875rem' }}>{new Date(s.created_at).toLocaleDateString('it-IT')}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-gray" onClick={() => remove(s.id)}>🗑</button>
                  </td>
                </tr>
              ))}
              {sections.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>Nessuna sezione.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
