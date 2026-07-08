import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, studentApi, PRACTICE_SIGNUP_SOURCE } from '../lib/api'
import { getStoredToken } from '../lib/apiClient'
import { clearAssignedPracticeId, ensureAssignedPracticeId, getAssignedPracticeId } from '../lib/assignedPracticeFlow'
import { clearRydToken, getStoredRydToken, stashBillingPasswordForSync, syncRydPracticeAccount, rydPracticeApi, RYD_BILLING_PW_KEY } from '../lib/rydApi'
import type { AuthUser, LoginPayload, ProfileExtras } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  profileExtras: ProfileExtras | null
  loading: boolean
  bootstrapping: boolean
  profileUpdating: boolean
  requiresProfileCompletion: boolean
  signIn: (payload: LoginPayload) => Promise<void>
  completeProfile: (payload: {
    firstName: string
    lastName: string
    phone: string
    state: string
    timezone: string
    country: string
  }) => Promise<void>
  signOut: () => void
  setAuthFromOtp: (payload: { token: string; student: AuthUser; rememberMe?: boolean }) => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USER_KEY = 'practice-parent-user'
const TOKEN_KEY = 'practice-parent-token'
const SOURCE_KEY = 'practice-signup-source'
const PROFILE_EXTRAS_KEY = 'practice-profile-extras'
const PROFILE_COMPLETE_KEY = 'practice-profile-complete'

function readStoredProfileExtras(): ProfileExtras | null {
  const raw = localStorage.getItem(PROFILE_EXTRAS_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as ProfileExtras
    if (parsed?.country && parsed?.state && parsed?.timezone) return parsed
    return null
  } catch {
    return null
  }
}

