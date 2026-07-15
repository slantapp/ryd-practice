import { Download, Share, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '../hooks/usePwaInstall'

export function PwaInstallBanner() {
  const {
    visible,
    canInstall,
    showIosInstructions,
    installing,
    install,
    dismiss,
  } = usePwaInstall()

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-lg rounded-2xl border p-4 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:bottom-6"
      style={{
        borderColor: 'var(--premium-card-border)',
        background: 'var(--premium-menu-bg)',
        color: 'var(--premium-text)',
      }}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
    >
      <div className="flex items-start gap-3">
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: 'color-mix(in srgb, var(--premium-accent-strong) 25%, transparent)' }}
        >
          <Smartphone size={18} className="premium-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p id="pwa-install-title" className="text-sm font-semibold">
            Add RYD Practice to your home screen
          </p>
          <p id="pwa-install-desc" className="premium-text-muted mt-1 text-xs leading-relaxed">
            {showIosInstructions
              ? 'Open in one tap — no app store needed.'
              : 'Install for quick access from your phone home screen.'}
          </p>

          {showIosInstructions ? (
            <ol className="premium-text-muted mt-3 space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                <Share size={14} className="premium-accent shrink-0" />
                Tap Share in Safari
              </li>
              <li className="flex items-center gap-2">
                <Download size={14} className="premium-accent shrink-0" />
                Choose &quot;Add to Home Screen&quot;
              </li>
            </ol>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canInstall ? (
              <button
                type="button"
                onClick={() => void install()}
                disabled={installing}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--premium-accent-strong)' }}
              >
                {installing ? 'Installing…' : 'Install app'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="premium-text-muted rounded-xl px-3 py-2 text-xs font-medium transition hover:opacity-80"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="premium-text-soft shrink-0 rounded-lg p-1 transition hover:opacity-80"
          aria-label="Dismiss install prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
