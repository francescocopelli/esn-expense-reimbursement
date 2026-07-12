'use client'

import { useState } from 'react'
import type { Profile } from '@/lib/types'

export default function UsersClient({ initialUsers }: { initialUsers: Profile[] }) {
  const [users, setUsers]     = useState<Profile[]>(initialUsers)
  const [search, setSearch]   = useState('')
  const [saving, setSaving]   = useState<string | null>(null)
  const [toast, setToast]     = useState<{ id: string; ok: boolean } | null>(null)

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.section.toLowerCase().includes(search.toLowerCase())
  )

  const showToast = (id: string, ok: boolean) => {
    setToast({ id, ok })
    setTimeout(() => setToast(null), 2500)
  }

  const changeRole = async (id: string, role: string) => {
    setSaving(id)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role }),
    })
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: role as Profile['role'] } : u))
      showToast(id, true)
    } else {
      showToast(id, false)
    }
    setSaving(null)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Utenti</h1>
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="Cerca per nome o sezione..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th><th>Sezione</th><th>Ruolo</th><th>Registrato il</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{u.section}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        className="form-select"
                        style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.875rem' }}
                        value={u.role}
                        disabled={saving === u.id}
                        onChange={e => changeRole(u.id, e.target.value)}
                      >
                        <option value="member">Membro</option>
                        <option value="board">Board</option>
                        <option value="admin">Admin</option>
                      </select>
                      {saving === u.id && (
                        <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Salvataggio...</span>
                      )}
                      {toast?.id === u.id && (
                        <span style={{ fontSize: '0.75rem', color: toast.ok ? '#198754' : '#dc3545', fontWeight: 600 }}>
                          {toast.ok ? '✓ Salvato' : '✗ Errore'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: '#6c757d', fontSize: '0.875rem' }}>
                    {new Date(u.created_at).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>Nessun utente trovato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
