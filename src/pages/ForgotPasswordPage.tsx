import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, platformApi } from '../lib/api'
import { useAuthLightTheme } from '../hooks/useAuthLightTheme'

export function ForgotPasswordPage() {
  useAuthLightTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [platformStats, setPlatformStats] = useState({ practiceSets: 0, totalQuestions: 0 })

  useEffect(() => {
    void platformApi.getStats().then(setPlatformStats)
  }, [])

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const response = await authApi.requestPasswordReset(email.trim())
      if (!response.status) {
        setError(response.message || 'Unable to reset password')
        return
      }
      setSuccess(`${response.message}: a new password has been sent to your email.`)
      window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-left">
        <div className="login-left-overlay" />
        <div className="login-left-content">
          <p className="login-brand-top">◉ RYD PRACTICE</p>
          <div className="login-divider" />
          <h1 className="login-hero-title">Practice Smart. Pass Confidently.</h1>
          <p className="login-hero-subtitle">
            Join thousands of students who are preparing smarter and passing with confidence.
          </p>
        </div>
        <div className="login-stats">
          <span className="stat-pill">
            {platformStats.totalQuestions > 0
              ? `${platformStats.totalQuestions.toLocaleString()}+ Questions`
              : 'Practice Questions'}
          </span>
          <span className="stat-pill">
            {platformStats.practiceSets > 0
              ? `${platformStats.practiceSets} Practice Sets`
              : 'Exam Practice'}
          </span>
          <span className="stat-pill">WAEC &amp; JAMB Ready</span>
        </div>
      </section>

      <section className="login-right">
        <div className="login-form-wrap">
          <p className="login-brand-mini">RYD PRACTICE</p>
          <h2 className="login-title">Forgot password?</h2>
          <p className="login-subtext">
            Enter your email and we will send you a new password, just like the main RYD Learning parent app.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">
              Email
              <input
                type="email"
                placeholder="you@example.com"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {error ? <p className="error">{error}</p> : null}
            {success ? <p className="login-success">{success}</p> : null}

            <button className="login-submit" type="submit" disabled={!email.trim() || loading}>
              {loading ? 'Processing...' : 'Reset Password'}
            </button>
          </form>

          <p className="login-footer">
            Remembered your password? <Link to="/login">Log in now</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
