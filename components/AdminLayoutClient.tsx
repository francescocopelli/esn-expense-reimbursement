'use client'

import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard/admin',            label: '\ud83d\udcca Panoramica' },
  { href: '/dashboard/admin/users',      label: '\ud83d\udc65 Utenti' },
  { href: '/dashboard/admin/sections',   label: '\ud83c\udf0d Sezioni' },
  { href: '/dashboard/admin/categories', label: '\ud83c\udff7\ufe0f Categorie' },
  { href: '/dashboard/admin/reports',    label: '\ud83d\udcc4 Report' },
]

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
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
  )
}
