import { useEffect, useState } from 'react'
import { Clock3, BookOpen, X } from 'lucide-react'
import { ModalPortal } from './ModalPortal'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeItem } from '../types'

interface PracticeStartModalProps {
  practice: PracticeItem | null
  open: boolean
  onClose: () => void
  onStart: () => void
}

export function PracticeStartModal({ practice, open, onClose, onStart }: PracticeStartModalProps) {
  const [details, setDetails] = useState<PracticeItem | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !practice?.id) {
      setDetails(null)
      return
    }
    setDetails(practice)
    setLoading(true)
    practiceApi
      .getPractice(practice.id)
      .then(setDetails)
      .catch(() => setDetails(practice))
      .finally(() => setLoading(false))
  }, [open, practice])

  if (!open || !practice) return null

  const questionCount = details?._count?.questions ?? practice._count?.questions ?? 0
  const estMins = Math.max(15, Math.round(questionCount * 1.5))

  return (
    <ModalPortal>
    <div className="premium-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="practice-start-title">
      <section className="premium-modal-card relative max-w-lg w-full">
        <button
          type="button"
          onClick={onClose}
          className="premium-modal-close absolute right-4 top-4"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Practice Session</p>
        <h2 id="practice-start-title" className="premium-heading mt-2 pr-10 text-xl font-bold">
          {details?.name || practice.name}
        </h2>
        {loading ? (
          <p className="premium-text-muted mt-3 text-sm">Loading details...</p>
        ) : (
          <>
            <p className="premium-text-muted mt-3 text-sm leading-relaxed">
              Review the session info below, then start when you are ready. You can pause and resume later from My
              Attempts.
            </p>
            <div
              className="my-5 h-px w-full"
              style={{ background: 'var(--premium-card-border)' }}
            />
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <BookOpen size={16} className="premium-accent shrink-0" />
                <span className="premium-text-muted">
                  <span className="font-semibold" style={{ color: 'var(--premium-text)' }}>
                    Subject:{' '}
                  </span>
                  {details?.subjectName || practice.subjectName}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="premium-accent grid h-4 w-4 shrink-0 place-items-center text-xs font-bold">C</span>
                <span className="premium-text-muted">
                  <span className="font-semibold" style={{ color: 'var(--premium-text)' }}>
                    Class:{' '}
                  </span>
                  {details?.classLabel || practice.classLabel}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Clock3 size={16} className="premium-accent shrink-0" />
                <span className="premium-text-muted">
                  <span className="font-semibold" style={{ color: 'var(--premium-text)' }}>
                    Questions:{' '}
                  </span>
                  {questionCount}
                  <span className="premium-text-soft"> · ~{estMins} mins estimated</span>
                </span>
              </li>
            </ul>
            <button type="button" className="premium-btn-primary premium-btn-sm mt-6 w-full rounded-lg px-3 py-2 text-xs font-semibold" onClick={onStart}>
              Start practice →
            </button>
          </>
        )}
      </section>
    </div>
    </ModalPortal>
  )
}
