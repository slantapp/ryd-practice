import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { OtpInput } from '../components/OtpInput'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/api'
import { syncRydPracticeAccount, stashBillingPasswordForSync, rydPracticeApi } from '../lib/rydApi'
import { useAuthLightTheme } from '../hooks/useAuthLightTheme'

type OtpPurpose = 'signup' | 'reset'

interface OtpLocationState {
  purpose?: OtpPurpose
  email?: string
  password?: string
}

export function OtpVerificationPage() {
  useAuthLightTheme()
  const { setAuthFromOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as OtpLocationState
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(60)

  const purpose: OtpPurpose = state.purpose || 'signup'
  const email = state.email || ''
  const password = state.password || ''
  const otpString = useMemo(() => otp.join(''), [otp])

  useEffect(() => {
    if (purpose === 'reset') {
      navigate('/forgot-password', { replace: true })
      return
    }
    if (!email) navigate('/signup', { replace: true })
    if (!password) navigate('/signup', { replace: true })
  }, [email, navigate, password, purpose])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || !email) return
    setError('')
    try {
      await authApi.requestSignupOtp(email)
      setCooldown(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code')
    }
  }

  const handleVerify = async () => {
    setError('')
    if (otpString.length !== 6) {
      setError('Enter the complete 6-digit code.')
      return
    }
    setLoading(true)
    try {
      const response = await authApi.verifySignupOtp({ email, password, otp: otpString })
      setAuthFromOtp({ token: response.token, student: response.student, rememberMe: true })
      stashBillingPasswordForSync(password)
      try {
        await syncRydPracticeAccount({
          email,
          password,
          rememberMe: true,
          registerDefaults: {
            firstName: 'Practice',
            lastName: 'Student',
            country: 'Nigeria',
            state: 'Lagos',
            timezone: 'Africa/Lagos',
          },
        })
      } catch (syncErr) {
        const exists = await rydPracticeApi.checkParentEmailExists(email).catch(() => false)
        if (exists) {
          /* billing account already exists — login on next sign-in */
        }
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card otp-card">
        <div className="otp-icon" aria-hidden>✉️</div>
        <h1>Verify your email</h1>
        <p className="auth-subtext">We sent a 6-digit code to {email || 'your email'}.</p>
        <OtpInput value={otp} onChange={setOtp} />
        {error ? <p className="error">{error}</p> : null}
        <button type="button" onClick={handleVerify} disabled={loading || otpString.length !== 6}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        <div className="inline-actions center">
          <button type="button" className="text-btn" disabled={cooldown > 0} onClick={handleResend}>
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
          <Link to="/signup">Wrong email? Go back</Link>
        </div>
      </section>
    </main>
  )
}
