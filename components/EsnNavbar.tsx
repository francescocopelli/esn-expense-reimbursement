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
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.svg" alt="ESN Logo" width={120} height={45} priority />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[#2E3192] leading-tight">Online Reimbursement System</p>
            {section && <p className="text-xs text-gray-400">{section}</p>}
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {userName && (
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-800">{userName}</p>
              {role && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  role === 'board'
                    ? 'bg-[#2E3192] text-white'
                    : 'bg-[#00AEEF] text-white'
                }`}>
                  {role === 'board' ? 'Board' : 'Membro'}
                </span>
              )}
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-200"
            >
              Esci
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
