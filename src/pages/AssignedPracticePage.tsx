import { useEffect, useMemo, useState, type ElementType } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Layers,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { practiceApi } from '../lib/practiceApi'
import { goToParentDashboard, setAssignedPracticeId } from '../lib/assignedPracticeFlow'
import type { PracticeItem } from '../types'

interface AssignedStatus {
  practice: PracticeItem
  inProgressAttemptId: string | null
  submittedAttemptId: string | null
  canStart: boolean
  canResume: boolean
  viewResultOnly: boolean
}

function PracticeHeroIllustration() {
  return (
    <div className="assigned-practice-art" aria-hidden>
      <svg viewBox="0 0 280 240" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* ambient glow */}
        <circle cx="200" cy="48" r="72" fill="url(#aphGlowA)" opacity="0.5" />
        <circle cx="56" cy="188" r="48" fill="url(#aphGlowB)" opacity="0.35" />

        {/* floating back card */}
        <rect
          x="118"
          y="28"
          width="118"
          height="148"
          rx="16"
          fill="rgba(255,255,255,0.08)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.2"
          transform="rotate(8 177 102)"
        />

        {/* main clipboard */}
        <g className="assigned-practice-art-float">
          <rect x="52" y="44" width="148" height="168" rx="18" fill="url(#aphBoard)" />
          <rect x="52" y="44" width="148" height="168" rx="18" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* clip */}
          <rect x="98" y="36" width="56" height="22" rx="8" fill="rgba(255,255,255,0.92)" />
          <rect x="106" y="40" width="40" height="10" rx="4" fill="rgba(136,22,122,0.25)" />
          {/* header line */}
          <rect x="72" y="78" width="72" height="9" rx="4.5" fill="rgba(255,255,255,0.85)" />
          {/* checklist rows */}
          <rect x="72" y="98" width="108" height="7" rx="3.5" fill="rgba(255,255,255,0.22)" />
          <rect x="72" y="114" width="96" height="7" rx="3.5" fill="rgba(255,255,255,0.18)" />
          <rect x="72" y="130" width="102" height="7" rx="3.5" fill="rgba(255,255,255,0.14)" />
          {/* check circles */}
          <circle cx="82" cy="101.5" r="9" fill="#d05ac0" />
          <path d="M78 101.5L81 104.5L87 97.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="82" cy="117.5" r="9" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
          <circle cx="82" cy="133.5" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
          {/* progress bar */}
          <rect x="72" y="158" width="108" height="8" rx="4" fill="rgba(0,0,0,0.15)" />
          <rect x="72" y="158" width="68" height="8" rx="4" fill="url(#aphProgress)" />
          <text x="126" y="182" fill="rgba(255,255,255,0.75)" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="system-ui, sans-serif">
            3 of 5
          </text>
        </g>

        {/* pencil */}
        <g transform="translate(178 148) rotate(-35)" className="assigned-practice-art-float-delayed">
          <rect x="0" y="0" width="12" height="52" rx="3" fill="url(#aphPencil)" />
          <path d="M0 52 L6 64 L12 52 Z" fill="#f5c4a8" />
          <rect x="0" y="0" width="12" height="10" rx="3" fill="#f472b6" />
          <rect x="1" y="12" width="10" height="3" rx="1" fill="rgba(255,255,255,0.35)" />
        </g>

        {/* star badge */}
        <g transform="translate(196 52)">
          <g className="assigned-practice-art-pulse">
            <circle cx="24" cy="24" r="24" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />
            <path
              d="M24 12 L27.2 20.4 L36 21.6 L29.5 27.6 L31.4 36 L24 31.2 L16.6 36 L18.5 27.6 L12 21.6 L20.8 20.4 Z"
              fill="#fde68a"
              stroke="#fbbf24"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* small floating dots */}
        <circle cx="38" cy="62" r="4" fill="rgba(255,255,255,0.35)" />
        <circle cx="228" cy="178" r="5" fill="rgba(255,255,255,0.25)" />
        <circle cx="24" cy="128" r="3" fill="rgba(255,255,255,0.2)" />

        <defs>
          <radialGradient id="aphGlowA" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 48) scale(72)">
            <stop stopColor="#f5deef" />
            <stop offset="1" stopColor="#f5deef" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="aphGlowB" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(56 188) scale(48)">
            <stop stopColor="#d05ac0" />
            <stop offset="1" stopColor="#d05ac0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="aphBoard" x1="52" y1="44" x2="200" y2="212" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.22)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.06)" />
          </linearGradient>
          <linearGradient id="aphProgress" x1="72" y1="162" x2="140" y2="162" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0abfc" />
            <stop offset="1" stopColor="#d05ac0" />
          </linearGradient>
          <linearGradient id="aphPencil" x1="6" y1="0" x2="6" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde68a" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function MetaChip({ icon: Icon, label, hero = false }: { icon: ElementType; label: string; hero?: boolean }) {
  return (
    <span
      className={
        hero
          ? 'assigned-practice-hero-chip inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold sm:text-[13px]'
          : 'assigned-practice-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold'
      }
    >
      <Icon size={14} className="shrink-0 opacity-90" />
      <span className="truncate">{label}</span>
    </span>
  )
}

