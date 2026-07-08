import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { authApi } from '../lib/api'

interface ResetState {
  email?: string
  otp?: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as ResetState
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => password.length >= 5 && confirmPassword.length >= 5, [password, confirmPassword])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!state.email || !state.otp) {
      setError('Reset session expired. Request a new code.')
      return
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await authApi.verifyPasswordOtpAndReset({
        email: state.email,
        otp: state.otp,
        newPassword: password,
      })
      navigate('/reset-password/success', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout>
      <p className="auth-eyebrow">Set new password</p>
      <h1>Create a new password</h1>
      <p className="auth-subtext">Use a strong password you can remember.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Password
          <input type="password" minLength={5} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          Confirm password
          <input type="password" minLength={5} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={!canSubmit || loading}>
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
      <p className="auth-footer">
        Back to <Link to="/login">Login</Link>
      </p>
    </AuthSplitLayout>
  )
}
