import { Link } from 'react-router-dom'

export function ResetSuccessPage() {
  return (
    <main className="auth-page">
      <section className="auth-card otp-card">
        <div className="otp-icon" aria-hidden>✅</div>
        <h1>Password reset successful</h1>
        <p className="auth-subtext">Your password has been updated. You can now login with your new password.</p>
        <Link className="link-btn" to="/login">Back to Login</Link>
      </section>
    </main>
  )
}
