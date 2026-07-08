import { useMemo, useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, platformApi } from '../lib/api'
import { syncRydPracticeAccount, stashBillingPasswordForSync, rydPracticeApi } from '../lib/rydApi'
import { useAuth } from '../context/AuthContext'
import { useAuthLightTheme } from '../hooks/useAuthLightTheme'

const initialForm = {
  email: '',
  password: '',
}

export function SignupPage() {
  useAuthLightTheme()
  const navigate = useNavigate()
  const { setAuthFromOtp } = useAuth()
  const [form, setForm] = useState(initialForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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

  const canSubmit = useMemo(
    () => form.email.trim().length > 0 && form.password.trim().length >= 5 && confirmPassword.trim().length >= 5,
    [form, confirmPassword],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (form.password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }
    setLoading(true)
    try {
      const email = form.email.trim().toLowerCase()
      const parentExists = await rydPracticeApi.checkParentEmailExists(email).catch(() => false)
      if (parentExists) {
        setError(
          'You already have an account on RYD Learning or one of our apps. Please sign in instead.',
        )
        return
      }
      const response = await authApi.signUp({
        email,
        password: form.password,
      })
      setAuthFromOtp({ token: response.token, student: response.student, rememberMe: true })
      stashBillingPasswordForSync(form.password)
      try {
        await syncRydPracticeAccount({
          email: form.email.trim(),
          password: form.password,
          rememberMe: true,
          registerDefaults: {
            firstName: 'Practice',
            lastName: 'Student',
            country: 'Nigeria',
            state: 'Lagos',
            timezone: 'Africa/Lagos',
          },
        })
      } catch {
        /* billing link retried on next login */
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create account'
      setError(message)
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
          <h2 className="login-title">Create account</h2>
          <p className="login-subtext">Start your exam preparation journey today.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-label">
              Email
              <input
                type="email"
                placeholder="you@example.com"
                className="login-input"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </label>
            <label className="login-label">
              Password
              <input
                type="password"
                minLength={5}
                placeholder="Create password"
                className="login-input"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </label>
            <label className="login-label">
              Confirm Password
              <input
                type="password"
                minLength={5}
                placeholder="Confirm password"
                className="login-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="login-submit" type="submit" disabled={!canSubmit || loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="login-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
          {error && /sign in instead/i.test(error) ? (
            <p className="login-footer mt-2">
              <Link to="/login" className="login-inline-action">
                Go to login →
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
