import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { ModalPortal } from './ModalPortal'
import { DAY_LABELS_FULL } from '../lib/studyPlannerStorage'

const SUBJECTS = ['Mathematics', 'English', 'Basic Science', 'Civic Education', 'Mixed', 'Other']

export interface StudySessionFormState {
  title: string
  subject: string
  dayOfWeek: number
  startTime: string
  durationMins: number
  notes: string
}

interface StudySessionModalProps {
  open: boolean
  editing: boolean
  form: StudySessionFormState
  onChange: (form: StudySessionFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

export function StudySessionModal({ open, editing, form, onChange, onClose, onSubmit }: StudySessionModalProps) {
  if (!open) return null

  const inputClass = 'premium-input mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none'

  return (
    <ModalPortal>
    <div className="premium-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="study-session-title">
      <section className="premium-modal-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="premium-modal-close absolute right-4 top-4"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Study Planner</p>
        <h2 id="study-session-title" className="premium-heading mt-2 pr-10 text-xl font-bold">
          {editing ? 'Edit session' : 'New session'}
        </h2>
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="premium-text-muted block text-sm">
            Title
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              required
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="premium-text-muted text-sm">
              Subject
              <select
                className={inputClass}
                value={form.subject}
                onChange={(e) => onChange({ ...form, subject: e.target.value })}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="premium-text-muted text-sm">
              Day
              <select
                className={inputClass}
                value={form.dayOfWeek}
                onChange={(e) => onChange({ ...form, dayOfWeek: Number(e.target.value) })}
              >
                {DAY_LABELS_FULL.map((dayLabel, idx) => (
                  <option key={dayLabel} value={idx}>
                    {dayLabel}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="premium-text-muted text-sm">
              Start time
              <input
                type="time"
                className={inputClass}
                value={form.startTime}
                onChange={(e) => onChange({ ...form, startTime: e.target.value })}
              />
            </label>
            <label className="premium-text-muted text-sm">
              Duration (mins)
              <input
                type="number"
                min={15}
                max={180}
                step={15}
                className={inputClass}
                value={form.durationMins}
                onChange={(e) => onChange({ ...form, durationMins: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="premium-text-muted text-sm">
            Notes
            <textarea
              className={`${inputClass} min-h-[72px] resize-none`}
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="premium-btn-primary premium-btn-sm rounded-lg px-4 py-2 text-xs font-semibold">
              {editing ? 'Save changes' : 'Add session'}
            </button>
            <button type="button" onClick={onClose} className="premium-btn-secondary premium-btn-sm rounded-lg border px-4 py-2 text-xs">
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
    </ModalPortal>
  )
}
