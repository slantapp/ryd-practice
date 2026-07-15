import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Clock3, Flame, Search, SlidersHorizontal, Target, Trophy } from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { PracticeStartModal } from '../components/PracticeStartModal'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeItem } from '../types'

const FILTER_PILLS = ['All', 'Most Popular', 'Recently Attempted', 'WAEC', 'JAMB', 'Short Duration']

export function PracticeCatalogPage() {
  const navigate = useNavigate()
  const [practices, setPractices] = useState<PracticeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [practiceToStart, setPracticeToStart] = useState<PracticeItem | null>(null)
  const [recentPracticeIds, setRecentPracticeIds] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [practiceList, attempts] = await Promise.all([
          practiceApi.list(),
          practiceApi.listAttempts().catch(() => []),
        ])
        setPractices(practiceList)
        const recentIds: string[] = []
        for (const attempt of attempts) {
          if (attempt.practiceId && !recentIds.includes(attempt.practiceId)) {
            recentIds.push(attempt.practiceId)
          }
        }
        setRecentPracticeIds(recentIds.slice(0, 10))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load practice list'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return practices.filter((item) => {
      const matchSearch =
        !q || `${item.name} ${item.subjectName} ${item.classLabel}`.toLowerCase().includes(q)
      if (!matchSearch) return false
      if (activeFilter === 'All') return true
      if (activeFilter === 'Recently Attempted') return recentPracticeIds.includes(item.id)
      if (activeFilter === 'WAEC') return `${item.name} ${item.subjectName}`.toLowerCase().includes('waec')
      if (activeFilter === 'JAMB') return `${item.name} ${item.subjectName}`.toLowerCase().includes('jamb')
      if (activeFilter === 'Short Duration') return (item._count?.questions || 0) <= 40
      return true
    })
  }, [practices, search, activeFilter, recentPracticeIds])

  const featuredPractices = useMemo(() => practices.slice(0, 3), [practices])

  const catalogStats = useMemo(() => {
    const subjects = new Set(practices.map((p) => p.subjectName)).size
    const classLevels = new Set(practices.map((p) => p.classLabel).filter(Boolean)).size
    return {
      available: practices.length,
      classLevels,
      subjects,
    }
  }, [practices])

  return (
    <PremiumAppShell>
      <div className="space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-hero-gradient relative overflow-hidden rounded-3xl border p-4 sm:p-6 md:p-7"
        >
          <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Practice Catalog</p>
          <h1 className="premium-heading mt-2 text-2xl font-bold sm:text-3xl md:text-4xl">Find the perfect practice session</h1>
          <p className="premium-text-muted mt-2 max-w-3xl">
            Browse subjects and exam sets. Pick a session and start practicing at your own pace.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/practice/attempts" className="premium-btn-primary premium-btn-sm rounded-lg px-3 py-1.5 text-xs font-semibold">
              Resume Last Practice
            </Link>
            <Link to="/study-planner" className="premium-btn-secondary premium-btn-sm rounded-lg border px-3 py-1.5 text-xs font-semibold">
              View Study Planner
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
            {[
              { label: 'Available Sets', value: catalogStats.available, icon: BookOpen },
              { label: 'Class Levels', value: catalogStats.classLevels, icon: Target },
              { label: 'Subjects', value: catalogStats.subjects, icon: Flame },
              { label: 'Ready to Practice', value: catalogStats.available > 0 ? 'Yes' : '—', icon: Trophy },
            ].map((item) => (
              <div key={item.label} className="premium-inset rounded-xl border p-2.5 sm:p-3" style={{ borderColor: 'var(--premium-card-border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="premium-text-soft min-w-0 text-[10px] leading-snug sm:text-xs">{item.label}</p>
                  <item.icon size={13} className="premium-accent mt-0.5 shrink-0" />
                </div>
                <p className="premium-heading mt-1.5 text-base font-semibold sm:mt-2 sm:text-lg">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            <article className="premium-card rounded-2xl border p-4 backdrop-blur-md">
              <div className="premium-catalog-search flex items-center gap-3 rounded-xl px-3 py-2">
                <Search size={16} className="premium-accent shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, subject, or class"
                  className="premium-input w-full border-0 bg-transparent text-sm outline-none focus:outline-none focus:ring-0"
                />
                <button type="button" className="premium-pill rounded-lg p-2" aria-label="Filters">
                  <SlidersHorizontal size={15} className="premium-accent" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {FILTER_PILLS.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setActiveFilter(pill)}
                    className={`premium-pill-compact rounded-full px-2 py-0.5 text-[10px] ${activeFilter === pill ? 'premium-pill-active' : 'premium-pill'}`}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </article>

            {featuredPractices.length > 0 ? (
              <article className="premium-card rounded-2xl border p-4 sm:p-5">
                <h3 className="text-lg font-semibold">Featured Practices</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredPractices.map((pack) => (
                    <motion.div
                      key={pack.id}
                      whileHover={{ y: -2 }}
                      className="premium-inset flex flex-col rounded-2xl border p-4"
                      style={{ borderColor: 'var(--premium-card-border)' }}
                    >
                      <h4 className="text-sm font-semibold">{pack.name}</h4>
                      <div className="premium-text-soft mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span>{pack._count?.questions || 0} Qs</span>
                        <span>•</span>
                        <span>{pack.subjectName}</span>
                        <span>•</span>
                        <span>{pack.classLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPracticeToStart(pack)}
                        className="premium-btn-primary premium-btn-sm mt-3 w-full rounded-lg px-2.5 py-1 text-center text-[11px] font-semibold"
                      >
                        Start
                      </button>
                    </motion.div>
                  ))}
                </div>
              </article>
            ) : null}

            <article className="premium-card rounded-2xl border p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Practices</h3>
                <span className="premium-text-soft text-xs">{filtered.length} sessions</span>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="premium-inset h-20 animate-pulse rounded-xl border" style={{ borderColor: 'var(--premium-card-border)' }} />
                  ))}
                </div>
              ) : error ? (
                <p className="text-sm text-rose-400">{error}</p>
              ) : filtered.length === 0 ? (
                <div className="premium-inset rounded-2xl border p-5 text-center sm:p-8" style={{ borderColor: 'var(--premium-card-border)' }}>
                  <BookOpen size={34} className="premium-accent mx-auto" />
                  <h4 className="mt-3 text-lg font-semibold">No matching practice found</h4>
                  <p className="premium-text-soft mt-1 text-sm">Try a different search term or filter.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((item) => (
                    <motion.article
                      key={item.id}
                      whileHover={{ y: -1 }}
                      className="premium-inset flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition"
                      style={{ borderColor: 'var(--premium-card-border)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="premium-text-soft mt-1 text-xs">
                          {item.subjectName} · {item.classLabel}
                        </p>
                        <div className="premium-text-soft mt-2 flex items-center gap-2 text-xs">
                          <Clock3 size={12} className="premium-accent" />
                          <span>{Math.max(20, Math.round((item._count?.questions || 20) / 2))} mins</span>
                          <span>·</span>
                          <span>{item._count?.questions || 0} questions</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPracticeToStart(item)}
                        className="premium-btn-primary premium-btn-sm shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold"
                      >
                        Start
                      </button>
                    </motion.article>
                  ))}
                </div>
              )}
            </article>
          </div>

          <aside className="space-y-4">
            <article className="premium-card rounded-2xl border p-4 sm:p-5">
              <h3 className="text-lg font-semibold">Catalog Overview</h3>
              <div className="premium-text-muted mt-3 space-y-2 text-sm">
                <p>
                  <span className="premium-text-soft">Sets available:</span> {catalogStats.available}
                </p>
                <p>
                  <span className="premium-text-soft">Class levels:</span> {catalogStats.classLevels}
                </p>
                <p>
                  <span className="premium-text-soft">Subjects covered:</span> {catalogStats.subjects}
                </p>
              </div>
              <div className="premium-inset premium-text-soft mt-3 rounded-xl p-3 text-xs">
                Complete a set and review your results under My Attempts.
              </div>
            </article>

          </aside>
        </section>
      </div>

      <PracticeStartModal
        practice={practiceToStart}
        open={!!practiceToStart}
        onClose={() => setPracticeToStart(null)}
        onStart={() => {
          if (!practiceToStart) return
          const id = practiceToStart.id
          setPracticeToStart(null)
          navigate(`/practice/${id}/take`)
        }}
      />
    </PremiumAppShell>
  )
}
