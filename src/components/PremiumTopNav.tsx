import { Menu } from 'lucide-react'
import { PremiumNotificationBell } from './PremiumNotificationBell'
import { useAuth } from '../context/AuthContext'

interface PremiumTopNavProps {
  onOpenMenu?: () => void
  menuOpen?: boolean
}

export function PremiumTopNav({ onOpenMenu, menuOpen = false }: PremiumTopNavProps) {
  const { user } = useAuth()
  const firstName = user?.firstName?.trim() || 'Student'

  return (
    <header
      className="premium-topnav relative z-50 shrink-0 overflow-visible border-b px-3 py-2.5 backdrop-blur-md sm:px-4 md:px-6"
      style={{
        borderColor: 'var(--premium-sidebar-border)',
        background: 'var(--premium-sidebar-bg)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {onOpenMenu ? (
            <button
              type="button"
              className="premium-icon-btn lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={onOpenMenu}
            >
              <Menu size={18} />
            </button>
          ) : null}
          <p className="premium-topnav-greeting truncate text-sm">Welcome back, {firstName}</p>
        </div>
        <PremiumNotificationBell />
      </div>
    </header>
  )
}
