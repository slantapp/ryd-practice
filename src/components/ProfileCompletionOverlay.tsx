import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { CircleUserRound } from 'lucide-react'
import { ModalPortal } from './ModalPortal'
import { ProfileCompletionForm } from './ProfileCompletionForm'
import { useAuth } from '../context/AuthContext'

export function ProfileCompletionOverlay() {
  const { requiresProfileCompletion } = useAuth()
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
      <div className="profile-completion-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-completion-title">
        <section className="premium-modal-card profile-completion-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-[color-mix(in_srgb,var(--premium-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--premium-accent)_12%,transparent)]">
            <CircleUserRound size={28} className="premium-accent" />
          </div>
          <p className="premium-accent text-center text-[11px] uppercase tracking-[0.2em]">Complete profile</p>
          <h2 id="profile-completion-title" className="premium-heading mt-2 text-center text-xl font-bold">
            Add your details to continue
          </h2>
          <p className="premium-text-muted mt-2 text-center text-sm leading-relaxed">
            Tell us your name, phone, and location to unlock practice, leaderboard, and personalized recommendations.
          </p>
          <div className="mt-6">
            <ProfileCompletionForm compact />
          </div>
        </section>
      </div>
    </ModalPortal>
  )
}
