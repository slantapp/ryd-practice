import { Download, MoreVertical, Share, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '../hooks/usePwaInstall'

export function PwaInstallBanner() {
  const {
    visible,
    canInstall,
    showIosInstructions,
    preferSafari,
    showAndroidFallback,
    showDesktopFallback,
    installing,
    install,
    dismiss,
  } = usePwaInstall()

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-6"
      style={{
        borderColor: 'var(--premium-card-border, rgba(176, 67, 143, 0.2))',
        background: 'var(--premium-menu-bg, #ffffff)',
        color: 'var(--premium-text, #1f1524)',
      }}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--premium-accent-strong, #b0438f) 25%, transparent)' }}
        >
          <Smartphone size={18} className="premium-accent" style={{ color: 'var(--premium-accent, #9a3a7f)' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p id="pwa-install-title" className="text-sm font-semibold">
            Add RYD Practice to your home screen
          </p>
          <p id="pwa-install-desc" className="premium-text-muted mt-1 text-xs leading-relaxed" style={{ color: 'var(--premium-text-muted, rgba(31,21,36,0.72))' }}>
            {showIosInstructions
              ? preferSafari
                ? 'For the best install experience, open this page in Safari first.'
                : 'Open in one tap — no app store needed.'
              : canInstall
                ? 'Install for quick access from your home screen.'
                : 'Add this site from your browser menu for quick access.'}
          </p>

          {showIosInstructions ? (
            <ol className="mt-3 space-y-1.5 text-xs" style={{ color: 'var(--premium-text-muted, rgba(31,21,36,0.72))' }}>
              {preferSafari ? (
                <li className="flex items-center gap-2">
                  <Smartphone size={14} className="shrink-0" style={{ color: 'var(--premium-accent, #9a3a7f)' }} />
                  Open this site in Safari
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <Share size={14} className="shrink-0" style={{ color: 'var(--premium-accent, #9a3a7f)' }} />
                Tap Share in Safari
              </li>
              <li className="flex items-center gap-2">
                <Download size={14} className="shrink-0" style={{ color: 'var(--premium-accent, #9a3a7f)' }} />
                Choose &quot;Add to Home Screen&quot;
              </li>
            </ol>
          ) : null}

          {showAndroidFallback ? (
            <ol className="mt-3 space-y-1.5 text-xs" style={{ color: 'var(--premium-text-muted, rgba(31,21,36,0.72))' }}>
              <li className="flex items-center gap-2">
                <MoreVertical size={14} className="shrink-0" style={{ color: 'var(--premium-accent, #9a3a7f)' }} />
                Tap the browser menu (⋮)
              </li>
              <li className="flex items-center gap-2">
                <Download size={14} className="shrink-0" style={{ color: 'var(--premium-accent, #9a3a7f)' }} />
                Choose &quot;Install app&quot; or &quot;Add to Home screen&quot;
              </li>
            </ol>
          ) : null}

          {showDesktopFallback ? (
            <p className="mt-3 text-xs" style={{ color: 'var(--premium-text-muted, rgba(31,21,36,0.72))' }}>
              In Chrome, click the install icon in the address bar, or open the browser menu and choose Install app.
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                disabled={installing}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--premium-accent-strong, #b0438f)' }}
              >
                {installing ? 'Installing…' : 'Install app'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="rounded-xl px-3 py-2 text-xs font-medium transition hover:opacity-80"
              style={{ color: 'var(--premium-text-muted, rgba(31,21,36,0.72))' }}
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 transition hover:opacity-80"
          style={{ color: 'var(--premium-text-soft, rgba(31,21,36,0.58))' }}
          aria-label="Dismiss install prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
