'use client'

import { useRouter } from 'next/navigation'
import EsnNavbar from '@/components/EsnNavbar'
import type { Profile } from '@/lib/types'

export default function DashboardNavbarWrapper({ profile }: { profile: Profile }) {
  const router = useRouter()

  const handleLogout = () => {
    // Navigate to the server-side logout entrypoint which calls signOut() then redirects
    router.push('/auth/logout')
  }

  return (
    <EsnNavbar
      userName={profile.full_name}
      section={profile.section}
      role={profile.role as 'member' | 'board' | 'admin'}
      onLogout={handleLogout}
    />
  )
}
