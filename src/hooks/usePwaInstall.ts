import { useCallback, useEffect, useState } from 'react'
import type { BeforeInstallPromptEvent } from '../lib/pwa'
import {
  dismissPwaPrompt,
  isIosSafari,
  isMobileDevice,
  isPwaDismissed,
  isStandaloneMode,
} from '../lib/pwa'

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (isStandaloneMode() || isPwaDismissed() || !isMobileDevice()) {
      return
    }

    const showBanner = () => setVisible(true)

    if (isIosSafari()) {
      showBanner()
      return
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      showBanner()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
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

  return {
    visible,
    canInstall: Boolean(deferredPrompt),
    showIosInstructions: isIosSafari(),
    installing,
    install,
    dismiss,
  }
}
