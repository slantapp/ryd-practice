import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { ModalPortal } from './ModalPortal'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: 'default' | 'danger'
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <ModalPortal>
    <div className="premium-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <section className="premium-modal-card relative max-w-md w-full">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="premium-modal-close absolute right-4 top-4"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Confirm</p>
        <h2 id="confirm-dialog-title" className="premium-heading mt-2 pr-8 text-xl font-bold">
          {title}
        </h2>
        <div className="premium-text-muted mt-3 text-sm leading-relaxed">{description}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={
              variant === 'danger'
                ? 'flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50'
                : 'premium-btn-primary flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50'
            }
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="premium-btn-secondary rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </section>
    </div>
    </ModalPortal>
  )
}
