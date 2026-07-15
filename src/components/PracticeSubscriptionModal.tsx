import { useState } from 'react'
import { AlertCircle, AlertTriangle, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usePracticeSubscription } from '../context/SubscriptionContext'
import { sanitizeUserFacingMessage } from '../lib/rydApi'

function SubscriptionAlert({
  variant,
  title,
  message,
}: {
  variant: 'warning' | 'error'
  title: string
  message: string
}) {
  const Icon = variant === 'warning' ? AlertTriangle : AlertCircle
  return (
    <div className={`practice-subscription-alert practice-subscription-alert--${variant}`} role="alert">
      <span className="practice-subscription-alert__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={2.25} />
      </span>
      <div className="practice-subscription-alert__body">
        <p className="practice-subscription-alert__title">{title}</p>
        <p className="practice-subscription-alert__message">{message}</p>
      </div>
    </div>
  )
}

export function PracticeSubscriptionModal() {
  const { signOut } = useAuth()
  const {
    showPaywall,
    plans,
    plansLoading,
    plansError,
    billingError,
    startCheckout,
    checkoutBusy,
    refresh,
  } = usePracticeSubscription()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkoutPlan, setCheckoutPlan] = useState<'monthly' | 'annual' | null>(null)

  if (!showPaywall) return null

  const monthly = plans.monthly
  const annual = plans.annual
  const planOptions = [
    monthly ? { key: 'monthly' as const, plan: monthly } : null,
    annual ? { key: 'annual' as const, plan: annual } : null,
  ].filter(Boolean) as Array<{ key: 'monthly' | 'annual'; plan: NonNullable<typeof monthly> }>

  const handleCheckout = async (planKey: 'monthly' | 'annual') => {
    setCheckoutError(null)
    setCheckoutPlan(planKey)
    const started = Date.now()
    try {
      await startCheckout(planKey)
    } catch (err) {
      const elapsed = Date.now() - started
      if (elapsed < 450) {
        await new Promise((resolve) => window.setTimeout(resolve, 450 - elapsed))
      }
      setCheckoutError(
        sanitizeUserFacingMessage(
          err instanceof Error ? err.message : '',
          'We could not start checkout. Please try again.',
        ),
      )
      setCheckoutPlan(null)
    }
  }

  const isCheckingOut = checkoutBusy || checkoutPlan !== null

  return (
    <div className="premium-modal-backdrop z-[100]" role="dialog" aria-modal="true" aria-labelledby="practice-sub-title">
      <section className="premium-modal-card practice-subscription-modal relative w-full max-w-lg">
        <button
          type="button"
          className="practice-subscription-logout"
          onClick={() => signOut()}
          disabled={isCheckingOut}
        >
          <LogOut size={15} aria-hidden="true" />
          Log out
        </button>

        {isCheckingOut ? (
          <div className="practice-subscription-loading" role="status" aria-live="polite">
            <span className="practice-subscription-spinner" aria-hidden="true" />
            <p className="premium-heading mt-4 text-sm font-semibold">Preparing secure checkout…</p>
            <p className="premium-text-muted mt-1 text-xs">You will be redirected to complete payment shortly.</p>
          </div>
        ) : null}

        <div className={isCheckingOut ? 'pointer-events-none opacity-40' : undefined}>
          <div className="text-center practice-subscription-intro">
            <p className="premium-accent text-[11px] font-semibold uppercase tracking-[0.2em]">RYD Practice</p>
            <h2 id="practice-sub-title" className="premium-heading mt-2 text-2xl font-bold">
              Unlock full access
            </h2>
            <p className="premium-text-muted mt-2 text-sm leading-relaxed">
              Subscribe for the full practice catalog, attempts, leaderboard, and study tools.
            </p>
          </div>

          {billingError ? (
            <SubscriptionAlert
              variant="warning"
              title="Account connection needed"
              message={billingError}
            />
          ) : null}

          {plansLoading ? (
            <p className="premium-text-muted mt-8 text-center text-sm">Loading plans…</p>
          ) : null}

          {!plansLoading && planOptions.length > 0 ? (
            <div className="mt-8 space-y-3">
              {planOptions.map(({ key, plan }) => {
                const isAnnual = key === 'annual'
                const isBusy = checkoutPlan === key
                return (
                  <article
                    key={key}
                    className={`practice-subscription-plan rounded-2xl border p-4 ${
                      isAnnual ? 'practice-subscription-plan--featured' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                      <div className="min-w-0 text-left">
                        <p className="premium-accent text-xs font-semibold uppercase tracking-wide">
                          {isAnnual ? 'Annual' : 'Monthly'}
                          {isAnnual && plan.popular ? (
                            <span className="premium-text-muted ml-2 normal-case tracking-normal">· Best value</span>
                          ) : null}
                        </p>
                        <p className="premium-heading mt-1 text-2xl font-bold">{plan.priceLabel}</p>
                        <p className="premium-text-muted mt-1 text-sm">
                          {plan.tagline || (isAnnual ? 'Save with annual billing' : 'Flexible monthly billing')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="premium-btn-primary w-full shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60 sm:w-auto"
                        disabled={isCheckingOut}
                        onClick={() => void handleCheckout(key)}
                      >
                        {isBusy ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="practice-subscription-spinner practice-subscription-spinner--inline" aria-hidden="true" />
                            Starting…
                          </span>
                        ) : (
                          'Subscribe'
                        )}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : null}

          {!plansLoading && planOptions.length === 0 ? (
            <div className="mt-8">
              <SubscriptionAlert
                variant="error"
                title="Plans unavailable"
                message={
                  plansError || 'Subscription plans are not available yet. Please try again shortly.'
                }
              />
              <div className="mt-4 text-center">
                <button
                  type="button"
                  className="premium-btn-secondary rounded-xl px-4 py-2 text-sm font-semibold"
                  onClick={() => void refresh()}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {checkoutError ? (
            <SubscriptionAlert variant="error" title="Checkout unavailable" message={checkoutError} />
          ) : null}
        </div>
      </section>
    </div>
  )
}

export function PracticeSubscriptionGate({ children }: { children: React.ReactNode }) {
  const { showPaywall } = usePracticeSubscription()
  return (
    <>
      {children}
      <PracticeSubscriptionModal />
      {showPaywall ? (
        <div className="pointer-events-none fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]" aria-hidden />
      ) : null}
    </>
  )
}
