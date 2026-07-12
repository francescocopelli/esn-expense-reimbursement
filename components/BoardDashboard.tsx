'use client'

import { useState } from 'react'
import { Profile, ExpenseRequest, Status, STATUS_LABELS } from '@/lib/types'
import StatusBadge from '@/components/StatusBadge'
import EsnNavbar from '@/components/EsnNavbar'
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

  const totalByCategory = requests.reduce((acc, r) => {
    if (r.status === 'approved') acc[r.category] = (acc[r.category] || 0) + r.amount
    return acc
  }, {} as Record<string, number>)

  const totalApproved = Object.values(totalByCategory).reduce((s, v) => s + v, 0)
  const totalPending = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <EsnNavbar
        userName={profile.full_name}
        section={profile.section}
        role="board"
        onLogout={handleLogout}
      />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2E3192]">Dashboard Board</h1>
          <p className="text-gray-500 text-sm mt-1">Vista centralizzata di tutte le richieste di rimborso</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#7DBB48]">
            <p className="text-sm text-gray-500">Totale Approvato</p>
            <p className="text-2xl font-bold text-[#7DBB48]">€{totalApproved.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#EF7B24]">
            <p className="text-sm text-gray-500">In Attesa</p>
            <p className="text-2xl font-bold text-[#EF7B24]">€{totalPending.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#2E3192]">
            <p className="text-sm text-gray-500">Richieste Totali</p>
            <p className="text-2xl font-bold text-[#2E3192]">{requests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#E32185]">
            <p className="text-sm text-gray-500">In Attesa (#)</p>
            <p className="text-2xl font-bold text-[#E32185]">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(totalByCategory).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-base font-semibold text-[#2E3192] mb-3">Spesa Approvata per Categoria</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(totalByCategory).map(([cat, total]) => (
                <div key={cat} className="bg-[#00AEEF]/10 rounded-lg p-3 text-center border border-[#00AEEF]/20">
                  <p className="text-xs text-[#2E3192] font-semibold">{cat}</p>
                  <p className="text-lg font-bold text-[#00AEEF]">€{total.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Status | 'all')}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
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
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
          />
          <span className="text-sm text-gray-400">{filtered.length} risultati</span>
        </div>

        {/* Requests */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-400">Nessuna richiesta trovata.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(req => (
                <div key={req.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{req.event_name}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {req.profiles?.full_name} · {req.profiles?.section} · {req.category}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(req.created_at).toLocaleDateString('it-IT')}
                      </p>
                      {req.description && <p className="text-sm text-gray-600 mt-1">{req.description}</p>}
                      {req.board_note && <p className="text-sm text-[#2E3192] italic mt-1">💬 {req.board_note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-gray-900">€{req.amount.toFixed(2)}</p>
                      {req.receipt_url && (
                        <a href={req.receipt_url} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-[#00AEEF] hover:underline block mt-1">📎 Ricevuta</a>
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
                                className="w-full text-sm border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#00AEEF]"
                              />
                              <div className="flex gap-2">
                                <button onClick={() => handleReview(req.id, 'approved')}
                                  className="flex-1 text-xs bg-[#7DBB48] text-white py-1 rounded hover:bg-green-600 transition">
                                  ✅ Approva
                                </button>
                                <button onClick={() => handleReview(req.id, 'rejected')}
                                  className="flex-1 text-xs bg-[#E32185] text-white py-1 rounded hover:bg-pink-700 transition">
                                  ❌ Rifiuta
                                </button>
                              </div>
                              <button onClick={() => { setReviewingId(null); setNote('') }}
                                className="w-full text-xs text-gray-400 hover:text-gray-600">Annulla</button>
                            </>
                          ) : (
                            <button onClick={() => setReviewingId(req.id)}
                              className="text-xs bg-[#00AEEF] text-white px-3 py-1 rounded hover:bg-[#0099d4] transition">
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

      <footer className="mt-12 border-t py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">ESN Italy · Online Reimbursement System · <a href="https://www.esn.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#00AEEF]">esn.org</a></p>
        </div>
      </footer>
    </div>
  )
}
