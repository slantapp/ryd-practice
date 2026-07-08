import { useLayoutEffect } from 'react'
import { useTheme } from '../context/ThemeContext'

const AUTH_ROUTE_CLASS = 'auth-route-active'

/** Auth screens always render in light theme for readability. */
export function useAuthLightTheme() {
  const { setTheme } = useTheme()

  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-app-theme', 'light')
    document.documentElement.classList.add(AUTH_ROUTE_CLASS)
    setTheme('light')

    return () => {
      document.documentElement.classList.remove(AUTH_ROUTE_CLASS)
    }
  }, [setTheme])
}
