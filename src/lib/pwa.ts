const DISMISS_KEY = 'ryd-practice-pwa-dismissed'
const DISMISS_DAYS = 7

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  )
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
}

export function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIos = /iPhone|iPad|iPod/i.test(ua)
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
  return isIos && isSafari
}

export function isPwaDismissed(): boolean {
  if (typeof window === 'undefined') return true
  const raw = window.localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const dismissedAt = Number(raw)
  if (Number.isNaN(dismissedAt)) return false
  const elapsedMs = Date.now() - dismissedAt
  return elapsedMs < DISMISS_DAYS * 24 * 60 * 60 * 1000
}

export function dismissPwaPrompt(): void {
  window.localStorage.setItem(DISMISS_KEY, String(Date.now()))
}
