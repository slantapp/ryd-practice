import { useNavigate } from 'react-router-dom'
import { ProfileCompletionForm } from '../components/ProfileCompletionForm'
import { useTheme } from '../context/ThemeContext'

export function ProfileSetupPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()

  return (
    <main className={`profile-setup-shell premium-app`} data-app-theme={theme}>
      <section className="profile-setup-layout">
        <aside className="profile-setup-left">
          <div className="profile-left-brand">
            <span className="profile-left-icon">◉</span>
            <p>RYD PRACTICE</p>
          </div>
          <h1>Almost there!</h1>
          <p className="profile-left-subtext">
            Tell us a bit about yourself so we can personalize your exam recommendations and track your progress
            accurately.
          </p>
          <div className="profile-left-divider" />
          <div className="profile-benefits">
            <div>
              <span>✦</span>
              <p>Personalized exam recommendations</p>
            </div>
            <div>
              <span>✦</span>
              <p>Track progress by state and region</p>
            </div>
            <div>
              <span>✦</span>
              <p>Join your local leaderboard</p>
            </div>
          </div>
          <p className="profile-step">Step 1 of 1 — Profile Details</p>
        </aside>

        <section className="profile-setup-right">
          <p className="profile-kicker">PROFILE SETUP</p>
          <h2>Complete your details</h2>
          <p className="profile-subtext">Tell us about you to personalize your practice journey.</p>

          <ProfileCompletionForm onSuccess={() => navigate('/practice/home', { replace: true })} />
        </section>
      </section>
    </main>
  )
}