function LoadingState() {
  return (
    <div className="assigned-practice-shell mx-auto w-full max-w-3xl animate-pulse">
      <div className="assigned-practice-hero h-52 rounded-t-3xl" />
      <div className="assigned-practice-body space-y-4 rounded-b-3xl p-5 sm:p-8">
        <div className="mx-auto h-4 w-32 rounded-full bg-white/10" />
        <div className="mx-auto h-8 w-2/3 rounded-xl bg-white/10" />
        <div className="mx-auto h-4 w-1/2 rounded-full bg-white/10" />
        <div className="mt-8 h-28 rounded-2xl bg-white/5" />
      </div>
    </div>
  )
}

export function AssignedPracticePage() {
  const { practiceId = '' } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<AssignedStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (practiceId) setAssignedPracticeId(practiceId)
  }, [practiceId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await practiceApi.getAssignedStatus(practiceId)
        setStatus(data)
        if (data.viewResultOnly && data.submittedAttemptId) {
          navigate(`/practice/result/${data.submittedAttemptId}`, { replace: true })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load assigned practice')
      } finally {
        setLoading(false)
      }
    }
    if (practiceId) void load()
  }, [practiceId, navigate])

  const practice = status?.practice
  const questionCount = practice?._count?.questions ?? 0
  const estMins = useMemo(() => Math.max(15, Math.round(questionCount * 1.5)), [questionCount])

  const cta = useMemo(() => {
    if (!status || !practice) return null
    if (status.canResume) {
      return {
        tone: 'resume' as const,
        title: 'Pick up where you left off',
        body: 'Your session is saved. Resume anytime — you can pause again before you submit.',
        label: 'Resume practice',
        icon: Play,
        onClick: () => navigate(`/practice/${practice.id}/take`, { state: { skipIntro: true } }),
      }
    }
    if (status.canStart) {
      return {
        tone: 'start' as const,
        title: 'Ready when you are',
        body: 'Work through every question at your pace. Submit once when you are finished.',
        label: 'Start practice',
        icon: BookOpenCheck,
        onClick: () => navigate(`/practice/${practice.id}/take`),
      }
    }
    if (status.viewResultOnly && status.submittedAttemptId) {
      return {
        tone: 'done' as const,
        title: 'Practice completed',
        body: 'You have already submitted this assignment. Review your score and answers anytime.',
        label: 'View result',
        icon: Trophy,
        onClick: () => navigate(`/practice/result/${status.submittedAttemptId}`),
      }
    }
    return null
  }, [status, practice, navigate])

  return (
    <PremiumAppShell hideSidebar mainClassName="assigned-practice-main">
      <div className="assigned-practice-page-wrap px-1 sm:px-2">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <section className="assigned-practice-shell w-full max-w-lg rounded-3xl p-5 text-center sm:p-8">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-300">
              <Sparkles size={24} />
            </div>
            <h1 className="premium-heading text-xl font-bold">Could not load practice</h1>
            <p className="premium-text-muted mt-2 text-sm">{error}</p>
            <button
              type="button"
              onClick={goToParentDashboard}
              className="premium-btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Back to RYD Learning
            </button>
          </section>
        ) : practice ? (
          <article className="assigned-practice-shell w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl">
            {/* Hero — title, copy, and meta all in one block */}
            <header className="assigned-practice-hero relative px-4 pb-8 pt-6 sm:px-10 sm:pb-12 sm:pt-10">
              <PracticeHeroIllustration />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_min(240px,38%)] lg:items-end">
                <div className="min-w-0 space-y-4 pr-12 sm:space-y-5 sm:pr-[32%] lg:pr-0">
                  <div className="assigned-practice-hero-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                    <Sparkles size={12} />
                    Assigned practice
                  </div>

                  <div className="space-y-3">
                    <h1 className="assigned-practice-hero-title text-2xl font-bold leading-[1.15] sm:text-3xl lg:text-[2.75rem]">
                      {practice.name}
                    </h1>
                    <p className="assigned-practice-hero-lead max-w-xl text-[15px] leading-relaxed sm:text-base">
                      Your instructor linked this test to your program. Take your time, focus, and do your best.
                    </p>
                  </div>

                  <div className="assigned-practice-hero-meta flex flex-wrap gap-2.5 pt-1">
                    <MetaChip hero icon={GraduationCap} label={practice.subjectName} />
                    <MetaChip hero icon={Layers} label={practice.classLabel} />
                    <MetaChip
                      hero
                      icon={BookOpenCheck}
                      label={`${questionCount} question${questionCount === 1 ? '' : 's'}`}
                    />
                    <MetaChip hero icon={Clock3} label={`~${estMins} min`} />
                  </div>
                </div>
              </div>
            </header>

            {/* Body */}
            <div className="assigned-practice-body px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
              {cta ? (
                <section
                  className={`assigned-practice-cta assigned-practice-cta--${cta.tone} rounded-2xl border p-6 sm:p-8`}
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {cta.tone === 'resume' ? (
                          <span className="assigned-practice-pulse inline-flex h-2 w-2 rounded-full bg-amber-400" />
                        ) : cta.tone === 'done' ? (
                          <CheckCircle2 size={18} className="text-emerald-400" />
                        ) : (
                          <Sparkles size={16} className="premium-accent" />
                        )}
                        <h2 className="premium-heading text-lg font-bold sm:text-xl">{cta.title}</h2>
                      </div>
                      <p className="premium-text-muted text-sm leading-relaxed">{cta.body}</p>
                    </div>
                    <button
                      type="button"
                      onClick={cta.onClick}
                      className="assigned-practice-primary-btn inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <cta.icon size={18} />
                      {cta.label}
                      <ArrowRight size={16} className="opacity-80" />
                    </button>
                  </div>
                </section>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { step: '1', text: 'Read each question carefully' },
                  { step: '2', text: 'Pause anytime — progress is saved' },
                  { step: '3', text: 'Submit once when you are done' },
                ].map((tip) => (
                  <div key={tip.step} className="assigned-practice-tip rounded-xl p-4">
                    <span className="assigned-practice-tip-num mb-2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold">
                      {tip.step}
                    </span>
                    <p className="premium-text-muted text-xs leading-relaxed sm:text-[13px]">{tip.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t pt-6" style={{ borderColor: 'var(--premium-card-border)' }}>
                <button
                  type="button"
                  onClick={goToParentDashboard}
                  className="premium-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  Back to RYD Learning
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </PremiumAppShell>
  )
}
