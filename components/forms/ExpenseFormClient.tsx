'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ExpenseCategory, Project } from '@/lib/types'

interface ItemRow {
  title: string
  category: string
  amount: string
  note: string
  file: File | null
}

const emptyItem = (): ItemRow => ({ title: '', category: '', amount: '', note: '', file: null })

interface Props {
  categories: ExpenseCategory[]
  projects: Project[]
  onSuccess?: () => void
}

export default function ExpenseFormClient({ categories, projects, onSuccess }: Props) {
  const [eventName, setEventName]       = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [items, setItems]               = useState<ItemRow[]>([emptyItem()])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const router = useRouter()

  // Resolve selected project object
  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  )

  // Derive active categories based on project selection
  const activeCategories: ExpenseCategory[] = useMemo(() => {
    if (!selectedProject) return categories
    const allowed = selectedProject.allowed_categories ?? []
    if (allowed.length === 0) return categories
    return allowed.map(ac => ({
      id: ac.id,
      name: ac.category_name,
      max_amount: ac.max_amount,
      created_at: '',
    }))
  }, [selectedProject, categories])

  // Supervisors of selected project (read-only display)
  const supervisors = useMemo(() => {
    if (!selectedProject) return []
    return (selectedProject.supervisors ?? []).map(s => s.profiles).filter(Boolean)
  }, [selectedProject])

  const updateItem = (index: number, field: keyof ItemRow, value: string | File | null) =>
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))

  const addItem    = () => setItems(prev => [...prev, emptyItem()])
  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Reset categories when project changes
  const handleProjectChange = (pid: string) => {
    setSelectedProjectId(pid)
    setItems(prev => prev.map(item => ({ ...item, category: '' })))
  }

  const totalAmount = items.reduce((sum, item) => {
    const v = parseFloat(item.amount)
    return sum + (isNaN(v) ? 0 : v)
  }, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)

    const fd = new FormData()
    fd.append('event_name', eventName)
    fd.append('item_count', String(items.length))
    if (selectedProjectId) fd.append('project_id', selectedProjectId)
    items.forEach((item, i) => {
      fd.append(`items[${i}][title]`,    item.title)
      fd.append(`items[${i}][category]`, item.category)
      fd.append(`items[${i}][amount]`,   item.amount)
      fd.append(`items[${i}][note]`,     item.note)
      if (item.file) fd.append(`items[${i}][receipt]`, item.file)
    })

    const res  = await fetch('/api/reports', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok && res.status !== 207) {
      setError(data.error || "Errore durante l'invio")
      setLoading(false)
      return
    }

    if (res.status === 207 && data.warnings?.length)
      setError('Rimborso creato con avvisi: ' + data.warnings.join('; '))

    router.refresh()
    onSuccess?.()
    setEventName('')
    setSelectedProjectId('')
    setItems([emptyItem()])
    setLoading(false)
  }

  const selectedCat = (cat: string) =>
    activeCategories.find(c => c.name === cat)

  return (
    <form onSubmit={handleSubmit}>

      {/* Project selector */}
      <div className="form-group">
        <label className="form-label" htmlFor="project_id">Progetto <span style={{ color: '#6c757d', fontWeight: 400 }}>(opzionale)</span></label>
        <select id="project_id" className="form-select"
          value={selectedProjectId}
          onChange={e => handleProjectChange(e.target.value)}>
          <option value="">— Rimborso generico (nessun progetto) —</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Supervisors read-only info box */}
      {selectedProject && supervisors.length > 0 && (
        <div style={{
          background: '#f0f4ff', border: '1px solid #c7d7ff', borderRadius: 8,
          padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem',
        }}>
          <strong style={{ color: '#3b5bdb' }}>👤 Supervisori del progetto</strong>
          <div style={{ marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {supervisors.map((s: any) => (
              <span key={s.id} style={{
                background: '#dce4ff', color: '#364fc7', borderRadius: 20,
                padding: '2px 10px', fontSize: '0.8rem',
              }}>
                {s.full_name} <span style={{ opacity: 0.7 }}>· {s.section}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optional: project budget info */}
      {selectedProject && selectedProject.budget != null && (
        <div style={{
          background: '#fff9db', border: '1px solid #ffe066', borderRadius: 8,
          padding: '0.5rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#856404',
        }}>
          💰 Budget progetto: <strong>€{Number(selectedProject.budget).toFixed(2)}</strong>
          {selectedProject.allowed_categories && selectedProject.allowed_categories.length > 0 && (
            <span style={{ marginLeft: '1rem', opacity: 0.8 }}>
              · Categorie riservate: {selectedProject.allowed_categories.map(c => c.category_name).join(', ')}
            </span>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="event_name">Nome Evento *</label>
        <input id="event_name" type="text" required className="form-control"
          placeholder="es. Erasmus Welcome Party"
          value={eventName} onChange={e => setEventName(e.target.value)} />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="form-label">Voci di Spesa *</label>

        {items.map((item, i) => {
          const cat = selectedCat(item.category)
          const maxOk = !cat?.max_amount || parseFloat(item.amount || '0') <= cat.max_amount

          return (
            <div key={i} style={{
              border: `1px solid ${!maxOk ? '#fd7e14' : '#dee2e6'}`,
              borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', background: '#f8f9fa',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#495057' }}>Voce {i + 1}</strong>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Titolo *</label>
                <input type="text" required className="form-control"
                  placeholder="es. Biglietti treno"
                  value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select required className="form-select"
                    value={item.category} onChange={e => updateItem(i, 'category', e.target.value)}>
                    <option value="">Seleziona...</option>
                    {activeCategories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}{c.max_amount != null ? ` (max €${Number(c.max_amount).toFixed(0)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Importo (€) *</label>
                  <input type="number" step="0.01" min="0.01" required className="form-control"
                    placeholder="0.00" value={item.amount}
                    onChange={e => updateItem(i, 'amount', e.target.value)} />
                  {!maxOk && (
                    <p style={{ color: '#fd7e14', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      ⚠️ Supera il limite di €{cat?.max_amount?.toFixed(2)} per questa categoria
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nota <span style={{ color: '#6c757d', fontWeight: 400 }}>(opzionale)</span></label>
                <textarea className="form-control" rows={2}
                  placeholder="es. Viaggio A/R Bologna–Milano..."
                  value={item.note} onChange={e => updateItem(i, 'note', e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Ricevuta / Scontrino</label>
                <input type="file" accept="image/*,.pdf" className="form-control"
                  onChange={e => updateItem(i, 'file', e.target.files?.[0] ?? null)} />
                <p className="form-text">Foto o PDF, max 10 MB</p>
              </div>
            </div>
          )
        })}

        <button type="button" onClick={addItem} className="btn"
          style={{ border: '1px dashed #6c757d', background: 'transparent', color: '#6c757d', width: '100%' }}>
          + Aggiungi voce
        </button>
      </div>

      <div style={{
        background: '#e8f4fd', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600,
      }}>
        <span>Totale rimborso</span>
        <span style={{ fontSize: '1.1rem', color: '#0d6efd' }}>€{totalAmount.toFixed(2)}</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <button type="submit" disabled={loading} className="btn btn-esn-cyan w-full">
        {loading ? 'Invio in corso...' : '📤 Invia Rimborso'}
      </button>
    </form>
  )
}
