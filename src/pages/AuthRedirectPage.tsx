import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../lib/api'
import { ensureAssignedPracticeId } from '../lib/assignedPracticeFlow'

export function AuthRedirectPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuthFromOtp } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const payload = useMemo(() => ({
    email: searchParams.get('email')?.trim() || '',
    password: searchParams.get('password') || '',
    auto: searchParams.get('auto') === '1',
    assignedPracticeId: searchParams.get('assignedPracticeId')?.trim() || '',
  }), [searchParams])

  useEffect(() => {
    let cancelled = false

    if (!payload.auto) {
      navigate('/login', { replace: true })
      return
    }
    if (!payload.email || !payload.password) {
      setError('Missing sign-in credentials.')
      return
    }

    const run = async () => {
      try {
        const response = await authApi.signIn({
          email: payload.email,
          password: payload.password,
          rememberMe: true,
        })
        if (cancelled) return
        if (!response.token || !response.student) {
          throw new Error(response.message || 'Sign-in failed')
        }

        setAuthFromOtp({ token: response.token, student: response.student, rememberMe: true })

        try {
          const me = await authApi.getMe()
          if (!cancelled && me.profileExtras?.country && me.profileExtras?.timezone) {
            localStorage.setItem(
              'practice-profile-extras',
              JSON.stringify({
                country: me.profileExtras.country,
                state: me.profileExtras.state || 'Lagos',
                timezone: me.profileExtras.timezone,
              }),
            )
            localStorage.setItem('practice-profile-complete', 'true')
          }
          if (!cancelled) {
            ensureAssignedPracticeId(me.packageAccess?.assignedPracticeId || payload.assignedPracticeId)
          }
        } catch {
          ensureAssignedPracticeId(payload.assignedPracticeId)
        }

        const assignedId =
          payload.assignedPracticeId ||
          (() => {
            try {
              return sessionStorage.getItem('practice-assigned-id') || ''
            } catch {
              return ''
            }
          })()

        if (assignedId) {
          navigate(`/practice/assigned/${assignedId}`, { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Unable to sign in')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [navigate, payload, setAuthFromOtp])

  return (
    <main className="grid min-h-screen place-items-center bg-[#12001f] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
        {!error ? (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <h1 className="text-lg font-semibold">Signing you in…</h1>
            <p className="mt-2 text-sm text-white/70">Redirecting to RYD Practice.</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-rose-200">Sign-in failed</h1>
            <p className="mt-2 text-sm text-white/70">{error}</p>
            <button
              type="button"
              className="premium-btn-primary mt-6 rounded-xl px-4 py-2 text-sm font-semibold"
              onClick={() => navigate('/login', { replace: true })}
            >
              Go to login
            </button>
          </>
        )}
      </div>
    </main>
  )
}
