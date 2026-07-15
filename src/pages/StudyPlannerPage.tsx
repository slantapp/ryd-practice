import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  Plus,
  Target,
  Trash2,
} from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { StudySessionModal } from '../components/StudySessionModal'
import { useAuth } from '../context/AuthContext'
import { studyPlannerApi } from '../lib/api'
import {
  completedMins,
  DAY_LABELS,
  DAY_LABELS_FULL,
  formatTime12,
  loadPlannerData,
  savePlannerDataLocal,
  sessionEndTime,
  subjectStyle,
  totalScheduledMins,
} from '../lib/studyPlannerStorage'
import type { StudyPlannerData, StudySession } from '../types'

type SessionFilter = 'all' | 'scheduled' | 'completed'

const emptyForm = {
  title: '',
  subject: 'Mathematics',
  dayOfWeek: new Date().getDay(),
  startTime: '16:00',
  durationMins: 45,
  notes: '',
}

export function StudyPlannerPage() {
  const { user } = useAuth()
  const userId = user?.id || user?.email || 'guest'
  const [planner, setPlanner] = useState<StudyPlannerData>(() => loadPlannerData(userId))
  const [plannerLoading, setPlannerLoading] = useState(true)
  const [plannerError, setPlannerError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all')

  const persist = useCallback(
    (next: StudyPlannerData) => {
      const payload = { ...next, updatedAt: new Date().toISOString() }
      setPlanner(payload)
      savePlannerDataLocal(userId, payload)
      void studyPlannerApi.save(payload).catch(() => {
        setPlannerError('Could not sync planner to server. Changes are saved locally.')
      })
    },
    [userId],
  )

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setPlannerLoading(true)
      setPlannerError('')
      try {
        const remote = await studyPlannerApi.get()
        if (!cancelled) {
          setPlanner(remote)
          savePlannerDataLocal(userId, remote)
        }
      } catch {
        if (!cancelled) {
          setPlanner(loadPlannerData(userId))
        }
      } finally {
        if (!cancelled) setPlannerLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  const todayIndex = new Date().getDay()
  const scheduledMins = totalScheduledMins(planner.sessions)
  const doneMins = completedMins(planner.sessions)
  const goalMins = planner.weeklyGoalHours * 60
  const progressPct = goalMins > 0 ? Math.min(100, Math.round((doneMins / goalMins) * 100)) : 0

  const todaySessions = useMemo(
    () =>
      planner.sessions
        .filter((s) => s.dayOfWeek === todayIndex)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [planner.sessions, todayIndex],
  )

  const sessionsByDay = useMemo(() => {
    const map: Record<number, StudySession[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
    planner.sessions.forEach((s) => {
      map[s.dayOfWeek].push(s)
    })
    Object.values(map).forEach((list) => list.sort((a, b) => a.startTime.localeCompare(b.startTime)))
    return map
  }, [planner.sessions])

  const filteredSessions = useMemo(() => {
    const list = [...planner.sessions].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
    )
    if (sessionFilter === 'scheduled') return list.filter((s) => s.status !== 'completed')
    if (sessionFilter === 'completed') return list.filter((s) => s.status === 'completed')
    return list
  }, [planner.sessions, sessionFilter])

  const sessionsGroupedByDay = useMemo(() => {
    const groups: { dayIndex: number; sessions: StudySession[]; totalMins: number }[] = []
    for (let day = 0; day < 7; day += 1) {
      const daySessions = filteredSessions.filter((s) => s.dayOfWeek === day)
      if (daySessions.length === 0) continue
      groups.push({
        dayIndex: day,
        sessions: daySessions,
        totalMins: daySessions.reduce((sum, s) => sum + s.durationMins, 0),
      })
    }
    return groups
  }, [filteredSessions])

  const weekSessionCount = planner.sessions.length
  const weekCompletedCount = planner.sessions.filter((s) => s.status === 'completed').length

  const openAddForm = (day?: number) => {
    setEditingId(null)
    setForm({ ...emptyForm, dayOfWeek: day ?? todayIndex })
    setShowForm(true)
  }

  const openEditForm = (session: StudySession) => {
    setEditingId(session.id)
    setForm({
      title: session.title,
      subject: session.subject,
      dayOfWeek: session.dayOfWeek,
      startTime: session.startTime,
      durationMins: session.durationMins,
      notes: session.notes,
    })
    setShowForm(true)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) return
    const payload: StudySession = {
      id: editingId || `s-${Date.now()}`,
      title: form.title.trim(),
      subject: form.subject,
      dayOfWeek: form.dayOfWeek,
      startTime: form.startTime,
      durationMins: Number(form.durationMins) || 30,
      notes: form.notes.trim(),
      status: editingId
        ? planner.sessions.find((s) => s.id === editingId)?.status || 'scheduled'
        : 'scheduled',
    }
    const sessions = editingId
      ? planner.sessions.map((s) => (s.id === editingId ? payload : s))
      : [...planner.sessions, payload]
    persist({ ...planner, sessions })
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const toggleComplete = (id: string) => {
    const sessions = planner.sessions.map((s) =>
      s.id === id
        ? ({ ...s, status: s.status === 'completed' ? 'scheduled' : 'completed' } as StudySession)
        : s,
    )
    persist({ ...planner, sessions })
  }

  const removeSession = (id: string) => {
    persist({ ...planner, sessions: planner.sessions.filter((s) => s.id !== id) })
  }

  const updateWeeklyGoal = (hours: number) => {
    persist({ ...planner, weeklyGoalHours: Math.max(1, Math.min(40, hours)) })
  }

  return (
    <PremiumAppShell>
      <div className="space-y-5">
        {plannerError ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            {plannerError}
          </p>
        ) : null}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-hero-gradient rounded-3xl border p-4 shadow-2xl sm:p-6 md:p-7"
        >
          <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Study Planner</p>
          <h1 className="premium-heading mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">Plan your week</h1>
          <p className="premium-text-muted mt-2 max-w-2xl">
            Schedule subjects, track completion, and hit your weekly study target. Your plan syncs to your account.
          </p>
          <button
            type="button"
            onClick={() => openAddForm()}
            disabled={plannerLoading}
            className="premium-btn-primary premium-btn-sm mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            <Plus size={16} />
            {plannerLoading ? 'Loading planner...' : 'Add Study Session'}
          </button>
        </motion.section>

        <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          {[
            { label: 'Weekly Goal', value: `${planner.weeklyGoalHours}h`, icon: Target },
            { label: 'Scheduled', value: `${Math.round(scheduledMins / 60)}h ${scheduledMins % 60}m`, icon: CalendarDays },
            { label: 'Completed', value: `${Math.round(doneMins / 60)}h ${doneMins % 60}m`, icon: CheckCircle2 },
            { label: 'Progress', value: `${progressPct}%`, icon: Clock3 },
          ].map((card) => (
            <div key={card.label} className="premium-card rounded-2xl border p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="premium-text-soft min-w-0 text-[10px] leading-snug sm:text-xs">{card.label}</p>
                <card.icon size={14} className="premium-accent mt-0.5 shrink-0" />
              </div>
              <h3 className="premium-stat mt-1.5 text-lg font-bold sm:mt-2 sm:text-2xl">{card.value}</h3>
            </div>
          ))}
        </section>

        <section className="premium-card rounded-2xl border p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="premium-heading text-base font-semibold sm:text-lg">Weekly goal</h3>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                type="range"
                min={4}
                max={24}
                value={planner.weeklyGoalHours}
                onChange={(e) => updateWeeklyGoal(Number(e.target.value))}
                className="w-full accent-[#b0438f] sm:w-40"
              />
              <span className="premium-accent shrink-0 text-sm">{planner.weeklyGoalHours} hours / week</span>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#b0438f] to-[#d05ac0] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="premium-text-soft mt-2 text-xs">
            {weekCompletedCount} of {weekSessionCount} session{weekSessionCount === 1 ? '' : 's'} completed this week
          </p>
        </section>

        {/* Weekly schedule — redesigned */}
        <section className="premium-card rounded-2xl border p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="premium-heading text-base font-semibold sm:text-lg">Weekly schedule</h3>
              <p className="premium-text-soft mt-1 text-sm">
                Tap a session to edit · use + on any day to add
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="premium-text-soft">Today</span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d05ac0] ring-2 ring-[#d05ac0]/40" />
            </div>
          </div>

          {/* Mobile: stacked day cards (no sideways scroll) */}
          <div className="space-y-3 md:hidden">
            {DAY_LABELS.map((label, dayIndex) => {
              const daySessions = sessionsByDay[dayIndex]
              const isToday = dayIndex === todayIndex
              const dayMins = daySessions.reduce((sum, s) => sum + s.durationMins, 0)

              return (
                <div
                  key={`mobile-${label}`}
                  className={`rounded-2xl border p-3 transition-colors planner-week-card ${
                    isToday ? 'border-[#d05ac0]/50 bg-[#b0438f]/10 shadow-[0_0_24px_rgba(176,67,143,0.12)]' : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isToday ? 'premium-accent' : 'premium-text-soft'
                        }`}
                      >
                        {label}
                        {isToday ? ' · Today' : ''}
                      </p>
                      <p className={`text-sm font-semibold ${isToday ? 'premium-heading' : 'premium-text-muted'}`}>
                        {DAY_LABELS_FULL[dayIndex]}
                        {daySessions.length > 0 ? (
                          <span className="premium-text-soft font-normal">
                            {' '}
                            · {daySessions.length} session{daySessions.length === 1 ? '' : 's'} · {dayMins}m
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddForm(dayIndex)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border premium-inset premium-text-soft transition hover:border-[#d05ac0]/40 hover:text-[#d05ac0]"
                      style={{ borderColor: 'var(--premium-card-border)' }}
                      aria-label={`Add session on ${DAY_LABELS_FULL[dayIndex]}`}
                    >
                      <Plus size={14} className="shrink-0" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {daySessions.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openAddForm(dayIndex)}
                        className="planner-empty-slot flex items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-center transition"
                      >
                        <Plus size={14} className="premium-text-soft" />
                        <span className="premium-text-soft text-xs">Free day — tap to schedule</span>
                      </button>
                    ) : (
                      daySessions.map((session) => (
                        <WeekDaySessionCard
                          key={session.id}
                          session={session}
                          onEdit={() => openEditForm(session)}
                          onToggle={() => toggleComplete(session.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tablet/desktop: 7-day week board */}
          <div className="-mx-1 hidden overflow-x-auto pb-1 md:block">
            <div className="grid min-w-[840px] grid-cols-7 gap-2">
              {DAY_LABELS.map((label, dayIndex) => {
                const daySessions = sessionsByDay[dayIndex]
                const isToday = dayIndex === todayIndex
                const dayMins = daySessions.reduce((sum, s) => sum + s.durationMins, 0)

                return (
                  <div
                    key={label}
                    className={`flex min-h-[220px] flex-col rounded-2xl border p-2 transition-colors planner-week-card ${
                      isToday ? 'border-[#d05ac0]/50 bg-[#b0438f]/10 shadow-[0_0_24px_rgba(176,67,143,0.12)]' : ''
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-1 px-0.5">
                      <div>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isToday ? 'premium-accent' : 'premium-text-soft'
                          }`}
                        >
                          {label}
                        </p>
                        <p className={`text-xs font-semibold ${isToday ? 'premium-heading' : 'premium-text-muted'}`}>
                          {DAY_LABELS_FULL[dayIndex].slice(0, 3)}
                        </p>
                        {daySessions.length > 0 && (
                          <p className="premium-text-soft mt-0.5 text-[10px]">
                            {daySessions.length} · {dayMins}m
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => openAddForm(dayIndex)}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border premium-inset premium-text-soft transition hover:border-[#d05ac0]/40 hover:text-[#d05ac0]"
                        style={{ borderColor: 'var(--premium-card-border)' }}
                        aria-label={`Add session on ${DAY_LABELS_FULL[dayIndex]}`}
                      >
                        <Plus size={12} className="shrink-0" />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5">
                      {daySessions.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => openAddForm(dayIndex)}
                          className="planner-empty-slot flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-2 py-4 text-center transition"
                        >
                          <Plus size={14} className="mb-1 premium-text-soft" />
                          <span className="premium-text-soft text-[10px]">Free</span>
                        </button>
                      ) : (
                        daySessions.map((session) => (
                          <WeekDaySessionCard
                            key={session.id}
                            session={session}
                            onEdit={() => openEditForm(session)}
                            onToggle={() => toggleComplete(session.id)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="premium-card rounded-2xl border p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="premium-heading text-lg font-semibold">Today — {DAY_LABELS_FULL[todayIndex]}</h3>
            <span className="premium-accent rounded-full bg-[#b0438f]/20 px-2.5 py-0.5 text-xs font-medium">
              {todaySessions.length} session{todaySessions.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {todaySessions.length === 0 ? (
              <div className="premium-inset rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--premium-card-border)' }}>
                <BookOpen size={22} className="premium-text-soft mx-auto mb-2" />
                <p className="premium-text-muted text-sm">No sessions today</p>
                <button
                  type="button"
                  onClick={() => openAddForm(todayIndex)}
                  className="planner-schedule-link"
                >
                  Schedule one now
                </button>
              </div>
            ) : (
              todaySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onToggle={() => toggleComplete(session.id)}
                  onEdit={() => openEditForm(session)}
                  onDelete={() => removeSession(session.id)}
                />
              ))
            )}
          </div>
        </section>

        <StudySessionModal
          open={showForm}
          editing={!!editingId}
          form={form}
          onChange={setForm}
          onClose={() => {
            setShowForm(false)
            setEditingId(null)
            setForm(emptyForm)
          }}
          onSubmit={handleSubmit}
        />

        {/* All sessions — grouped by day */}
        <section className="premium-card rounded-2xl border p-4 sm:p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="premium-heading text-lg font-semibold">All sessions</h3>
              <p className="premium-text-soft mt-1 text-sm">Grouped by day · sorted by start time</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'all' as const, label: 'All' },
                  { id: 'scheduled' as const, label: 'Upcoming' },
                  { id: 'completed' as const, label: 'Done' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSessionFilter(tab.id)}
                  className={`premium-pill-compact rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                    sessionFilter === tab.id ? 'premium-pill-active' : 'premium-pill'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="premium-inset rounded-xl border border-dashed border-white/10 p-5 text-center sm:p-8">
              <CalendarDays size={28} className="premium-text-soft mx-auto mb-2" />
              <p className="premium-text-muted text-sm">
                {sessionFilter === 'all'
                  ? 'No study sessions yet. Add your first session to build your week.'
                  : `No ${sessionFilter === 'completed' ? 'completed' : 'upcoming'} sessions.`}
              </p>
              {sessionFilter === 'all' && (
                <button
                  type="button"
                  onClick={() => openAddForm()}
                  className="premium-btn-primary premium-btn-sm mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  Add Session
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {sessionsGroupedByDay.map(({ dayIndex, sessions, totalMins }) => (
                <div key={dayIndex}>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-lg text-[10px] font-bold planner-day-badge ${
                        dayIndex === todayIndex ? 'is-today' : ''
                      }`}
                    >
                      {DAY_LABELS[dayIndex]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="premium-heading font-semibold">
                        {DAY_LABELS_FULL[dayIndex]}
                        {dayIndex === todayIndex && (
                          <span className="premium-accent ml-2 text-xs font-medium">Today</span>
                        )}
                      </p>
                      <p className="premium-text-soft text-xs">
                        {sessions.length} session{sessions.length === 1 ? '' : 's'} · {totalMins} min total
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        compact
                        onToggle={() => toggleComplete(session.id)}
                        onEdit={() => openEditForm(session)}
                        onDelete={() => removeSession(session.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PremiumAppShell>
  )
}

function WeekDaySessionCard({
  session,
  onEdit,
  onToggle,
}: {
  session: StudySession
  onEdit: () => void
  onToggle: () => void
}) {
  const style = subjectStyle(session.subject)
  const done = session.status === 'completed'

  return (
    <div
      className={`planner-week-card group relative overflow-hidden rounded-xl border text-left transition ${
        done ? 'is-done' : ''
      }`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${done ? 'bg-emerald-500' : style.bar}`} />
      <div className="p-2 pl-2.5">
        <div className="flex items-start justify-between gap-1">
          <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
            <p className="premium-text-soft text-[10px] font-medium">
              {formatTime12(session.startTime)} – {sessionEndTime(session.startTime, session.durationMins)}
            </p>
            <p
              className={`premium-heading mt-0.5 line-clamp-2 text-xs font-semibold leading-tight ${
                done ? 'premium-text-soft line-through' : ''
              }`}
            >
              {session.title}
            </p>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className={`planner-toggle-btn flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'is-done' : ''}`}
            aria-label={done ? 'Mark as not done' : 'Mark as done'}
            title={done ? 'Mark as not done' : 'Mark as done'}
          >
            {done ? <Check size={11} strokeWidth={2.5} /> : <Circle size={11} />}
          </button>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className={style.chip}>{session.subject}</span>
          <span className="premium-text-soft text-[9px]">{session.durationMins}m</span>
          {done ? <span className="planner-status-done rounded px-1 py-0.5 text-[8px] uppercase tracking-wide">Done</span> : null}
        </div>
      </div>
    </div>
  )
}

function SessionCard({
  session,
  compact,
  onToggle,
  onEdit,
  onDelete,
}: {
  session: StudySession
  compact?: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const style = subjectStyle(session.subject)
  const done = session.status === 'completed'

  return (
    <div
      className={`planner-session-card relative overflow-hidden rounded-xl border transition ${
        done ? 'is-done' : ''
      } ${compact ? 'compact-meta p-3' : 'p-4'}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${done ? 'bg-emerald-500' : style.bar}`} />

      <div className={`planner-session-meta ${done ? 'is-done' : ''}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="planner-meta-chip">{session.subject}</span>
          {done ? (
            <span className="planner-meta-badge">Done</span>
          ) : (
            <span className="planner-meta-badge">new</span>
          )}
        </div>
        <p className="planner-meta-time">
          <Clock3 size={12} className="shrink-0 opacity-90" />
          <span>
            {formatTime12(session.startTime)} – {sessionEndTime(session.startTime, session.durationMins)}
          </span>
          <span className="opacity-80">·</span>
          <span>{session.durationMins} min</span>
          {!compact && (
            <>
              <span className="opacity-80">·</span>
              <span>{DAY_LABELS_FULL[session.dayOfWeek]}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex items-start gap-2.5 pl-1 pr-0.5">
        <button
          type="button"
          onClick={onToggle}
          className={`planner-toggle-btn mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${done ? 'is-done' : ''}`}
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
          title={done ? 'Mark as not done' : 'Mark as done'}
        >
          <Check size={15} strokeWidth={2.5} className={done ? 'text-white' : 'opacity-45'} />
        </button>

        <div className="min-w-0 flex-1 pt-0.5">
          <button type="button" onClick={onEdit} className="block w-full text-left">
            <p
              className={`font-semibold ${compact ? 'text-sm' : 'text-base'} ${
                done ? 'premium-text-soft line-through' : 'premium-heading'
              }`}
            >
              {session.title}
            </p>
            {session.notes && !compact && (
              <p className="premium-text-soft mt-1 line-clamp-2 text-xs">{session.notes}</p>
            )}
          </button>
        </div>

        <div className="planner-action-group shrink-0">
          <button type="button" onClick={onEdit} className="planner-action-btn" aria-label="Edit session">
            <Pencil size={15} />
          </button>
          <button type="button" onClick={onDelete} className="planner-action-btn danger" aria-label="Delete session">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
