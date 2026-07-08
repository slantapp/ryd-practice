import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { PremiumSuccessModal } from '../components/PremiumSuccessModal'
import { authApi } from '../lib/api'

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const canSubmit = useMemo(
    () => currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length >= 8,
    [currentPassword, newPassword, confirmPassword],
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setLoading(true)
    try {
      const response = await authApi.changePassword({
        currentPassword,
        newPassword,
      })
      setSuccessMessage(response.message || 'Password changed successfully.')
      setShowSuccessModal(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change password')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'premium-input form-field-spaced mt-1 w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none'

  return (
    <PremiumAppShell>
      <div className="mx-auto max-w-lg space-y-5">
        <Link to="/dashboard" className="premium-accent inline-flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-hero-gradient rounded-3xl border p-6"
        >
          <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Security</p>
          <h1 className="premium-heading mt-2 text-3xl font-bold">Change password</h1>
          <p className="premium-text-muted mt-2 text-sm">Enter your current password, then choose a new one.</p>
        </motion.section>

        <article className="premium-card rounded-2xl border p-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="premium-text-muted block text-sm">
              Current password
              <input
                type="password"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="premium-text-muted block text-sm">
              New password
              <input
                type="password"
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </label>
            <label className="premium-text-muted block text-sm">
              Confirm new password
              <input
                type="password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>

            {error ? <p className="text-sm text-rose-500">{error}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="premium-btn-primary premium-btn-sm form-submit-spaced inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold disabled:opacity-50"
            >
              <KeyRound size={14} />
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </article>
      </div>

      <PremiumSuccessModal
        open={showSuccessModal}
        title="Password updated"
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
    </PremiumAppShell>
  )
}
