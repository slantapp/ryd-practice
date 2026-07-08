import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type AppTheme = 'dark' | 'light'

const STORAGE_KEY = 'practice-app-theme'

interface ThemeContextValue {
  theme: AppTheme
  setTheme: (theme: AppTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readStoredTheme(): AppTheme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark') return 'dark'
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const stored = readStoredTheme()
    document.documentElement.setAttribute('data-app-theme', stored)
    return stored
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-app-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (next: AppTheme) => setThemeState(next)
  const toggleTheme = () => setThemeState((current) => (current === 'dark' ? 'light' : 'dark'))

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
