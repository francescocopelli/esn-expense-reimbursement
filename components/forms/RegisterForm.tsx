'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterForm() {
  const [fullName, setFullName] = useState('')
  const [section, setSection] = useState('ESN Pisa')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, section, role: 'member' } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard/member')
    }
  }

  return (
    <form onSubmit={handleRegister} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
      <div className="flex flex-col items-center mb-2">
        <Image src="/logo.svg" alt="ESN Logo" width={150} height={56} priority />
        <p className="text-xs text-gray-400 mt-2">Crea il tuo account</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome</label>
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
          placeholder="Mario Rossi" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sezione ESN</label>
        <input type="text" value={section} onChange={e => setSection(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
          placeholder="ESN Pisa" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
          placeholder="nome@esn.org" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]" />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-[#00AEEF] text-white py-2 rounded-lg font-medium hover:bg-[#0099d4] disabled:opacity-50 transition">
        {loading ? 'Registrazione...' : 'Registrati'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Hai già un account?{' '}
        <Link href="/auth/login" className="text-[#2E3192] hover:underline font-medium">Accedi</Link>
      </p>
    </form>
  )
}
