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

  if (!compact) {
    return (
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-grid-two">
          <label>
            First Name
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </label>
          <label>
            Last Name
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </label>
        </div>

        <label>
          Phone Number
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        <ProfileLocationFields values={location} onChange={setLocation} />

        {error ? <p className="text-sm text-rose-500">{error}</p> : null}
        <button className="profile-submit" type="submit" disabled={!canSubmit || profileUpdating}>
          {profileUpdating ? 'Saving...' : 'Save & Continue →'}
        </button>
      </form>
    )
  }

  return (
    <form className="profile-completion-form" onSubmit={handleSubmit}>
      <div className="profile-completion-row">
        <label className="profile-completion-field">
          <span>First name</span>
          <input
            className="profile-completion-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            placeholder="Ada"
          />
        </label>
        <label className="profile-completion-field">
          <span>Last name</span>
          <input
            className="profile-completion-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            placeholder="Lovelace"
          />
        </label>
      </div>

      <label className="profile-completion-field">
        <span>Phone number</span>
        <input
          className="profile-completion-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          placeholder="+234…"
        />
      </label>

      <ProfileLocationFields values={location} onChange={setLocation} />

      {error ? <p className="profile-completion-error">{error}</p> : null}

      <button
        className="profile-completion-submit"
        type="submit"
        disabled={!canSubmit || profileUpdating}
      >
        {profileUpdating ? 'Saving…' : 'Save & continue'}
      </button>
    </form>
  )
}
