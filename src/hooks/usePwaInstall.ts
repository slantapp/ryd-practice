import { useCallback, useEffect, useState } from 'react'
import type { BeforeInstallPromptEvent } from '../lib/pwa'
import {
  dismissPwaPrompt,
  isIosDevice,
  isIosSafari,
  isPwaDismissed,
  isStandaloneMode,
} from '../lib/pwa'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandaloneMode() || isPwaDismissed()) {
      return
    }

    const showBanner = () => setVisible(true)

    // iOS has no beforeinstallprompt — show Add to Home Screen instructions on all iOS browsers.
    if (isIosDevice()) {
      showBanner()
      return
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      showBanner()
    }

    const handleAppInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setVisible(false)
      }
    } finally {
      setInstalling(false)
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    dismissPwaPrompt()
    setVisible(false)
  }, [])

  const onIos = isIosDevice()

  return {
    visible,
    canInstall: Boolean(deferredPrompt),
    showIosInstructions: onIos,
    preferSafari: onIos && !isIosSafari(),
    installing,
    install,
    dismiss,
  }
}
