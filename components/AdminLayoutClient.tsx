'use client'

import { usePathname, useRouter } from 'next/navigation'
import EsnNavbar from '@/components/EsnNavbar'

const NAV = [
  { href: '/dashboard/admin',            label: '📊 Panoramica' },
  { href: '/dashboard/admin/users',      label: '👥 Utenti' },
  { href: '/dashboard/admin/sections',   label: '🌍 Sezioni' },
  { href: '/dashboard/admin/categories', label: '🏷️ Categorie' },
  { href: '/dashboard/admin/reports',    label: '📄 Report' },
]

export default function AdminLayoutClient({
  profile,
  children,
}: {
  profile: { full_name: string; section: string; role: string }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router   = useRouter()

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/auth/login')
  }

  return (
    <>
      <EsnNavbar
        userName={profile.full_name}
        section={profile.section}
        role="admin"
        onLogout={logout}
      />
      <div className="admin-layout">
        <aside className="admin-sidebar">
          {NAV.map(({ href, label }) => {
            const isActive = href === '/dashboard/admin'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <a key={href} href={href}
                className={`admin-sidebar-link${isActive ? ' active' : ''}`}>
                {label}
              </a>
            )
          })}
        </aside>
        <main className="admin-content">{children}</main>
      </div>
    </>
  )
}
