import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Moon,
  Sun,
  Trophy,
  UserRound,
} from 'lucide-react'
import { PremiumTopNav } from './PremiumTopNav'
import { ProfileCompletionOverlay } from './ProfileCompletionOverlay'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Practice', icon: BookOpen, href: '/practice/catalog' },
  { label: 'My Attempts', icon: BarChart3, href: '/practice/attempts' },
  { label: 'Leaderboard', icon: Trophy, href: '/practice/home' },
  { label: 'Study Planner', icon: CalendarDays, href: '/study-planner' },
]

interface PremiumAppShellProps {
  children: ReactNode
  hideSidebar?: boolean
  mainClassName?: string
}

export function PremiumAppShell({ children, hideSidebar = false, mainClassName = '' }: PremiumAppShellProps) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student'
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'S'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard'
    if (href === '/practice/home') return location.pathname === '/practice/home'
    if (href === '/study-planner') return location.pathname === '/study-planner'
    return location.pathname.startsWith(href)
  }

  return (
    <div className="premium-app fixed inset-0 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-24 top-20 h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'var(--premium-glow-a)' }}
        />
        <div
          className="absolute right-0 top-40 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'var(--premium-glow-b)' }}
        />
      </div>
      <div className={`relative grid h-full ${hideSidebar ? 'grid-cols-1' : 'grid-cols-[260px_1fr]'}`}>
        {!hideSidebar ? (
        <aside
          className="flex h-full shrink-0 flex-col overflow-hidden border-r p-5 backdrop-blur-xl"
          style={{
            borderColor: 'var(--premium-sidebar-border)',
            background: 'var(--premium-sidebar-bg)',
          }}
        >
          <div className="mb-6 flex shrink-0 items-center gap-3">
            <div
              className="grid h-9 w-9 place-items-center rounded-xl"
              style={{ background: 'color-mix(in srgb, var(--premium-accent-strong) 20%, transparent)', color: 'var(--premium-accent)' }}
            >
              <GraduationCap size={18} />
            </div>
            <div>
              <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">RYD PRACTICE</p>
              <p className="premium-text-muted text-sm">Student Platform</p>
            </div>
          </div>

          <nav className="min-h-0 flex-1 space-y-1 overflow-hidden">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`group flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition ${
                  isActive(item.href) ? 'premium-nav-link-active' : 'premium-nav-link'
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon
                    size={16}
                    className="premium-accent"
                    style={{ opacity: isActive(item.href) ? 1 : 0.65 }}
                  />
                  {item.label}
                </span>
                {isActive(item.href) ? <ChevronRight size={14} className="premium-accent" /> : null}
              </Link>
            ))}
          </nav>

          <div className="mt-3 shrink-0 space-y-2">
            <div className="premium-theme-switch" role="group" aria-label="Theme">
              <button
                type="button"
                className={theme === 'dark' ? 'is-active' : ''}
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
              >
                <Moon size={14} />
                Dark
              </button>
              <button
                type="button"
                className={theme === 'light' ? 'is-active' : ''}
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
              >
                <Sun size={14} />
                Light
              </button>
            </div>

            <div ref={menuRef} className="relative">
              {userMenuOpen ? (
                <div
                  className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border shadow-xl"
                  style={{
                    borderColor: 'var(--premium-sidebar-border)',
                    background: 'var(--premium-menu-bg)',
                  }}
                >
                  <Link
                    to="/settings/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition hover:opacity-80"
                    style={{ color: 'var(--premium-text)' }}
                  >
                    <UserRound size={15} className="premium-accent" />
                    Edit profile
                  </Link>
                  <Link
                    to="/settings/password"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm transition hover:opacity-80"
                    style={{ color: 'var(--premium-text)' }}
                  >
                    <KeyRound size={15} className="premium-accent" />
                    Change password
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut()
                    }}
                    className="flex w-full items-center gap-2 border-t px-3 py-2.5 text-sm text-rose-500 hover:opacity-80"
                    style={{ borderColor: 'var(--premium-card-border)' }}
                  >
                    <LogOut size={15} />
                    Log out
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                className="premium-card flex w-full items-center gap-2 rounded-2xl border px-2 py-2 text-left text-sm transition hover:opacity-90"
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-full text-xs font-semibold text-white"
                  style={{ background: 'color-mix(in srgb, var(--premium-accent-strong) 55%, transparent)' }}
                >
                  {initials}
                </span>
                <span className="premium-text-muted flex-1 truncate">{fullName}</span>
                <ChevronRight
                  size={14}
                  className={`premium-text-soft transition ${userMenuOpen ? 'rotate-90' : ''}`}
                />
              </button>
            </div>
          </div>
        </aside>
        ) : null}

        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-visible">
          {!hideSidebar ? <PremiumTopNav /> : null}
          <main
            className={`premium-main relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain ${mainClassName} ${
              hideSidebar ? 'flex flex-col items-center justify-start p-4 md:p-8' : 'p-7'
            }`}
          >
            {children}
          </main>
        </div>
      </div>
      <ProfileCompletionOverlay />
    </div>
  )
}
