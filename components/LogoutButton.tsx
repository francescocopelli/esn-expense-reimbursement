'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Standalone logout button — 'use client' so it can be embedded
 * inside server components (e.g. app/dashboard/member/[id]/page.tsx).
 */
export default function LogoutButton() {
  const supabase = createClient()
  const router   = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="btn btn-sm btn-outline-gray"
    >
      Esci
    </button>
  )
}
