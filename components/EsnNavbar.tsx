'use client'

import Image from 'next/image'
import Link from 'next/link'

interface EsnNavbarProps {
  userName?: string
  section?: string
  role?: 'member' | 'board'
  onLogout?: () => void
}

export default function EsnNavbar({ userName, section, role, onLogout }: EsnNavbarProps) {
  return (
    <>
      {/* Colorful strip — exact replica of Reimbursement-Tracker */}
      <div className="colorful-strip" />

      <header className="navbar">
        <div className="container">
          {/* Brand */}
          <Link href="/" className="navbar-brand">
            <Image
              src="/logo.svg"
              alt="ESN Logo"
              width={120}
              height={48}
              priority
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">Online Reimbursement System</span>
              {section && <span className="navbar-brand-section">{section}</span>}
            </div>
          </Link>

          {/* Right side nav */}
          <nav>
            <ul className="navbar-nav">
              {userName ? (
                <>
                  <li>
                    <Link href="/dashboard" className="nav-link">
                      Dashboard
                    </Link>
                  </li>
                  {role === 'board' && (
                    <li>
                      <Link href="/dashboard/review" className="nav-link">
                        Revisione
                      </Link>
                    </li>
                  )}
                  <li>
                    <div className="user-info">
                      <span className="user-name">{userName}</span>
                      {role && (
                        <span className={`role-badge ${role}`}>
                          {role === 'board' ? 'Board' : 'Membro'}
                        </span>
                      )}
                    </div>
                  </li>
                  {onLogout && (
                    <li>
                      <button onClick={onLogout} className="btn btn-sm btn-outline-gray">
                        Esci
                      </button>
                    </li>
                  )}
                </>
              ) : (
                <li>
                  <Link href="/auth/login" className="btn btn-sm btn-esn-cyan">
                    Accedi
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  )
}
