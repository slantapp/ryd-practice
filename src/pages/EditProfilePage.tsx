import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Save } from 'lucide-react'
import { ProfileLocationFields } from '../components/geo/ProfileLocationFields'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { PremiumSuccessModal } from '../components/PremiumSuccessModal'
import { useAuth } from '../context/AuthContext'

export function EditProfilePage() {
  const { user, profileExtras, completeProfile, profileUpdating } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState({ country: '', state: '', timezone: '' })
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    setFirstName(user?.firstName && user.firstName.toLowerCase() !== 'practice' ? user.firstName : '')
    setLastName(user?.lastName && user.lastName.toLowerCase() !== 'student' ? user.lastName : '')
    setPhone(user?.phone || '')
    setLocation({
      country: profileExtras?.country || '',
      state: profileExtras?.state || '',
      timezone: profileExtras?.timezone || '',
    })
  }, [user, profileExtras])

  const canSubmit = useMemo(
    () =>
      [firstName, lastName, phone, location.state, location.timezone, location.country].every(
        (v) => v.trim().length > 0,
      ),
    [firstName, lastName, phone, location],
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      await completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        state: location.state.trim(),
        timezone: location.timezone.trim(),
        country: location.country.trim(),
      })
      setShowSuccessModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    }
  }

  const inputClass = 'premium-input form-field-spaced mt-1 w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none'

  return (
    <PremiumAppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <Link to="/dashboard" className="premium-accent inline-flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={14} /> Back to dashboard
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-hero-gradient rounded-3xl border p-6"
        >
          <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Account</p>
          <h1 className="premium-heading mt-2 text-3xl font-bold">Edit profile</h1>
          <p className="premium-text-muted mt-2 text-sm">Update your name, contact, and study location.</p>
        </motion.section>

        <article className="premium-card rounded-2xl border p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className="premium-text-muted text-sm">
                First name
                <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="premium-text-muted text-sm">
                Last name
                <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
            </div>
            <label className="premium-text-muted text-sm">
              Email
              <input className={`${inputClass} opacity-60`} value={user?.email || ''} disabled />
            </label>
            <label className="premium-text-muted text-sm">
              Phone number
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>

            <ProfileLocationFields values={location} onChange={setLocation} />

            {error ? <p className="text-sm text-rose-500">{error}</p> : null}

            <button
              type="submit"
              disabled={!canSubmit || profileUpdating}
              className="premium-btn-primary premium-btn-sm form-submit-spaced inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold disabled:opacity-50"
            >
              <Save size={14} />
              {profileUpdating ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </article>
      </div>

      <PremiumSuccessModal
        open={showSuccessModal}
        title="Profile updated"
        message="Your profile details have been saved successfully."
        onClose={() => setShowSuccessModal(false)}
      />
    </PremiumAppShell>
  )
}
