import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { ProfileLocationFields } from './geo/ProfileLocationFields'
import { useAuth } from '../context/AuthContext'

interface ProfileCompletionFormProps {
  onSuccess?: () => void
  compact?: boolean
}

export function ProfileCompletionForm({ onSuccess, compact = false }: ProfileCompletionFormProps) {
  const { user, profileExtras, completeProfile, profileUpdating } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState({
    country: '',
    state: '',
    timezone: '',
  })
  const [error, setError] = useState('')

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
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    }
  }

  return (
    <form className={compact ? 'space-y-4' : 'profile-form'} onSubmit={handleSubmit}>
      <div className={compact ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'profile-grid-two'}>
        <label className={compact ? 'block text-sm' : undefined}>
          <span className={compact ? 'premium-text-soft mb-1 block text-xs font-medium' : undefined}>First Name</span>
          <input
            className={compact ? 'premium-input w-full rounded-xl border px-3 py-2' : undefined}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className={compact ? 'block text-sm' : undefined}>
          <span className={compact ? 'premium-text-soft mb-1 block text-xs font-medium' : undefined}>Last Name</span>
          <input
            className={compact ? 'premium-input w-full rounded-xl border px-3 py-2' : undefined}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>

      <label className={compact ? 'block text-sm' : undefined}>
        <span className={compact ? 'premium-text-soft mb-1 block text-xs font-medium' : undefined}>Phone Number</span>
        <input
          className={compact ? 'premium-input w-full rounded-xl border px-3 py-2' : undefined}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>

      <ProfileLocationFields values={location} onChange={setLocation} />

      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <button
        className={compact ? 'premium-btn-primary w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50' : 'profile-submit'}
        type="submit"
        disabled={!canSubmit || profileUpdating}
      >
        {profileUpdating ? 'Saving...' : 'Save & Continue →'}
      </button>
    </form>
  )
}
