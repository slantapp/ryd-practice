import { PremiumNotificationBell } from './PremiumNotificationBell'
import { useAuth } from '../context/AuthContext'

export function PremiumTopNav() {
  const { user } = useAuth()
  const firstName = user?.firstName?.trim() || 'Student'

  return (
    <header
      className="premium-topnav relative z-50 shrink-0 overflow-visible border-b px-4 py-2.5 backdrop-blur-md md:px-6"
      style={{
        borderColor: 'var(--premium-sidebar-border)',
        background: 'var(--premium-sidebar-bg)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="premium-topnav-greeting truncate text-sm">Welcome back, {firstName}</p>
        <PremiumNotificationBell />
      </div>
    </header>
  )
}
