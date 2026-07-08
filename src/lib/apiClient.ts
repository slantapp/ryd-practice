import axios from 'axios'

const PRODUCTION_API_URL = 'https://cbt-api.live.rydlearning.com/api'

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_CBT_API_URL?.trim()
  if (configured) return configured.replace(/\/$/, '')
  if (import.meta.env.PROD) return PRODUCTION_API_URL
  // Relative path uses Vite dev proxy (vite.config.ts → localhost:5001) and avoids CORS.
  return '/api'
}

export const API_BASE_URL = resolveApiBaseUrl()
export const TOKEN_STORAGE_KEY = 'practice-parent-token'

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY)
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem('practice-parent-user')
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearStoredAuth()
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const guestPaths = ['/signup', '/otp', '/forgot-password', '/reset-password']
        const isGuest = guestPaths.some((p) => window.location.pathname.startsWith(p))
        if (!isGuest && window.location.pathname !== '/') {
          window.location.assign('/login')
        }
      }
    }
    return Promise.reject(error)
  },
)

export function readApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Check your internet connection or try again later.'
    }
    const data = error.response.data as { error?: string; message?: string } | undefined
    const apiMessage = data?.error || data?.message
    return apiMessage || fallback
  }
  return fallback
}
