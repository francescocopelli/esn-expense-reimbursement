'use client'

import { useState } from 'react'
import { Profile, ExpenseRequest, Status, STATUS_LABELS } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type RequestWithProfile = ExpenseRequest & { profiles: Pick<Profile, 'full_name' | 'section'> }

export default function BoardDashboard({
  profile,
  requests: initialRequests,
}: {
  profile: Profile
  requests: RequestWithProfile[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all')
  const [filterEvent, setFilterEvent] = useState('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, board_note: note }),
    })
    if (res.ok) {
      const updated = await res.json()
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
      setReviewingId(null)
      setNote('')
    }
  }

  const filtered = requests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterEvent && !r.event_name.toLowerCase().includes(filterEvent.toLowerCase())) return false
    return true
  })

  // Aggregated stats
  const totalByCategory = requests.reduce((acc, r) => {
    if (r.status === 'approved') {
      acc[r.category] = (acc[r.category] || 0) + r.amount
    }
    return acc
  }, {} as Record<string, number>)

  const totalApproved = Object.values(totalByCategory).reduce((s, v) => s + v, 0)
  const totalPending = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-indigo-700">ESN Rimborsi — Board</h1>
          <p className="text-sm text-gray-500">{profile.full_name} · {profile.section}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition">Esci</button>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Totale Approvato</p>
            <p className="text-2xl font-bold text-green-600">€{totalApproved.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">In Attesa</p>
            <p className="text-2xl font-bold text-yellow-600">€{totalPending.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Richieste Totali</p>
            <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">In Attesa (#)</p>
            <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(totalByCategory).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold mb-3">Spesa Approvata per Categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(totalByCategory).map(([cat, total]) => (
                <div key={cat} className="bg-indigo-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-indigo-600 font-medium">{cat}</p>
                  <p className="text-lg font-bold text-indigo-800">€{total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | 'all')}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">Tutti gli stati</option>
            {(['pending', 'approved', 'rejected'] as Status[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <input
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            placeholder="Filtra per evento..."
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-gray-500 self-center">{filtered.length} risultati</span>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">Nessuna richiesta trovata.</p>
          ) : (
            <div className="divide-y">
              {filtered.map(req => (
                <div key={req.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{req.event_name}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {req.profiles?.full_name} · {req.profiles?.section} · {req.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(req.created_at).toLocaleDateString('it-IT')}
                      </p>
                      {req.description && <p className="text-sm text-gray-600 mt-1">{req.description}</p>}
                      {req.board_note && <p className="text-sm text-indigo-600 italic mt-1">💬 {req.board_note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold">€{req.amount.toFixed(2)}</p>
                      {req.receipt_url && (
                        <a href={req.receipt_url} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-indigo-500 hover:underline block mt-1">📎 Ricevuta</a>
                      )}
                      {req.status === 'pending' && (
                        <div className="mt-2 space-y-1">
                          {reviewingId === req.id ? (
                            <>
                              <textarea
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                rows={2}
                                placeholder="Nota opzionale..."
                                className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReview(req.id, 'approved')}
                                  className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700 transition"
                                >
                                  ✅ Approva
                                </button>
                                <button
                                  onClick={() => handleReview(req.id, 'rejected')}
                                  className="flex-1 text-xs bg-red-600 text-white py-1 rounded hover:bg-red-700 transition"
                                >
                                  ❌ Rifiuta
                                </button>
                              </div>
                              <button
                                onClick={() => { setReviewingId(null); setNote('') }}
                                className="w-full text-xs text-gray-400 hover:text-gray-600"
                              >
                                Annulla
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setReviewingId(req.id)}
                              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition"
                            >
                              Rivedi
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
