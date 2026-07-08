import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function PracticeTopNav() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student'
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'S'

  const navItems = [
    { href: '/dashboard', label: 'Home' },
    { href: '/practice/catalog', label: 'Browse Practices' },
    { href: '/practice/attempts', label: 'My Attempts' },
    { href: '/practice/home', label: 'Leaderboard' },
  ]

  return (
    <header className="practice-topbar">
      <p className="practice-logo">RYD PRACTICE</p>
      <nav className="practice-nav-links">
        {navItems.map((item) => {
          const active = location.pathname === item.href
          return (
            <Link key={item.label} className={active ? 'active' : ''} to={item.href}>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="practice-user-menu">
        <button type="button" className="practice-user-chip" onClick={() => setOpen((v) => !v)}>
          <span className="avatar">{initials}</span>
          <span>{fullName}</span>
          <span>▾</span>
        </button>
        {open ? (
          <div className="user-dropdown">
            <button type="button" onClick={signOut}>Logout</button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
