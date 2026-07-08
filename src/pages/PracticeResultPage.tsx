import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Award, BookOpen, CheckCircle2, ChevronRight, Target, XCircle } from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { getAssignedPracticeId, goToParentDashboard } from '../lib/assignedPracticeFlow'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeAttemptDetail, PracticeAttemptSummary } from '../types'

interface ResultState {
  summary?: PracticeAttemptSummary
  fromAssignedFlow?: boolean
}

export function PracticeResultPage() {
  const { attemptId = '' } = useParams()
  const location = useLocation()
  const state = location.state as ResultState
  const [attempt, setAttempt] = useState<PracticeAttemptDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!attemptId) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await practiceApi.getAttempt(attemptId)
        setAttempt(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load result')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [attemptId])

  const summary = attempt?.summary ?? state?.summary
  const score = summary?.score ?? 0
  const passed = score >= 50

  const wrongTopics = useMemo(() => {
    if (!attempt?.answers) return []
    const topics = attempt.answers
      .filter((a) => a.isCorrect === false && a.question?.topicTag)
      .map((a) => a.question.topicTag as string)
    return [...new Set(topics)].slice(0, 4)
  }, [attempt])

  const flaggedCount = useMemo(
    () => attempt?.answers?.filter((a) => a.isFlagged).length ?? 0,
    [attempt],
  )

  const assignedPracticeId = getAssignedPracticeId()
  const isAssignedFlow = Boolean(state?.fromAssignedFlow || assignedPracticeId)

  return (
    <PremiumAppShell hideSidebar={isAssignedFlow} mainClassName={isAssignedFlow ? 'assigned-practice-main' : ''}>
      <div className="mx-auto max-w-4xl space-y-5">
        {loading ? (
          <section className="premium-card rounded-2xl border p-10 text-center">
            <p className="premium-text-muted">Loading your results...</p>
          </section>
        ) : error ? (
          <section className="premium-card rounded-2xl border p-8">
            <p className="text-rose-400">{error}</p>
            <Link to="/practice/attempts" className="premium-accent mt-3 inline-block text-sm">
              Back to My Attempts
            </Link>
          </section>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="premium-hero-gradient relative overflow-hidden rounded-3xl border p-8 text-center"
            >
              <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Practice Complete</p>
              <div
                className="mx-auto mt-4 grid h-20 w-20 place-items-center rounded-full"
                style={{
                  background: passed
                    ? 'color-mix(in srgb, #10b981 25%, transparent)'
                    : 'color-mix(in srgb, var(--premium-accent-strong) 25%, transparent)',
                }}
              >
                <Award size={36} className={passed ? 'text-emerald-400' : 'premium-accent'} />
              </div>
              <h1 className="premium-heading mt-4 text-5xl font-bold">{score}%</h1>
              <p className="premium-text-muted mt-2 text-lg">
                {attempt?.practice?.name || 'Practice session'}
              </p>
              <p className="premium-text-soft mt-1 text-sm">
                {attempt?.practice?.subjectName} · {attempt?.practice?.classLabel}
              </p>
              <p className="premium-text-muted mx-auto mt-4 max-w-md text-sm">
                {passed
                  ? 'Great work! Review any missed questions to strengthen weak areas.'
                  : 'Keep practicing — focus on the topics you missed below.'}
              </p>
            </motion.section>

            <section className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total questions', value: summary?.total ?? 0, icon: BookOpen },
                { label: 'Correct', value: summary?.correct ?? 0, icon: CheckCircle2 },
                { label: 'Incorrect', value: summary?.wrong ?? 0, icon: XCircle },
              ].map((card) => (
                <article key={card.label} className="premium-card rounded-2xl border p-5 text-center">
                  <card.icon size={20} className="premium-accent mx-auto" />
                  <p className="premium-stat mt-3 text-3xl font-bold">{card.value}</p>
                  <p className="premium-text-soft mt-1 text-xs">{card.label}</p>
                </article>
              ))}
            </section>

            <section className="grid grid-cols-2 gap-4">
              <article className="premium-card rounded-2xl border p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Target size={18} className="premium-accent" />
                  Performance summary
                </h3>
                <ul className="premium-text-muted mt-4 space-y-2 text-sm">
                  <li className="premium-inset rounded-lg px-3 py-2">
                    Accuracy: <strong style={{ color: 'var(--premium-text)' }}>{score}%</strong>
                  </li>
                  <li className="premium-inset rounded-lg px-3 py-2">
                    Questions answered:{' '}
                    <strong style={{ color: 'var(--premium-text)' }}>
                      {(summary?.correct ?? 0) + (summary?.wrong ?? 0)} / {summary?.total ?? 0}
                    </strong>
                  </li>
                  {flaggedCount > 0 ? (
                    <li className="premium-inset rounded-lg px-3 py-2">
                      Flagged for review: <strong style={{ color: 'var(--premium-text)' }}>{flaggedCount}</strong>
                    </li>
                  ) : null}
                </ul>
              </article>

              <article className="premium-card rounded-2xl border p-5">
                <h3 className="text-lg font-semibold">Topics to review</h3>
                {wrongTopics.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {wrongTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{
                          borderColor: 'var(--premium-card-border)',
                          background: 'var(--premium-inset-bg)',
                          color: 'var(--premium-text-muted)',
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="premium-text-soft mt-3 text-sm">No weak topics identified — excellent!</p>
                )}
              </article>
            </section>

            <section className="premium-card rounded-2xl border p-5">
              <h3 className="text-lg font-semibold">{isAssignedFlow ? 'All done' : 'Next steps'}</h3>
              {isAssignedFlow ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={goToParentDashboard}
                    className="premium-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
                  >
                    Back to RYD Learning
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/practice/catalog" className="premium-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold">
                    Take another practice
                  </Link>
                  <Link
                    to="/practice/attempts"
                    className="premium-btn-secondary inline-flex items-center gap-1 rounded-xl border px-5 py-2.5 text-sm font-semibold"
                  >
                    My attempts <ChevronRight size={14} />
                  </Link>
                  <Link to="/dashboard" className="premium-btn-secondary rounded-xl border px-5 py-2.5 text-sm font-semibold">
                    Dashboard
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </PremiumAppShell>
  )
}