function persistProfileExtras(extras: ProfileExtras) {
  localStorage.setItem(PROFILE_EXTRAS_KEY, JSON.stringify(extras))
  localStorage.setItem(PROFILE_COMPLETE_KEY, 'true')
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function isProfileComplete(user: AuthUser | null, extras: ProfileExtras | null) {
  if (!user) return false
  const phone = user.phone?.trim() || ''
  const firstName = user.firstName?.trim() || ''
  const lastName = user.lastName?.trim() || ''
  const state = extras?.state?.trim() || ''
  const timezone = extras?.timezone?.trim() || ''
  const country = extras?.country?.trim() || ''
  const isPlaceholder = firstName.toLowerCase() === 'practice' && lastName.toLowerCase() === 'student'
  return Boolean(firstName && lastName && phone && state && timezone && country && !isPlaceholder)
}

function requiresProfileCompletion(user: AuthUser | null, extras: ProfileExtras | null) {
  if (!user) return false
  if (localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true') return false
  return !isProfileComplete(user, extras)
}

function applyAuthPayload(
  payload: { token: string; student: AuthUser },
  rememberMe: boolean,
  setUser: (u: AuthUser) => void,
) {
  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, payload.token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.removeItem(TOKEN_KEY)
  }
  localStorage.setItem(USER_KEY, JSON.stringify(payload.student))
  localStorage.setItem(SOURCE_KEY, PRACTICE_SIGNUP_SOURCE)
  setUser(payload.student)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)
  const [profileExtras, setProfileExtras] = useState<ProfileExtras | null>(() => readStoredProfileExtras())
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(!!getStoredToken())
  const [profileUpdating, setProfileUpdating] = useState(false)

  const refreshSession = async () => {
    if (!getStoredToken()) {
      setUser(null)
      setProfileExtras(null)
      return
    }
    const me = await authApi.getMe()
    setUser(me.student)
    localStorage.setItem(USER_KEY, JSON.stringify(me.student))
    ensureAssignedPracticeId(me.packageAccess?.assignedPracticeId)
    const apiExtras =
      me.profileExtras?.country && me.profileExtras?.timezone
        ? {
            state: me.profileExtras.state || 'Lagos',
            timezone: me.profileExtras.timezone,
            country: me.profileExtras.country,
          }
        : null
    const storedExtras = readStoredProfileExtras()
    const merged = apiExtras ?? storedExtras
    setProfileExtras(merged)
    if (apiExtras) {
      persistProfileExtras(apiExtras)
    } else if (isProfileComplete(me.student, merged) && merged) {
      persistProfileExtras(merged)
    }
  }

  useEffect(() => {
    if (!getStoredToken()) {
      setBootstrapping(false)
      return
    }
    void (async () => {
      try {
        await refreshSession()
      } catch {
        setUser(null)
        setProfileExtras(null)
        localStorage.removeItem(USER_KEY)
      } finally {
        setBootstrapping(false)
      }
    })()
  }, [])

  const signIn = async (payload: LoginPayload) => {
    setLoading(true)
    try {
      const response = await authApi.signIn(payload)
      if (!response.token || !response.student) {
        throw new Error(response.message || 'Unable to sign in')
      }
      applyAuthPayload(response, !!payload.rememberMe, setUser)
      stashBillingPasswordForSync(payload.password)
      try {
        await refreshSession()
      } catch {
        setProfileExtras(null)
      }
      const isPackageStudent =
        response.student.email?.toLowerCase().endsWith('@ryd-cbt.integration') ||
        Boolean(getAssignedPracticeId())
      if (!isPackageStudent) {
        try {
          const currentUser = JSON.parse(localStorage.getItem(USER_KEY) || 'null') as AuthUser | null
          const extras = readStoredProfileExtras()
          await syncRydPracticeAccount({
            email: payload.email,
            password: payload.password,
            rememberMe: payload.rememberMe,
            registerDefaults: currentUser
              ? {
                  firstName: currentUser.firstName?.trim() || 'Practice',
                  lastName: currentUser.lastName?.trim() || 'Student',
                  phone: currentUser.phone?.trim() || undefined,
                  country: extras?.country?.trim() || 'Nigeria',
                  state: extras?.state?.trim() || 'Lagos',
                  timezone: extras?.timezone?.trim() || 'Africa/Lagos',
                }
              : {
                  firstName: 'Practice',
                  lastName: 'Student',
                  country: 'Nigeria',
                  state: 'Lagos',
                  timezone: 'Africa/Lagos',
                },
          })
        } catch {
          /* RYD link retried on subscription refresh via session password */
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const completeProfile = async (payload: {
    firstName: string
    lastName: string
    phone: string
    state: string
    timezone: string
    country: string
  }) => {
    setProfileUpdating(true)
    try {
      const response = await studentApi.updateProfile(payload)
      setUser(response.student)
      localStorage.setItem(USER_KEY, JSON.stringify(response.student))
      const extras = {
        state: payload.state,
        timezone: payload.timezone,
        country: payload.country,
      }
      setProfileExtras(extras)
      persistProfileExtras(extras)
      const password = sessionStorage.getItem(RYD_BILLING_PW_KEY)
      if (password && response.student.email) {
        try {
          await syncRydPracticeAccount({
            email: response.student.email,
            password,
            registerDefaults: {
              firstName: payload.firstName,
              lastName: payload.lastName,
              phone: payload.phone,
              country: payload.country,
              state: payload.state,
              timezone: payload.timezone,
            },
          })
        } catch {
          /* billing link retried on subscription refresh */
        }
      }
      if (getStoredRydToken()) {
        try {
          await rydPracticeApi.updateProfile(payload)
        } catch {
          /* profile sync best-effort */
        }
      }
    } finally {
      setProfileUpdating(false)
    }
  }

  const setAuthFromOtp = (payload: { token: string; student: AuthUser; rememberMe?: boolean }) => {
    applyAuthPayload(payload, !!payload.rememberMe, setUser)
    setProfileExtras(null)
  }

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(PROFILE_EXTRAS_KEY)
    localStorage.removeItem(PROFILE_COMPLETE_KEY)
    clearAssignedPracticeId()
    clearRydToken()
    setUser(null)
    setProfileExtras(null)
  }

  const value = useMemo(
    () => ({
      user,
      profileExtras,
      loading,
      bootstrapping,
      profileUpdating,
      requiresProfileCompletion: requiresProfileCompletion(user, profileExtras),
      signIn,
      completeProfile,
      signOut,
      setAuthFromOtp,
      refreshSession,
    }),
    [user, loading, bootstrapping, profileUpdating, profileExtras],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
