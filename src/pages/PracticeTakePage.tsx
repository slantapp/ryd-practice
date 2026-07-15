import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag, Eye, Pause } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { getAssignedPracticeId, goToParentDashboard, isAssignedPracticeUser } from '../lib/assignedPracticeFlow'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeQuestion } from '../types'

interface AnswerReveal {
  isCorrect: boolean
  correctAnswer: string
  answerRationale?: string | null
  topicTag?: string | null
}

function optionsFromQuestion(options: PracticeQuestion['options']): [string, string][] {
  if (!options) return []
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options) as Record<string, string>
      return Object.entries(parsed)
    } catch {
      return []
    }
  }
  return Object.entries(options)
}

function formatCorrectDisplay(correctAnswer: string, options: PracticeQuestion['options']): string {
  const entries = optionsFromQuestion(options)
  const map = Object.fromEntries(entries)
  const key = correctAnswer.trim()
  if (map[key]) return `${key} — ${map[key]}`
  return correctAnswer
}

export function PracticeTakePage() {
  const { practiceId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const skipIntro = Boolean((location.state as { skipIntro?: boolean } | null)?.skipIntro)

  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [attemptId, setAttemptId] = useState('')
  const [isResuming, setIsResuming] = useState(false)
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [shownAnswer, setShownAnswer] = useState<Record<string, boolean>>({})
  const [answerResult, setAnswerResult] = useState<Record<string, AnswerReveal>>({})
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false)
  const [paused, setPaused] = useState(false)

  const isAssignedFlow = isAssignedPracticeUser()
  const assignedPracticeId = getAssignedPracticeId()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [questionRes, attemptRes] = await Promise.all([
          practiceApi.getQuestions(practiceId),
          practiceApi.startAttempt(practiceId),
        ])
        const sorted = [...(Array.isArray(questionRes) ? questionRes : [])].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0),
        )
        setQuestions(sorted)
        setAttemptId(attemptRes.id)

        const attemptDetail = await practiceApi.getAttempt(attemptRes.id)
        const restoredAnswers: Record<string, string> = {}
        const restoredFlags: Record<string, boolean> = {}
        for (const row of attemptDetail.answers) {
          if (row.selectedAnswer?.trim()) {
            restoredAnswers[row.questionId] = row.selectedAnswer
          }
          if (row.isFlagged) {
            restoredFlags[row.questionId] = true
          }
        }
        const hasProgress = Object.keys(restoredAnswers).length > 0
        setIsResuming(hasProgress && skipIntro)
        setAnswer(restoredAnswers)
        setFlagged(restoredFlags)

        const firstUnanswered = sorted.findIndex((q) => !restoredAnswers[q.id])
        setIndex(firstUnanswered >= 0 ? firstUnanswered : Math.max(0, sorted.length - 1))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to start practice'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    if (practiceId) void load()
  }, [practiceId, skipIntro])

  const currentQuestion = useMemo(() => questions[index], [questions, index])
  const qId = currentQuestion?.id
  const selected = qId ? answer[qId] || '' : ''
  const shown = qId ? !!shownAnswer[qId] : false
  const result = qId ? answerResult[qId] : null
  const isFlagged = qId ? !!flagged[qId] : false

  const persistCurrentAnswer = async (opts?: { showAnswer?: boolean }) => {
    if (!attemptId || !currentQuestion) return null
    const res = await practiceApi.saveAnswer(attemptId, currentQuestion.id, {
      selectedAnswer: answer[currentQuestion.id] || '',
      isFlagged: !!flagged[currentQuestion.id],
      ...(opts?.showAnswer ? { showAnswer: true } : {}),
    })
    if (opts?.showAnswer && res.correctAnswer !== undefined && res.isCorrect !== undefined) {
      setAnswerResult((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          isCorrect: res.isCorrect!,
          correctAnswer: res.correctAnswer!,
          answerRationale: res.answerRationale,
          topicTag: res.topicTag,
        },
      }))
      setShownAnswer((prev) => ({ ...prev, [currentQuestion.id]: true }))
    }
    return res
  }

  const handleToggleFlag = async () => {
    if (!attemptId || !qId) return
    const next = !isFlagged
    setFlagged((prev) => ({ ...prev, [qId]: next }))
    try {
      await practiceApi.saveAnswer(attemptId, qId, {
        selectedAnswer: answer[qId] || '',
        isFlagged: next,
      })
    } catch {
      setFlagged((prev) => ({ ...prev, [qId]: !next }))
      setError('Failed to update flag')
    }
  }

  const handleShowAnswer = async () => {
    if (!attemptId || !qId || shown) return
    setSaving(true)
    setError('')
    try {
      await persistCurrentAnswer({ showAnswer: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to show answer')
    } finally {
      setSaving(false)
    }
  }

  const submitAnswerAndMove = async (nextIndex: number) => {
    if (!attemptId || !currentQuestion) return
    setSaving(true)
    try {
      await persistCurrentAnswer()
      setIndex(Math.max(0, Math.min(nextIndex, questions.length - 1)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answer')
    } finally {
      setSaving(false)
    }
  }

  const handlePauseAndExit = async () => {
    if (!attemptId) {
      if (isAssignedFlow && assignedPracticeId) {
        navigate(`/practice/assigned/${assignedPracticeId}`)
        return
      }
      navigate('/practice/attempts')
      return
    }
    setSaving(true)
    setError('')
    try {
      await persistCurrentAnswer()
      if (isAssignedFlow) {
        setPauseConfirmOpen(false)
        setPaused(true)
        return
      }
      navigate('/practice/attempts', {
        state: { message: 'Practice paused. You can continue anytime from My Attempts.' },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitPractice = async () => {
    if (!attemptId) return
    setSaving(true)
    setError('')
    try {
      await persistCurrentAnswer()
      const response = await practiceApi.submitAttempt(attemptId)
      setSubmitConfirmOpen(false)
      navigate(`/practice/result/${response.attempt.id}`, {
        state: {
          summary: response.summary,
          fromAssignedFlow: Boolean(getAssignedPracticeId()),
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit practice')
    } finally {
      setSaving(false)
    }
  }

  const getOptionClass = (key: string) => {
    const base = 'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition '
    if (!shown || !result) {
      return `${base} ${
        selected === key
          ? 'border-[#b0438f] bg-[color-mix(in_srgb,var(--premium-accent-strong)_12%,transparent)]'
          : 'premium-inset border'
      }`
    }
    const isCorrectKey = result.correctAnswer.trim() === key
    const isSelected = selected === key
    if (isCorrectKey) return `${base} practice-option--correct`
    if (isSelected && !result.isCorrect) return `${base} practice-option--wrong`
    return `${base} premium-inset border opacity-70`
  }

  const answeredCount = questions.filter((q) => (answer[q.id] || '').trim()).length
  const unanswered = questions.length - answeredCount
  const progress = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0

  const shell = (content: ReactNode) => (
    <PremiumAppShell hideSidebar>{content}</PremiumAppShell>
  )

  if (loading) {
    return shell(
      <section className="premium-card w-full max-w-2xl rounded-2xl border p-5 text-center sm:p-8">
        <p className="premium-text-muted">Preparing your practice session...</p>
      </section>,
    )
  }

  if (error && !currentQuestion) {
    return shell(
      <section className="premium-card w-full max-w-2xl rounded-2xl border p-5 sm:p-8">
        <p className="text-rose-400">{error}</p>
        {isAssignedFlow && assignedPracticeId ? (
          <button
            type="button"
            onClick={() => navigate(`/practice/assigned/${assignedPracticeId}`)}
            className="premium-accent mt-3 inline-block text-sm"
          >
            Back to assigned practice
          </button>
        ) : (
          <Link to="/practice/catalog" className="premium-accent mt-3 inline-block text-sm">
            Back to catalog
          </Link>
        )}
      </section>,
    )
  }

  if (!currentQuestion) {
    return shell(
      <section className="premium-card w-full max-w-2xl rounded-2xl border p-5 sm:p-8">
        <p className="premium-text-muted">No questions found.</p>
      </section>,
    )
  }

  if (paused && isAssignedFlow) {
    return shell(
      <section className="premium-card w-full max-w-lg rounded-2xl border p-5 text-center sm:p-8">
        <div
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--premium-accent-strong) 18%, transparent)' }}
        >
          <Pause size={28} className="premium-accent" />
        </div>
        <h1 className="premium-heading text-xl font-bold sm:text-2xl">Practice paused</h1>
        <p className="premium-text-muted mt-3 text-sm leading-relaxed">
          Your answers have been saved. You can resume this test anytime from your assigned practice page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {assignedPracticeId ? (
            <button
              type="button"
              onClick={() => navigate(`/practice/assigned/${assignedPracticeId}`)}
              className="premium-btn-secondary rounded-xl border px-5 py-2.5 text-sm font-semibold"
            >
              Resume later
            </button>
          ) : null}
          <button
            type="button"
            onClick={goToParentDashboard}
            className="premium-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
          >
            Back to RYD Learning
          </button>
        </div>
      </section>,
    )
  }

  const options = optionsFromQuestion(currentQuestion.options)

  return shell(
    <>
      <div className="practice-take-sticky-bar sticky top-0 z-20 -mx-1 mb-4 w-full max-w-3xl px-1 pb-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          {isAssignedFlow && assignedPracticeId ? (
            <button
              type="button"
              onClick={() => navigate(`/practice/assigned/${assignedPracticeId}`)}
              className="premium-btn-secondary inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              Exit
            </button>
          ) : (
            <Link
              to="/practice/catalog"
              className="premium-btn-secondary inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold"
            >
              <ArrowLeft size={16} />
              Exit
            </Link>
          )}
          <div className="min-w-0 flex-1 px-1 sm:px-4">
            <div className="premium-text-soft mb-1 flex justify-between text-xs">
              <span>
                Q {index + 1}/{questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--premium-inset-bg)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(to right, var(--premium-accent-strong), var(--premium-accent))',
                }}
              />
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (isAssignedFlow) {
                setPauseConfirmOpen(true)
                return
              }
              void handlePauseAndExit()
            }}
            className="premium-btn-secondary inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold sm:px-4"
          >
            <Pause size={16} />
            <span className="hidden sm:inline">Pause &amp; save</span>
            <span className="sm:hidden">Pause</span>
          </button>
        </div>
      </div>

      <section className="premium-card w-full max-w-3xl space-y-5 rounded-2xl border p-4 sm:space-y-6 sm:p-6 md:p-8">
        {isResuming ? (
          <div
            className="rounded-xl border px-4 py-2 text-center text-sm"
            style={{
              borderColor: 'var(--premium-card-border)',
              background: 'color-mix(in srgb, var(--premium-accent-strong) 12%, transparent)',
            }}
          >
            <span className="premium-accent font-semibold">Resuming session</span>
            <span className="premium-text-muted"> — your saved answers have been restored.</span>
          </div>
        ) : null}

        <div className="practice-qnav-strip -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex w-max min-w-full flex-wrap gap-1.5 sm:flex-nowrap sm:gap-2">
            {questions.map((q, qIndex) => (
              <button
                key={q.id}
                type="button"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold transition sm:h-9 sm:w-9 sm:text-sm ${
                  qIndex === index
                    ? 'premium-pill-active border-0'
                    : answer[q.id]
                      ? 'premium-accent premium-inset border'
                      : flagged[q.id]
                        ? 'practice-qnav-flagged border'
                        : 'premium-pill border'
                }`}
                style={
                  qIndex !== index && !answer[q.id] && !flagged[q.id]
                    ? { borderColor: 'var(--premium-card-border)' }
                    : undefined
                }
                onClick={() => void submitAnswerAndMove(qIndex)}
                aria-label={`Question ${qIndex + 1}`}
                aria-current={qIndex === index ? 'step' : undefined}
              >
                {qIndex + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="premium-heading text-xl font-bold leading-relaxed md:text-2xl">
            {currentQuestion.questionText}
          </h1>
          <p className="premium-text-soft mt-3 text-sm">
            {answeredCount} answered · {unanswered} remaining
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void handleToggleFlag()}
            disabled={saving}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              isFlagged ? 'practice-flag-active border' : 'premium-btn-secondary border'
            }`}
          >
            <Flag size={16} className={isFlagged ? 'fill-current' : ''} />
            {isFlagged ? 'Flagged' : 'Flag question'}
          </button>
          {!shown ? (
            <button
              type="button"
              onClick={() => void handleShowAnswer()}
              disabled={saving}
              className="premium-btn-secondary inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
            >
              <Eye size={16} />
              Show answer
            </button>
          ) : null}
        </div>

        <div className="mx-auto w-full max-w-xl space-y-3">
          {options.map(([key, value]) => (
            <label key={key} className={getOptionClass(key)} style={{ borderColor: 'var(--premium-card-border)' }}>
              <input
                type="radio"
                name="answer"
                value={key}
                checked={selected === key}
                disabled={shown}
                onChange={(e) => setAnswer((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                className="h-4 w-4 shrink-0"
              />
              <span className="text-left">
                <span className="font-semibold">{key}.</span> {value}
              </span>
            </label>
          ))}
        </div>

        {shown && result ? (
          <div className="flex w-full justify-center">
            <div
              className={`w-full max-w-xl rounded-xl border p-4 text-center text-sm ${
                result.isCorrect ? 'practice-answer-reveal--correct' : 'practice-answer-reveal--incorrect'
              }`}
            >
              <p className="text-base font-semibold">{result.isCorrect ? 'Correct!' : 'Not quite'}</p>
              {!result.isCorrect ? (
                <p className="mt-2">
                  Correct answer:{' '}
                  <strong>{formatCorrectDisplay(result.correctAnswer, currentQuestion.options)}</strong>
                </p>
              ) : null}
              {result.answerRationale ? (
                <div className="premium-text-muted mx-auto mt-3 max-w-lg text-center leading-relaxed">
                  <p className="font-medium">Explanation</p>
                  <p className="mt-1">{result.answerRationale}</p>
                </div>
              ) : null}
              {result.topicTag ? (
                <p className="premium-text-soft mt-2 text-center text-xs">Topic: {result.topicTag}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-center text-sm text-rose-400">{error}</p> : null}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={index === 0 || saving}
            className="premium-btn-secondary rounded-xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
            onClick={() => void submitAnswerAndMove(index - 1)}
          >
            Previous
          </button>
          {index < questions.length - 1 ? (
            <button
              type="button"
              disabled={saving}
              className="premium-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              onClick={() => void submitAnswerAndMove(index + 1)}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              className="premium-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              onClick={() => setSubmitConfirmOpen(true)}
            >
              Submit practice
            </button>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={pauseConfirmOpen}
        title="Pause practice?"
        description="Your progress will be saved. You can resume this test later from your assigned practice page."
        confirmLabel="Yes, pause"
        cancelLabel="Keep practicing"
        loading={saving}
        onConfirm={() => void handlePauseAndExit()}
        onCancel={() => setPauseConfirmOpen(false)}
      />

      <ConfirmDialog
        open={submitConfirmOpen}
        title="Submit practice?"
        description={
          unanswered > 0 ? (
            <>
              You still have <strong>{unanswered}</strong> unanswered question
              {unanswered === 1 ? '' : 's'}. Once submitted, you cannot change your answers. Do you want to submit
              anyway?
            </>
          ) : (
            <>You have answered all questions. Submit now to see your results.</>
          )
        }
        confirmLabel="Submit practice"
        cancelLabel="Keep practicing"
        loading={saving}
        onConfirm={() => void handleSubmitPractice()}
        onCancel={() => setSubmitConfirmOpen(false)}
      />
    </>,
  )
}
