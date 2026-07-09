import axios, { isAxiosError } from 'axios'

const RYD_TOKEN_KEY = 'practice-ryd-parent-token'
/** Session-only — used once after login to link RYD billing if token was missing. */
export const RYD_BILLING_PW_KEY = 'practice-billing-password-sync'

export function stashBillingPasswordForSync(password: string) {
  if (password.trim()) {
    sessionStorage.setItem(RYD_BILLING_PW_KEY, password)
  }
}

export function clearBillingPasswordSync() {
  sessionStorage.removeItem(RYD_BILLING_PW_KEY)
}

function getRydBaseUrl(): string {
  const env = import.meta.env.VITE_RYD_API_URL as string | undefined
  if (env?.trim()) return env.replace(/\/$/, '')
  if (import.meta.env.DEV) return '/ryd-api'
  return 'https://api-pro.rydlearning.com'
}

export function getStoredRydToken(): string | null {
  return localStorage.getItem(RYD_TOKEN_KEY) || sessionStorage.getItem(RYD_TOKEN_KEY)
}

export function persistRydToken(token: string, rememberMe = true) {
  if (rememberMe) {
    localStorage.setItem(RYD_TOKEN_KEY, token)
    sessionStorage.removeItem(RYD_TOKEN_KEY)
  } else {
    sessionStorage.setItem(RYD_TOKEN_KEY, token)
    localStorage.removeItem(RYD_TOKEN_KEY)
  }
}

export function clearRydToken() {
  localStorage.removeItem(RYD_TOKEN_KEY)
  sessionStorage.removeItem(RYD_TOKEN_KEY)
  clearBillingPasswordSync()
}

function rydClient(withAuth = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (withAuth) {
    const token = getStoredRydToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return axios.create({ baseURL: getRydBaseUrl(), headers })
}

type RydEnvelope<T> = { status: boolean; message: string; data: T }

function unwrap<T>(res: { data: RydEnvelope<T> }): T {
  if (!res.data?.status) {
    throw new Error(res.data?.message || 'Request failed')
  }
  return res.data.data
}

export function sanitizeUserFacingMessage(message: string, fallback: string): string {
  const raw = message.trim()
  if (!raw) return fallback

  const lower = raw.toLowerCase()
  if (
    lower.includes('stripe_ai_sk') ||
    lower.includes('payments are not configured') ||
    lower.includes('stripepriceid') ||
    /\bstripe\b/.test(lower)
  ) {
    if (lower.includes('not configured') || lower.includes('stripe_ai_sk')) {
      return 'Payments are temporarily unavailable. Please try again later or contact support.'
    }
    return 'We could not complete payment setup. Please try again or contact support.'
  }

  return raw
}

function readRydApiError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const msg = err.response?.data?.message
    if (typeof msg === 'string' && msg.trim()) {
      return sanitizeUserFacingMessage(msg, fallback)
    }
    if (err.response?.status === 503) {
      return 'Payments are temporarily unavailable. Please try again later or contact support.'
    }
  }
  if (err instanceof Error && err.message) {
    return sanitizeUserFacingMessage(err.message, fallback)
  }
  return fallback
}

async function rydRequest<T>(fn: () => Promise<{ data: RydEnvelope<T> }>, fallback: string): Promise<T> {
  try {
    return unwrap(await fn())
  } catch (err) {
    throw new Error(readRydApiError(err, fallback))
  }
}

export type PracticePlan = {
  id: number
  key: string
  name: string
  tagline?: string
  durationLabel?: string
  durationMonths?: number
  periodSuffix?: string
  features?: string[]
  billingCurrency?: string
  priceLabel?: string
  amountNgn?: number
  amountUsd?: number
  popular?: boolean
}

export type PracticeSubscriptionSummary = {
  subscribed: boolean
  showPaywall: boolean
  billingState: string
  canResume: boolean
  canUpgrade: boolean
  canResubscribe: boolean
  canSubscribeNew: boolean
  checkoutPlanKeys: string[]
  currentPlanKey: string | null
  cancelAtPeriodEnd: boolean
  accessEndsAt: string | null
}

export type LocationDefaults = {
  country: string
  state: string
  timezone: string
}

export function inferLocationDefaults(timezoneInput?: string | null): LocationDefaults {
  const timezone = timezoneInput?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  if (timezone === 'Africa/Lagos') {
    return { country: 'Nigeria', state: 'Lagos', timezone }
  }
  return { country: 'United States', state: 'California', timezone }
}

export async function resolveLocationDefaults(): Promise<LocationDefaults> {
  const fallback = inferLocationDefaults()
  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 1800)
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    window.clearTimeout(timer)
    if (!response.ok) return fallback
    const data = (await response.json()) as {
      country_name?: string
      region?: string
      timezone?: string
    }
    const timezone = String(data.timezone || fallback.timezone).trim() || fallback.timezone
    const country = String(data.country_name || fallback.country).trim() || fallback.country
    const state = String(data.region || fallback.state).trim() || fallback.state
    return { country, state, timezone }
  } catch {
    return fallback
  }
}

