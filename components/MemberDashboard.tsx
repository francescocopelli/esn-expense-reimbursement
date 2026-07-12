'use client'

import { useState } from 'react'
import { Profile, ExpenseRequest } from '@/lib/types'
import ExpenseForm from '@/components/forms/ExpenseForm'
import StatusBadge from '@/components/StatusBadge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function MemberDashboard({
  profile,
  requests,
}: {
  profile: Profile
  requests: ExpenseRequest[]
}) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const totalPending = requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0)
  const totalApproved = requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-indigo-700">ESN Rimborsi</h1>
          <p className="text-sm text-gray-500">{profile.full_name} — {profile.section}</p>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 transition">
          Esci
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">In Attesa</p>
            <p className="text-2xl font-bold text-yellow-600">
              €{totalPending.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-gray-500">Approvato</p>
            <p className="text-2xl font-bold text-green-600">
              €{totalApproved.toFixed(2)}
            </p>
          </div>
        </div>

        {/* New Request */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Nuova Richiesta</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition"
            >
              {showForm ? '✕ Chiudi' : '+ Aggiungi'}
            </button>
          </div>
          {showForm && <ExpenseForm onSuccess={() => setShowForm(false)} />}
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Le Mie Richieste</h2>
          </div>
          {requests.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">Nessuna richiesta inviata.</p>
          ) : (
            <div className="divide-y">
              {requests.map(req => (
                <div key={req.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{req.event_name}</p>
                      <p className="text-sm text-gray-500">{req.category} · {new Date(req.created_at).toLocaleDateString('it-IT')}</p>
                      {req.description && <p className="text-sm text-gray-600 mt-1">{req.description}</p>}
                      {req.board_note && (
                        <p className="text-sm text-indigo-600 mt-1 italic">💬 Board: {req.board_note}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-gray-900">€{req.amount.toFixed(2)}</p>
                      <div className="mt-1">
                        <StatusBadge status={req.status} />
                      </div>
                      {req.receipt_url && (
                        <a href={req.receipt_url} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-indigo-500 hover:underline mt-1 block">
                          📎 Ricevuta
                        </a>
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
