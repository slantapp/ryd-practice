import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Filter,
  Flame,
  Play,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeAttemptListItem } from '../types'

type AttemptStatus = 'completed' | 'in_progress'

function attemptStatus(row: PracticeAttemptListItem): AttemptStatus {
  return row.submittedAt ? 'completed' : 'in_progress'
}

export function PracticeAttemptsPage() {
  const location = useLocation()
  const pauseMessage = (location.state as { message?: string } | null)?.message
  const [attempts, setAttempts] = useState<PracticeAttemptListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AttemptStatus | 'all'>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await practiceApi.listAttempts()
        setAttempts(Array.isArray(data) ? data : [])
      } catch {
        setAttempts([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = useMemo(() => {
    return attempts.filter((row) => {
      const q = search.trim().toLowerCase()
      const title = row.practice?.name || ''
      const subject = row.practice?.subjectName || ''
      const classLabel = row.practice?.classLabel || ''
      const matchSearch = !q || `${title} ${subject} ${classLabel}`.toLowerCase().includes(q)
      const status = attemptStatus(row)
      const matchStatus = statusFilter === 'all' || status === statusFilter
      return matchSearch && matchStatus
    })
  }, [attempts, search, statusFilter])

  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.submittedAt)
    const inProgress = attempts.filter((a) => !a.submittedAt)
    const avg =
      completed.length > 0
        ? Math.round(completed.reduce((s, a) => s + (a.score || 0), 0) / completed.length)
        : 0
    return {
      total: attempts.length,
      completed: completed.length,
      inProgress: inProgress.length,
      avg,
      best: completed.length ? Math.max(...completed.map((a) => a.score || 0)) : 0,
      firstInProgress: inProgress[0],
    }
  }, [attempts])

  return (
    <PremiumAppShell>
      <div className="space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-hero-gradient relative overflow-hidden rounded-3xl border p-7"
        >
          <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Performance Center</p>
          <h1 className="premium-heading mt-2 text-4xl font-bold">Your practice journey</h1>
          <p className="premium-text-muted mt-2 max-w-2xl">
            Review every session, resume in-progress work, and track score growth across subjects.
          </p>
          {pauseMessage ? (
            <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-200">
              {pauseMessage}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {stats.firstInProgress ? (
              <Link
                to={`/practice/${stats.firstInProgress.practiceId}/take`}
                state={{ skipIntro: true }}
                className="premium-btn-primary premium-btn-sm rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                Resume In-Progress
              </Link>
            ) : (
              <span
                className="premium-text-soft premium-btn-sm rounded-lg border px-3 py-1.5 text-xs"
                style={{ borderColor: 'var(--premium-card-border)' }}
              >
                No paused sessions
              </span>
            )}
            <Link to="/practice/catalog" className="premium-btn-secondary premium-btn-sm rounded-lg border px-3 py-1.5 text-xs font-semibold">
              Start New Practice
            </Link>
          </div>
        </motion.section>

        <section className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Attempts', value: stats.total, hint: 'All time', icon: Target },
            { label: 'Completed', value: stats.completed, hint: 'Finished sessions', icon: CheckCircle2 },
            { label: 'In Progress', value: stats.inProgress, hint: 'Active now', icon: Play },
            { label: 'Average Score', value: `${stats.avg}%`, hint: 'Across completed', icon: TrendingUp },
          ].map((card) => (
            <div key={card.label} className="premium-card rounded-2xl border p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <p className="premium-text-soft text-xs">{card.label}</p>
                <card.icon size={15} className="premium-accent" />
              </div>
              <h3 className="premium-stat mt-2 text-2xl font-bold">{card.value}</h3>
              <p className="premium-stat-hint mt-1 text-xs">{card.hint}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-[1.5fr_1fr] gap-4">
          <article className="premium-card rounded-2xl border p-4 backdrop-blur-md">
            <div className="mb-2 flex items-center gap-2">
              <Filter size={14} className="premium-accent" />
              <h3 className="text-base font-semibold">Filter Sessions</h3>
            </div>
            <div className="relative mb-2">
              <Search size={14} className="premium-text-soft absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attempts..."
                className="premium-input w-full rounded-lg py-1.5 pl-8 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'completed', 'in_progress'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`premium-pill-compact rounded-full capitalize ${
                    statusFilter === s ? 'premium-pill-active' : 'premium-pill'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </article>

          <article className="premium-card rounded-2xl border p-5">
            <h3 className="text-lg font-semibold">Your Stats</h3>
            <div className="premium-text-muted mt-3 space-y-3 text-sm">
              <p>
                <Sparkles size={14} className="premium-accent inline" /> Completed: <strong>{stats.completed}</strong> sessions
              </p>
              <p>
                <Flame size={14} className="premium-accent inline" /> In progress: <strong>{stats.inProgress}</strong> paused session(s)
              </p>
              {stats.completed > 0 ? (
                <p>
                  <Trophy size={14} className="premium-accent inline" /> Best score: <strong>{stats.best}%</strong>
                </p>
              ) : (
                <p className="premium-text-soft">Complete a practice to see your scores here.</p>
              )}
            </div>
          </article>
        </section>

        <section className="premium-card rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">All Attempts</h3>
            <span className="premium-text-soft text-xs">{filtered.length} shown</span>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="premium-text-muted text-sm">Loading attempts...</p>
            ) : filtered.length === 0 ? (
              <p className="premium-text-muted text-sm">No attempts yet. Start a practice from the catalog.</p>
            ) : (
              filtered.map((row) => {
                const status = attemptStatus(row)
                return (
                  <motion.article
                    key={row.id}
                    whileHover={{ y: -2 }}
                    className="premium-inset rounded-2xl border p-4 transition"
                    style={{ borderColor: 'var(--premium-card-border)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{row.practice?.name || 'Practice'}</p>
                        <p className="premium-text-soft mt-1 text-xs">
                          {row.practice?.subjectName} · {row.practice?.classLabel} · {row.answeredCount}/{row.totalQuestions} answered
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`premium-pill-compact rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                              status === 'completed' ? 'premium-status-completed' : 'premium-status-in-progress'
                            }`}
                          >
                            {status.replace('_', ' ')}
                          </span>
                          {status === 'completed' && row.score != null && (
                            <span className="premium-inset rounded-full px-2 py-0.5 text-[11px]">
                              Score {row.score}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {status === 'completed' && row.submittedAt ? (
                          <Link to={`/practice/result/${row.id}`} className="premium-btn-primary premium-btn-sm rounded-lg px-2.5 py-1 text-[11px] font-semibold">
                            View Result
                          </Link>
                        ) : (
                          <Link
                            to={`/practice/${row.practiceId}/take`}
                            state={{ skipIntro: true }}
                            className="premium-btn-primary premium-btn-sm rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                          >
                            Continue
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="premium-text-soft mt-3 flex flex-wrap gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock3 size={12} /> Started {new Date(row.startedAt).toLocaleDateString()}
                      </span>
                      {row.submittedAt && (
                        <span className="flex items-center gap-1">
                          <BarChart3 size={12} /> Submitted {new Date(row.submittedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </motion.article>
                )
              })
            )}
          </div>
        </section>
      </div>
    </PremiumAppShell>
  )
}
