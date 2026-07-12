'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface EsnNavbarProps {
  userName?: string
  section?: string
  role?: 'member' | 'board' | 'admin'
  onLogout?: () => void
}

export default function EsnNavbar({ userName, section, role, onLogout }: EsnNavbarProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const homePath =
    role === 'admin' ? '/dashboard/admin' : '/dashboard/my_reimbursement'

  return (
    <>
      <div className="colorful-strip" />

      <header className="navbar">
        <div className="container">
          <Link href={homePath} className="navbar-brand" onClick={close}>
            <Image
              src="/logo.svg" alt="ESN Logo" width={120} height={48} priority
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">Online Reimbursement System</span>
              {section && <span className="navbar-brand-section">{section}</span>}
            </div>
          </Link>

          <button
            className="navbar-toggle"
            aria-label={open ? 'Chiudi menu' : 'Apri menu'}
            aria-expanded={open}
            onClick={() => setOpen(o => !o)}
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="3" x2="19" y2="19" /><line x1="19" y1="3" x2="3" y2="19" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="19" y2="5" /><line x1="3" y1="11" x2="19" y2="11" /><line x1="3" y1="17" x2="19" y2="17" />
              </svg>
            )}
          </button>

          <nav className="navbar-nav-desktop">
            <ul className="navbar-nav">
              <NavItems role={role} userName={userName} onLogout={onLogout} onClick={close} />
            </ul>
          </nav>
        </div>

        {open && (
          <div className="navbar-collapse">
            <NavItems role={role} userName={userName} onLogout={onLogout} onClick={close} mobile />
          </div>
        )}
      </header>
    </>
  )
}

function NavItems({
  role, userName, onLogout, onClick, mobile = false,
}: {
  role?: string
  userName?: string
  onLogout?: () => void
  onClick: () => void
  mobile?: boolean
}) {
  const linkClass = mobile ? 'navbar-mobile-link' : 'nav-link'

  if (!userName) {
    return (
      <li><Link href="/auth/login" className="btn btn-sm btn-esn-cyan" onClick={onClick}>Accedi</Link></li>
    )
  }

  return (
    <>
      {mobile && (
        <li className="navbar-mobile-user">
          <span className="user-name">{userName}</span>
          {role && (
            <span className={`role-badge ${role}`}>
              {role === 'admin' ? 'Admin' : role === 'board' ? 'Board' : 'Membro'}
            </span>
          )}
        </li>
      )}

      {role === 'admin' ? (
        <>
          <li><Link href="/dashboard/admin"              className={linkClass} onClick={onClick}>Dashboard</Link></li>
          <li><Link href="/dashboard/admin/users"        className={linkClass} onClick={onClick}>Utenti</Link></li>
          <li><Link href="/dashboard/admin/sections"     className={linkClass} onClick={onClick}>Sezioni</Link></li>
          <li><Link href="/dashboard/admin/categories"   className={linkClass} onClick={onClick}>Categorie</Link></li>
          <li><Link href="/dashboard/admin/reports"      className={linkClass} onClick={onClick}>Report</Link></li>
        </>
      ) : role === 'board' ? (
        <>
          <li><Link href="/dashboard/my_reimbursement"      className={linkClass} onClick={onClick}>I Miei Rimborsi</Link></li>
          <li><Link href="/dashboard/review_reimbursement"  className={linkClass} onClick={onClick}>Revisione</Link></li>
        </>
      ) : (
        <li><Link href="/dashboard/my_reimbursement" className={linkClass} onClick={onClick}>I Miei Rimborsi</Link></li>
      )}

      {!mobile && (
        <li>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            {role && (
              <span className={`role-badge ${role}`}>
                {role === 'admin' ? 'Admin' : role === 'board' ? 'Board' : 'Membro'}
              </span>
            )}
          </div>
        </li>
      )}

      {onLogout && (
        <li>
          <button
            onClick={() => { onLogout(); onClick() }}
            className={mobile ? 'navbar-mobile-logout' : 'btn btn-sm btn-outline-gray'}
          >
            Esci
          </button>
        </li>
      )}
    </>
  )
}
