import { useCallback, useEffect, useState } from 'react'
import type { BeforeInstallPromptEvent } from '../lib/pwa'
import {
  dismissPwaPrompt,
  isIosDevice,
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
    const onMobile = isMobileDevice() || isIosDevice()

    if (!onMobile || isStandaloneMode() || isPwaDismissed()) {
      return
    }

    const showBanner = () => setVisible(true)

    // Custom bottom banner for mobile devices; dismiss hides it for 7 days.
    showBanner()

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
  const onMobile = isMobileDevice() || onIos

  return {
    visible,
    canInstall: Boolean(deferredPrompt),
    showIosInstructions: onIos,
    preferSafari: onIos && !isIosSafari(),
    showAndroidFallback: onMobile && !onIos && !deferredPrompt,
    showDesktopFallback: !onMobile && !deferredPrompt,
    installing,
    install,
    dismiss,
  }
}
