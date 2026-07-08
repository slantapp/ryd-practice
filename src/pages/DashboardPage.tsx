import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Flame,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { useAuth } from '../context/AuthContext'
import { usePracticeSubscription } from '../context/SubscriptionContext'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeAttemptListItem, PracticeLeaderboardResponse } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const { refresh } = usePracticeSubscription()
  const [searchParams, setSearchParams] = useSearchParams()
  const [attempts, setAttempts] = useState<PracticeAttemptListItem[]>([])
  const [leaderboard, setLeaderboard] = useState<PracticeLeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (searchParams.get('practiceSubscription') === 'success') {
      void refresh()
      const next = new URLSearchParams(searchParams)
      next.delete('practiceSubscription')
      next.delete('session_id')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams, refresh])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [attemptData, leaderboardData] = await Promise.all([
          practiceApi.listAttempts(),
          practiceApi.getLeaderboard(5).catch(() => null),
        ])
        setAttempts(Array.isArray(attemptData) ? attemptData : [])
        setLeaderboard(leaderboardData)
      } catch {
        setAttempts([])
        setLeaderboard(null)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const identityKey = useMemo(
    () => localStorage.getItem('practice-signup-source') || 'practice',
    [],
  )

  const inProgress = useMemo(() => attempts.filter((a) => !a.submittedAt), [attempts])
  const submitted = useMemo(
    () => attempts.filter((a) => a.submittedAt && typeof a.score === 'number'),
    [attempts],
  )
  const inProgressCount = inProgress.length
  const averageScore = submitted.length
    ? Math.round((submitted.reduce((sum, a) => sum + (a.score || 0), 0) / submitted.length) * 10) / 10
    : 0
  const bestScore = submitted.length ? Math.max(...submitted.map((a) => a.score || 0)) : 0
  const totalAnswered = submitted.reduce((sum, a) => sum + (a.answeredCount || 0), 0)
  const needsReview = useMemo(
    () => submitted.filter((a) => (a.score ?? 0) < 70).slice(0, 3),
    [submitted],
  )
  const firstInProgress = inProgress[0]

  const quickActions = [
    { title: 'Browse Practice', desc: 'View and start practice sets', href: '/practice/catalog', icon: BookOpen },
    { title: 'My Attempts', desc: 'Continue or review past sessions', href: '/practice/attempts', icon: BarChart3 },
    { title: 'Study Planner', desc: 'Schedule your weekly study sessions', href: '/study-planner', icon: CalendarDays },
    { title: 'Edit Profile', desc: 'Update profile and location', href: '/settings/profile', icon: CircleUserRound },
  ]

  return (
    <PremiumAppShell>
      <>
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-hero-gradient relative overflow-hidden rounded-3xl border p-7 shadow-2xl"
          >
            <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Learning Dashboard</p>
            <h1 className="premium-heading mt-2 text-4xl font-bold">{`Welcome back, ${user?.firstName || 'Student'} 👋`}</h1>
            <p className="premium-text-muted mt-2 max-w-2xl">
              {submitted.length > 0
                ? `You have completed ${submitted.length} practice session${submitted.length === 1 ? '' : 's'} with an average score of ${averageScore}%.`
                : 'Start your first practice session from the catalog to track your progress here.'}
              {inProgressCount > 0 ? ` You have ${inProgressCount} session${inProgressCount === 1 ? '' : 's'} in progress.` : ''}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/practice/catalog" className="premium-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
                Continue Practice
              </Link>
              {firstInProgress ? (
                <Link
                  to={`/practice/${firstInProgress.practiceId}/take`}
                  state={{ skipIntro: true }}
                  className="premium-btn-secondary rounded-xl border px-4 py-2 text-sm font-semibold"
                >
                  Resume Last Session
                </Link>
              ) : (
                <Link to="/practice/attempts" className="premium-btn-secondary rounded-xl border px-4 py-2 text-sm font-semibold">
                  My Attempts
                </Link>
              )}
              <Link to="/practice/attempts" className="premium-btn-secondary rounded-xl border px-4 py-2 text-sm font-semibold">
                View Performance
              </Link>
            </div>
          </motion.section>

          <section className="mt-5 grid grid-cols-4 gap-3">
            {[
              { title: 'Total Sessions', value: attempts.length, trend: `${submitted.length} completed`, icon: BookOpen },
              { title: 'Questions Answered', value: totalAnswered, trend: 'Across completed sets', icon: Target },
              { title: 'Average Score', value: submitted.length ? `${averageScore}%` : '—', trend: submitted.length ? 'Completed sessions' : 'No scores yet', icon: BarChart3 },
              { title: 'In Progress', value: inProgressCount, trend: inProgressCount ? 'Paused sessions' : 'None active', icon: Flame },
              { title: 'Best Score', value: submitted.length ? `${bestScore}%` : '—', trend: 'Personal best', icon: CheckCircle2 },
              { title: 'Completed', value: submitted.length, trend: 'Finished practices', icon: Sparkles },
              { title: 'Needs Review', value: needsReview.length, trend: 'Below 70% score', icon: Clock3 },
              { title: 'Available', value: inProgressCount + submitted.length, trend: 'Total attempts', icon: Trophy },
            ].map((card) => (
              <motion.article
                key={card.title}
                whileHover={{ y: -2 }}
                className="premium-card rounded-2xl border p-4 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <p className="premium-text-soft text-xs">{card.title}</p>
                  <card.icon size={15} className="premium-accent" />
                </div>
                <h3 className="premium-stat mt-2 text-2xl font-bold">{card.value}</h3>
                <p className="premium-stat-hint mt-1 text-xs">{card.trend}</p>
                <div className="premium-inset mt-3 h-1.5 rounded-full">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(30, Number(String(card.value).replace(/\D/g, ''))))}%` }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right, var(--premium-accent-strong), var(--premium-accent))' }}
                  />
                </div>
              </motion.article>
            ))}
          </section>

          <section className="mt-5 grid grid-cols-2 gap-4">
            <article className="premium-card rounded-2xl border p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Learning</h3>
                <Link to="/practice/attempts" className="premium-accent text-sm">
                  View all
                </Link>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {inProgress.length === 0 && needsReview.length === 0 && submitted.length === 0 ? (
                  <p className="premium-text-soft premium-inset rounded-xl p-3">
                    No active sessions yet. Browse the catalog to start practicing.
                  </p>
                ) : null}
                {inProgress.map((row) => (
                  <Link
                    key={row.id}
                    to={`/practice/${row.practiceId}/take`}
                    state={{ skipIntro: true }}
                    className="premium-inset block rounded-xl p-3 transition hover:opacity-90"
                  >
                    <span className="premium-accent font-medium">Continue: </span>
                    {row.practice?.name || 'Practice'}
                    <span className="premium-text-soft">
                      {' '}
                      · {row.answeredCount}/{row.totalQuestions} answered
                    </span>
                  </Link>
                ))}
                {needsReview.map((row) => (
                  <div key={row.id} className="premium-inset rounded-xl p-3">
                    <span className="font-medium">Review: </span>
                    {row.practice?.name || 'Practice'}
                    <span className="premium-text-soft"> · scored {row.score}%</span>
                  </div>
                ))}
                {submitted.length > 0 && inProgress.length === 0 && needsReview.length === 0 ? (
                  <p className="premium-text-soft premium-inset rounded-xl p-3">
                    Latest score: {submitted[0].score}% on {submitted[0].practice?.name || 'your last practice'}.
                  </p>
                ) : null}
              </div>
            </article>

            <article className="premium-card rounded-2xl border p-5">
              <h3 className="text-lg font-semibold">Leaderboard Preview</h3>
              <p className="premium-text-soft mt-1 text-sm">Top performers on RYD Practice.</p>
              <div className="mt-3 space-y-2 text-sm">
                {!leaderboard?.entries?.length ? (
                  <p className="premium-text-soft premium-inset rounded-lg p-2">
                    Complete a practice to join the leaderboard.
                  </p>
                ) : (
                  leaderboard.entries.slice(0, 3).map((row) => (
                    <div key={row.studentId} className="premium-inset flex items-center justify-between rounded-lg p-2">
                      <span className="truncate pr-2">
                        #{row.rank} {row.displayName}
                        {row.isCurrentUser ? ' (You)' : ''}
                      </span>
                      <span className="premium-accent shrink-0">{row.averageScore}%</span>
                    </div>
                  ))
                )}
                {leaderboard?.currentUser &&
                !leaderboard.entries.some((e) => e.studentId === leaderboard.currentUser?.studentId) ? (
                  <div className="premium-inset flex items-center justify-between rounded-lg p-2 font-medium">
                    <span className="truncate pr-2">
                      #{leaderboard.currentUser.rank} You
                    </span>
                    <span className="premium-accent shrink-0">{leaderboard.currentUser.averageScore}%</span>
                  </div>
                ) : null}
              </div>
              <Link to="/practice/home" className="premium-accent mt-3 inline-flex items-center gap-1 text-sm">
                Open leaderboard <ChevronRight size={14} />
              </Link>
            </article>
          </section>

          <section className="premium-card mt-5 rounded-2xl border p-5">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.href}
                  className="premium-inset group rounded-xl border p-4 transition hover:opacity-90"
                  style={{ borderColor: 'var(--premium-card-border)' }}
                >
                  <action.icon size={18} className="premium-accent" />
                  <p className="mt-2 text-sm font-semibold">{action.title}</p>
                  <p className="premium-text-soft mt-1 text-xs">{action.desc}</p>
                </Link>
              ))}
            </div>
          </section>
      {loading ? (
        <div className="fixed bottom-4 right-4 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white/70">
          Syncing dashboard insights...
        </div>
      ) : null}
      <div className="sr-only">{identityKey}</div>
      </>
    </PremiumAppShell>
  )
}
