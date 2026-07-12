'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
      <div className="flex flex-col items-center mb-2">
        <Image src="/logo.svg" alt="ESN Logo" width={150} height={56} priority />
        <p className="text-xs text-gray-400 mt-2">Online Reimbursement System</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
          placeholder="nome@esn.org"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#00AEEF] text-white py-2 rounded-lg font-medium hover:bg-[#0099d4] disabled:opacity-50 transition"
      >
        {loading ? 'Accesso...' : 'Accedi'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Non hai un account?{' '}
        <Link href="/auth/register" className="text-[#2E3192] hover:underline font-medium">Registrati</Link>
      </p>
    </form>
  )
}
