import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import {
  ensureAssignedPracticeId,
  getAssignedPracticeId,
  isAssignedPracticePath,
  resolveAssignedPracticeId,
} from '../lib/assignedPracticeFlow'
import {
  getStoredRydToken,
  isAdminExplorePracticeUser,
  RYD_BILLING_PW_KEY,
  rydPracticeApi,
  sanitizeUserFacingMessage,
  syncRydPracticeAccount,
  type PracticePlan,
  type PracticeSubscriptionSummary,
} from '../lib/rydApi'
import { useAuth } from './AuthContext'

interface SubscriptionContextValue {
  loading: boolean
  checkoutBusy: boolean
  plansLoading: boolean
  subscribed: boolean
  exempt: boolean
  summary: PracticeSubscriptionSummary | null
  plans: { monthly: PracticePlan | null; annual: PracticePlan | null }
  plansError: string | null
  billingError: string | null
  refresh: () => Promise<void>
  startCheckout: (planKey: 'monthly' | 'annual') => Promise<void>
  showPaywall: boolean
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined)

function registerDefaultsFromUser(
  user: { firstName?: string; lastName?: string; phone?: string | null },
  profileExtras: { country?: string; state?: string; timezone?: string } | null,
) {
  return {
    firstName: user.firstName?.trim() || 'Practice',
    lastName: user.lastName?.trim() || 'Student',
    phone: user.phone?.trim() || undefined,
    country: profileExtras?.country?.trim() || 'Nigeria',
    state: profileExtras?.state?.trim() || 'Lagos',
    timezone: profileExtras?.timezone?.trim() || 'Africa/Lagos',
  }
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, profileExtras } = useAuth()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [checkoutBusy, setCheckoutBusy] = useState(false)
  const [plansLoading, setPlansLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [summary, setSummary] = useState<PracticeSubscriptionSummary | null>(null)
  const [plans, setPlans] = useState<{ monthly: PracticePlan | null; annual: PracticePlan | null }>({
    monthly: null,
    annual: null,
  })
  const [plansError, setPlansError] = useState<string | null>(null)
  const [billingError, setBillingError] = useState<string | null>(null)

  const assignedPracticeId = resolveAssignedPracticeId(location.pathname)
  if (assignedPracticeId) {
    ensureAssignedPracticeId(assignedPracticeId)
  }
  const assignedFlow =
    Boolean(assignedPracticeId || getAssignedPracticeId()) || isAssignedPracticePath(location.pathname)
  const adminExplore = isAdminExplorePracticeUser(user?.email)
  const packageStudent = Boolean(user?.email?.toLowerCase().endsWith('@ryd-cbt.integration'))
  const exempt = assignedFlow || adminExplore || packageStudent

  const refresh = useCallback(async () => {
    if (!user || exempt) {
      setSubscribed(exempt)
      setSummary(null)
      setPlansError(null)
      setBillingError(null)
      setPlansLoading(false)
      setLoading(false)
      return
    }

    setPlansLoading(true)
    setPlansError(null)
    try {
      const country = profileExtras?.country
      const planData = await rydPracticeApi.getPublicPlans(country)
      setPlans({ monthly: planData.monthly, annual: planData.annual })
    } catch (err) {
      setPlans({ monthly: null, annual: null })
      setPlansError(
        sanitizeUserFacingMessage(
          err instanceof Error ? err.message : '',
          'Subscription plans are not available right now. Please try again shortly.',
        ),
      )
    } finally {
      setPlansLoading(false)
    }

    let token = getStoredRydToken()
    setBillingError(null)

    if (!token) {
      const password = sessionStorage.getItem(RYD_BILLING_PW_KEY)
      if (password && user.email) {
        try {
          await syncRydPracticeAccount({
            email: user.email,
            password,
            registerDefaults: registerDefaultsFromUser(user, profileExtras),
          })
          token = getStoredRydToken()
        } catch (err) {
          setBillingError(
            sanitizeUserFacingMessage(
              err instanceof Error ? err.message : '',
              'We could not connect your billing account. Please log out, sign in again, and retry.',
            ),
          )
        }
      } else {
        setBillingError('We could not connect your billing account. Please log out, sign in again, and retry.')
      }
    }

    if (!token) {
      setSubscribed(false)
      setSummary(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [status, summaryData] = await Promise.all([
        rydPracticeApi.getSubscriptionStatus(),
        rydPracticeApi.getSubscriptionSummary(),
      ])
      setSubscribed(Boolean(status.subscribed))
      setSummary(summaryData)
      setBillingError(null)
    } catch (err) {
      setSubscribed(false)
      setSummary(null)
      setBillingError(
        sanitizeUserFacingMessage(
          err instanceof Error ? err.message : '',
          'We could not verify your subscription status. Please try again.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [user, exempt, profileExtras, location.pathname])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const startCheckout = useCallback(
    async (planKey: 'monthly' | 'annual') => {
      setCheckoutBusy(true)
      try {
        let token = getStoredRydToken()
        if (!token && user?.email) {
          const password = sessionStorage.getItem(RYD_BILLING_PW_KEY)
          if (password) {
            await syncRydPracticeAccount({
              email: user.email,
              password,
              registerDefaults: registerDefaultsFromUser(user, profileExtras),
            })
            token = getStoredRydToken()
            setBillingError(null)
          }
        }
        if (!token) {
          throw new Error('We could not connect your billing account. Please log out, sign in again, and retry.')
        }
        await rydPracticeApi.trackSubscribeIntent()
        const origin = window.location.origin
        const session = await rydPracticeApi.createCheckout({
          planKey,
          successUrl: `${origin}/dashboard?practiceSubscription=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/dashboard?practiceSubscription=cancelled`,
        })
        const url = session.checkoutUrl || session.url
        if (!url) throw new Error('Checkout URL missing')
        window.location.href = url
      } catch (err) {
        setCheckoutBusy(false)
        throw err
      }
    },
    [user, profileExtras],
  )

  const showPaywall = Boolean(user && !exempt && !loading && !subscribed)

  const value = useMemo(
    () => ({
      loading,
      checkoutBusy,
      plansLoading,
      subscribed: exempt || subscribed,
      exempt,
      summary,
      plans,
      plansError,
      billingError,
      refresh,
      startCheckout,
      showPaywall,
    }),
    [
      loading,
      checkoutBusy,
      plansLoading,
      subscribed,
      exempt,
      summary,
      plans,
      plansError,
      billingError,
      refresh,
      startCheckout,
      showPaywall,
    ],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function usePracticeSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) {
    throw new Error('usePracticeSubscription must be used within SubscriptionProvider')
  }
  return ctx
}
