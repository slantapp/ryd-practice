export const ASSIGNED_PRACTICE_ID_KEY = 'practice-assigned-id'

export function getAssignedPracticeId(): string | null {
  const id = sessionStorage.getItem(ASSIGNED_PRACTICE_ID_KEY)?.trim()
  return id || null
}

export function setAssignedPracticeId(practiceId: string) {
  const id = practiceId.trim()
  if (id) sessionStorage.setItem(ASSIGNED_PRACTICE_ID_KEY, id)
}

export function clearAssignedPracticeId() {
  sessionStorage.removeItem(ASSIGNED_PRACTICE_ID_KEY)
}

/** Resolve assigned practice id from session storage or current route. */
export function resolveAssignedPracticeId(pathname?: string): string | null {
  const stored = getAssignedPracticeId()
  if (stored) return stored
  if (!pathname) return null
  const fromAssigned = pathname.match(/^\/practice\/assigned\/([^/]+)/)?.[1]
  if (fromAssigned) return fromAssigned
  const fromTake = pathname.match(/^\/practice\/([^/]+)\/take/)?.[1]
  return fromTake || null
}

export function ensureAssignedPracticeId(practiceId: string | null | undefined) {
  if (practiceId?.trim()) setAssignedPracticeId(practiceId.trim())
}

export function isAssignedPracticeUser(): boolean {
  return Boolean(getAssignedPracticeId())
}

export function isAssignedPracticePath(pathname: string): boolean {
  return (
    pathname.startsWith('/practice/assigned/') ||
    /^\/practice\/[^/]+\/take/.test(pathname) ||
    pathname.startsWith('/practice/result/')
  )
}

export function isAllowedAssignedRoute(pathname: string): boolean {
  if (pathname === '/auth/redirect') return true
  if (pathname.startsWith('/practice/assigned/')) return true
  if (pathname.match(/^\/practice\/[^/]+\/take/)) return true
  if (pathname.startsWith('/practice/result/')) return true
  return false
}

export function getParentDashboardUrl(): string {
  const configured = import.meta.env.VITE_RYD_PARENT_APP_URL?.trim()
  const base = configured || (import.meta.env.DEV ? 'http://localhost:3001' : 'https://parent.rydlearning.com')
  return `${base.replace(/\/$/, '')}/parent/home`
}

export function goToParentDashboard(): void {
  window.location.href = getParentDashboardUrl()
}

export function isAssignedPracticeFlow(pathname?: string): boolean {
  if (getAssignedPracticeId()) return true
  return pathname ? isAssignedPracticePath(pathname) && pathname.startsWith('/practice/result/') : false
}
