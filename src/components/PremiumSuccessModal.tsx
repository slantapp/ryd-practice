import { CheckCircle2, X } from 'lucide-react'
import { ModalPortal } from './ModalPortal'

interface PremiumSuccessModalProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
  actionLabel?: string
}

export function PremiumSuccessModal({
  open,
  title,
  message,
  onClose,
  actionLabel = 'Got it',
}: PremiumSuccessModalProps) {
  if (!open) return null

  return (
    <ModalPortal>
    <div className="premium-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="success-modal-title">
      <section className="premium-modal-card relative text-center">
        <button
          type="button"
          className="premium-modal-close absolute right-3 top-3"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div
          className="mx-auto grid h-12 w-12 place-items-center rounded-full"
          style={{
            background: 'color-mix(in srgb, #047857 18%, transparent)',
            color: '#047857',
          }}
        >
          <CheckCircle2 size={26} />
        </div>
        <h2 id="success-modal-title" className="premium-heading mt-4 text-xl font-bold">
          {title}
        </h2>
        <p className="premium-text-muted mt-2 text-sm">{message}</p>
        <button type="button" className="premium-btn-primary premium-btn-sm mt-6 rounded-lg px-5 py-2 font-semibold" onClick={onClose}>
          {actionLabel}
        </button>
      </section>
    </div>
    </ModalPortal>
  )
}
