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

/**
 * Resolve assigned practice id only from session storage or the dedicated
 * `/practice/assigned/:id` route — never from a normal `/practice/:id/take` URL.
 */
export function resolveAssignedPracticeId(pathname?: string): string | null {
  const stored = getAssignedPracticeId()
  if (stored) return stored
  if (!pathname) return null
  return pathname.match(/^\/practice\/assigned\/([^/]+)/)?.[1] ?? null
}

export function ensureAssignedPracticeId(practiceId: string | null | undefined) {
  if (practiceId?.trim()) setAssignedPracticeId(practiceId.trim())
}

/** True only when this session was entered as a parent-app assigned test. */
export function isAssignedPracticeUser(): boolean {
  return Boolean(getAssignedPracticeId())
}

export function isAssignedPracticePath(pathname: string): boolean {
  return pathname.startsWith('/practice/assigned/')
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
  return pathname ? isAssignedPracticePath(pathname) : false
}
