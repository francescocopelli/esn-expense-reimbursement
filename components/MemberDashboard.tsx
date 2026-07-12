'use client'

import { useState } from 'react'
import { Profile, ExpenseRequest } from '@/lib/types'
import ExpenseForm from '@/components/forms/ExpenseForm'
import StatusBadge from '@/components/StatusBadge'
import EsnNavbar from '@/components/EsnNavbar'
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
      <EsnNavbar
        userName={profile.full_name}
        section={profile.section}
        role="member"
        onLogout={handleLogout}
      />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-[#2E3192]">Ciao, {profile.full_name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Gestisci le tue richieste di rimborso</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#EF7B24]">
            <p className="text-sm text-gray-500">In Attesa</p>
            <p className="text-2xl font-bold text-[#EF7B24]">
              €{totalPending.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#7DBB48]">
            <p className="text-sm text-gray-500">Approvato</p>
            <p className="text-2xl font-bold text-[#7DBB48]">
              €{totalApproved.toFixed(2)}
            </p>
          </div>
        </div>

        {/* New Request */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold text-[#2E3192]">Nuova Richiesta</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-[#00AEEF] text-white px-4 py-1.5 rounded-lg hover:bg-[#0099d4] transition font-medium"
            >
              {showForm ? '✕ Chiudi' : '+ Aggiungi'}
            </button>
          </div>
          {showForm && (
            <div className="p-5">
              <ExpenseForm onSuccess={() => setShowForm(false)} />
            </div>
          )}
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-[#2E3192]">Le Mie Richieste</h2>
          </div>
          {requests.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-400">Nessuna richiesta inviata.</p>
              <p className="text-sm text-gray-400 mt-1">Clicca &ldquo;Aggiungi&rdquo; per iniziare.</p>
            </div>
          ) : (
            <div className="divide-y">
              {requests.map(req => (
                <div key={req.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{req.event_name}</p>
                      <p className="text-sm text-gray-500">{req.category} · {new Date(req.created_at).toLocaleDateString('it-IT')}</p>
                      {req.description && <p className="text-sm text-gray-600 mt-1">{req.description}</p>}
                      {req.board_note && (
                        <p className="text-sm text-[#2E3192] mt-1 italic">💬 Board: {req.board_note}</p>
                      )}
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-gray-900 text-lg">€{req.amount.toFixed(2)}</p>
                      <div className="mt-1">
                        <StatusBadge status={req.status} />
                      </div>
                      {req.receipt_url && (
                        <a href={req.receipt_url} target="_blank" rel="noopener noreferrer"
                           className="text-xs text-[#00AEEF] hover:underline mt-1 block">
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

      {/* Footer */}
      <footer className="mt-12 border-t py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">ESN Italy · Online Reimbursement System · <a href="https://www.esn.org" target="_blank" rel="noopener noreferrer" className="hover:text-[#00AEEF]">esn.org</a></p>
        </div>
      </footer>
    </div>
  )
}
