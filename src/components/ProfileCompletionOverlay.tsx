import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CircleUserRound } from 'lucide-react'
import { ModalPortal } from './ModalPortal'
import { ProfileCompletionForm } from './ProfileCompletionForm'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export function ProfileCompletionOverlay() {
  const { requiresProfileCompletion } = useAuth()
  const { theme } = useTheme()
  const { pathname } = useLocation()
  const assignedPracticeFlow =
    pathname.startsWith('/practice/assigned/') ||
    /^\/practice\/[^/]+\/take/.test(pathname) ||
    pathname.startsWith('/practice/result/')

  useEffect(() => {
    if (!requiresProfileCompletion || assignedPracticeFlow) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [requiresProfileCompletion, assignedPracticeFlow])

  if (!requiresProfileCompletion || assignedPracticeFlow) return null

  return (
    <ModalPortal>
      <div
        className="profile-completion-backdrop premium-app"
        data-app-theme={theme}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-completion-title"
      >
        <section className="profile-completion-sheet">
          <div className="profile-completion-handle" aria-hidden />
          <header className="profile-completion-header">
            <div className="profile-completion-icon" aria-hidden>
              <CircleUserRound size={26} />
            </div>
            <p className="profile-completion-kicker">Complete profile</p>
            <h2 id="profile-completion-title" className="profile-completion-title">
              Add your details to continue
            </h2>
            <p className="profile-completion-subtitle">
              Your name, phone, and location unlock practice, leaderboard, and personalized recommendations.
            </p>
          </header>
          <div className="profile-completion-body">
            <ProfileCompletionForm compact />
          </div>
        </section>
      </div>
    </ModalPortal>
  )
}
