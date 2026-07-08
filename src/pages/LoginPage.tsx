import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { platformApi } from '../lib/api'
import { useAuthLightTheme } from '../hooks/useAuthLightTheme'

export function LoginPage() {
  useAuthLightTheme()
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    try {
      await signIn({ email, password, rememberMe })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in'
      setError(message)
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
          <h2 className="login-title">Welcome back</h2>
          <p className="login-subtext">Sign in to continue your exam preparation</p>

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

            <label className="login-label">
              Password
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="login-input login-input-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </label>

            <div className="login-row">
              <label className="remember-me-dark">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            {error ? <p className="error">{error}</p> : null}

            <button className="login-submit" type="submit" disabled={!email || !password || loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="login-footer">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
