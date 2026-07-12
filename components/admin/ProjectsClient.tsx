'use client'

import { useState } from 'react'
import type { Project, Profile, ExpenseCategory } from '@/lib/types'

interface CatRow { category_name: string; max_amount: string }

const emptyCat = (): CatRow => ({ category_name: '', max_amount: '' })

interface Props {
  initialProjects: Project[]
  allUsers: Pick<Profile, 'id' | 'full_name' | 'section' | 'role'>[]
  globalCategories: ExpenseCategory[]
}

export default function ProjectsClient({ initialProjects, allUsers, globalCategories }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<Project | null>(null)

  // Form state
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [budget, setBudget]           = useState('')
  const [supervisorIds, setSupervisorIds] = useState<string[]>([])
  const [cats, setCats]               = useState<CatRow[]>([emptyCat()])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const openNew = () => {
    setEditing(null)
    setName(''); setDescription(''); setBudget('')
    setSupervisorIds([]); setCats([emptyCat()])
    setError(null); setShowForm(true)
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    setName(p.name)
    setDescription(p.description ?? '')
    setBudget(p.budget != null ? String(p.budget) : '')
    setSupervisorIds((p.supervisors ?? []).map((s: any) => s.user_id))
    setCats(
      (p.allowed_categories ?? []).length > 0
        ? (p.allowed_categories ?? []).map((c: any) => ({ category_name: c.category_name, max_amount: c.max_amount != null ? String(c.max_amount) : '' }))
        : [emptyCat()]
    )
    setError(null); setShowForm(true)
  }

  const toggleSupervisor = (uid: string) =>
    setSupervisorIds(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid])

  const updateCat = (i: number, field: keyof CatRow, val: string) =>
    setCats(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  const addCat    = () => setCats(prev => [...prev, emptyCat()])
  const removeCat = (i: number) => setCats(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome obbligatorio'); return }
    setSaving(true); setError(null)

    const validCats = cats
      .filter(c => c.category_name.trim())
      .map(c => ({ category_name: c.category_name.trim(), max_amount: c.max_amount ? parseFloat(c.max_amount) : null }))

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      budget: budget ? parseFloat(budget) : null,
      supervisor_ids: supervisorIds,
      allowed_categories: validCats,
    }

    const url    = editing ? `/api/projects/${editing.id}` : '/api/projects'
    const method = editing ? 'PATCH' : 'POST'
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data   = await res.json()

    if (!res.ok) { setError(data.error || 'Errore salvataggio'); setSaving(false); return }

    // Refresh list
    const listRes  = await fetch('/api/projects')
    const listData = await listRes.json()
    setProjects(listData)
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (p: Project) => {
    if (!confirm(`Eliminare il progetto "${p.name}"? I rimborsi associati rimarranno ma perderanno il riferimento al progetto.`)) return
    await fetch(`/api/projects/${p.id}`, { method: 'DELETE' })
    setProjects(prev => prev.filter(x => x.id !== p.id))
  }

  const handleToggleActive = async (p: Project) => {
    const res = await fetch(`/api/projects/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    if (res.ok) setProjects(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Progetti</h1>
        {!showForm && (
          <button className="btn btn-esn-cyan" onClick={openNew}>+ Nuovo Progetto</button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0 }}>{editing ? `Modifica: ${editing.name}` : 'Nuovo Progetto'}</h3>
          </div>
          <div className="card-body">

            {/* Base fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="es. Progetto Orientamento" />
              </div>
              <div className="form-group">
                <label className="form-label">Budget (€)</label>
                <input type="number" step="0.01" min="0" className="form-control" value={budget} onChange={e => setBudget(e.target.value)} placeholder="es. 500.00" />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Descrizione</label>
              <textarea className="form-control" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrizione del progetto..." />
            </div>

            {/* Supervisors */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Supervisori (uno o più utenti)</label>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: 6, padding: '0.5rem' }}>
                {allUsers.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.5rem', cursor: 'pointer', borderRadius: 4, background: supervisorIds.includes(u.id) ? '#e8f4fd' : 'transparent' }}>
                    <input type="checkbox" checked={supervisorIds.includes(u.id)} onChange={() => toggleSupervisor(u.id)} />
                    <span>{u.full_name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>{u.section} · {u.role}</span>
                  </label>
                ))}
              </div>
              {supervisorIds.length === 0 && <p style={{ color: '#fd7e14', fontSize: '0.8rem', marginTop: '0.25rem' }}>⚠️ Seleziona almeno un supervisore</p>}
            </div>

            {/* Allowed categories */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Categorie rimborsabili <span style={{ color: '#6c757d', fontWeight: 400 }}>(lascia vuoto per usare tutte le categorie globali)</span></label>
              {cats.map((c, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <select className="form-select" value={c.category_name} onChange={e => updateCat(i, 'category_name', e.target.value)}>
                    <option value="">Seleziona categoria...</option>
                    {globalCategories.map(gc => (
                      <option key={gc.id} value={gc.name}>{gc.name}{gc.max_amount != null ? ` (globale max €${Number(gc.max_amount).toFixed(0)})` : ''}</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" min="0" className="form-control" value={c.max_amount}
                    onChange={e => updateCat(i, 'max_amount', e.target.value)}
                    placeholder="Max € (opzionale)" />
                  <button type="button" onClick={() => removeCat(i)}
                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                </div>
              ))}
              <button type="button" onClick={addCat} className="btn"
                style={{ border: '1px dashed #6c757d', background: 'transparent', color: '#6c757d', fontSize: '0.85rem' }}>
                + Aggiungi categoria
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn btn-esn-cyan" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvataggio...' : editing ? '💾 Salva Modifiche' : '✅ Crea Progetto'}
              </button>
              <button className="btn" style={{ background: '#6c757d', color: '#fff', border: 'none' }}
                onClick={() => setShowForm(false)} disabled={saving}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Nome</th><th>Budget</th><th>Supervisori</th><th>Categorie</th><th>Stato</th><th style={{ textAlign: 'right' }}>Azioni</th></tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{p.description}</div>}
                  </td>
                  <td>{p.budget != null ? `€${Number(p.budget).toFixed(2)}` : <span style={{ color: '#aaa' }}>—</span>}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {(p.supervisors ?? []).length > 0
                      ? (p.supervisors ?? []).map((s: any) => s.profiles?.full_name).filter(Boolean).join(', ')
                      : <span style={{ color: '#fd7e14', fontSize: '0.8rem' }}>Nessuno ⚠️</span>}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {(p.allowed_categories ?? []).length > 0
                      ? (p.allowed_categories ?? []).map((c: any) => c.category_name).join(', ')
                      : <span style={{ color: '#6c757d' }}>Tutte (globali)</span>}
                  </td>
                  <td>
                    <span style={{
                      background: p.is_active ? '#d4edda' : '#f8d7da',
                      color: p.is_active ? '#155724' : '#721c24',
                      padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600,
                    }}>
                      {p.is_active ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#0d6efd', color: '#fff', border: 'none' }}
                        onClick={() => openEdit(p)}>✏️ Modifica</button>
                      <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: p.is_active ? '#6c757d' : '#198754', color: '#fff', border: 'none' }}
                        onClick={() => handleToggleActive(p)}>
                        {p.is_active ? '⏸ Disattiva' : '▶ Attiva'}
                      </button>
                      <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: '#dc3545', color: '#fff', border: 'none' }}
                        onClick={() => handleDelete(p)}>🗑 Elimina</button>
                    </div>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>Nessun progetto ancora. Clicca "+ Nuovo Progetto" per iniziare.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