export const rydPracticeApi = {
  register: async (payload: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    country: string
    state: string
    timezone: string
  }) => {
    const res = await rydClient().post<RydEnvelope<{ token: string; subscribed: boolean }>>(
      '/parent/auth/register/practice',
      payload,
    )
    const data = unwrap(res)
    if (data.token) persistRydToken(data.token, true)
    return data
  },

  login: async (payload: { email: string; password: string; rememberMe?: boolean }) => {
    const res = await rydClient().post<RydEnvelope<{ token: string; subscribed: boolean }>>(
      '/parent/auth/login/practice',
      payload,
    )
    const data = unwrap(res)
    if (data.token) persistRydToken(data.token, payload.rememberMe !== false)
    return data
  },

  getSubscriptionStatus: async () => {
    const res = await rydClient(true).get<RydEnvelope<{ subscribed: boolean }>>(
      '/parent/practice/subscription/status',
    )
    return unwrap(res)
  },

  getSubscriptionSummary: async () => {
    const res = await rydClient(true).get<RydEnvelope<PracticeSubscriptionSummary>>(
      '/parent/practice/subscription/summary',
    )
    return unwrap(res)
  },

  getPlans: async () => {
    const res = await rydClient(true).get<
      RydEnvelope<{ monthly: PracticePlan | null; annual: PracticePlan | null; other: PracticePlan[] }>
    >('/parent/practice/subscription/plans')
    return unwrap(res)
  },

  /** No auth — for paywall display when billing token is missing or still linking. */
  getPublicPlans: async (country?: string) => {
    const res = await rydClient().get<
      RydEnvelope<{ monthly: PracticePlan | null; annual: PracticePlan | null; other: PracticePlan[] }>
    >('/common/practice/subscription/plans', {
      params: country ? { country } : undefined,
    })
    return unwrap(res)
  },

  checkParentEmailExists: async (email: string) => {
    const res = await rydClient().post<RydEnvelope<{ exists: boolean }>>(
      '/common/practice/parent-email-exists',
      { email: email.trim().toLowerCase() },
    )
    const data = unwrap(res)
    return Boolean(data.exists)
  },

  trackSubscribeIntent: async () => {
    await rydClient(true).post('/parent/practice/track/subscribe-intent', {})
  },

  createCheckout: async (payload: { planKey: string; successUrl: string; cancelUrl: string }) => {
    return rydRequest(
      () =>
        rydClient(true).post<RydEnvelope<{ url: string; checkoutUrl: string }>>(
          '/parent/practice/subscription/checkout',
          payload,
        ),
      'Could not start checkout',
    )
  },

  cancelSubscription: async (immediate = false) => {
    const res = await rydClient(true).post<RydEnvelope<unknown>>('/parent/practice/subscription/cancel', {
      immediate,
    })
    return unwrap(res)
  },

  resumeSubscription: async () => {
    const res = await rydClient(true).post<RydEnvelope<unknown>>('/parent/practice/subscription/resume', {})
    return unwrap(res)
  },

  updateProfile: async (payload: {
    firstName: string
    lastName: string
    phone?: string
    country: string
    state: string
    timezone: string
  }) => {
    const res = await rydClient(true).post<RydEnvelope<unknown>>('/parent/auth/profile-update', payload)
    return unwrap(res)
  },
}

export async function syncRydPracticeAccount(payload: {
  email: string
  password: string
  rememberMe?: boolean
  registerDefaults?: {
    firstName: string
    lastName: string
    phone?: string
    country: string
    state: string
    timezone: string
  }
}) {
  try {
    const data = await rydPracticeApi.login({
      email: payload.email,
      password: payload.password,
      rememberMe: payload.rememberMe,
    })
    clearBillingPasswordSync()
    return data
  } catch (loginErr) {
    if (!payload.registerDefaults) {
      throw loginErr instanceof Error ? loginErr : new Error('Practice billing login failed')
    }
    const exists = await rydPracticeApi.checkParentEmailExists(payload.email).catch(() => false)
    if (exists) {
      throw new Error(
        'You already have an account on RYD Learning or one of our apps. Please sign in instead of registering again.',
      )
    }
    try {
      const data = await rydPracticeApi.register({
        email: payload.email,
        password: payload.password,
        ...payload.registerDefaults,
      })
      clearBillingPasswordSync()
      return data
    } catch (registerErr) {
      const loginMsg = loginErr instanceof Error ? loginErr.message : 'Login failed'
      const registerMsg = registerErr instanceof Error ? registerErr.message : 'Register failed'
      const emailTaken =
        /email already/i.test(registerMsg) ||
        /already registered/i.test(registerMsg) ||
        /please login/i.test(registerMsg)
      if (emailTaken && /invalid email\/password/i.test(loginMsg)) {
        throw new Error(
          'This email is registered with RYD Learning, but the password does not match. Use your RYD Learning password, or reset it and sign in again.',
        )
      }
      throw new Error(registerMsg || loginMsg)
    }
  }
}

export function isAdminExplorePracticeUser(email?: string | null) {
  const e = String(email || '').toLowerCase()
  return e.startsWith('admin-practice-') && e.endsWith('@ryd-cbt.integration')
}
