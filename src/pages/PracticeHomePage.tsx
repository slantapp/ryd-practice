import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Target, Trophy } from 'lucide-react'
import { PremiumAppShell } from '../components/PremiumAppShell'
import { useAuth } from '../context/AuthContext'
import { practiceApi } from '../lib/practiceApi'
import type { PracticeLeaderboardResponse } from '../types'

export function PracticeHomePage() {
  const { user } = useAuth()
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'You'
  const [leaderboard, setLeaderboard] = useState<PracticeLeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await practiceApi.getLeaderboard(15)
        setLeaderboard(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const hasEntries = (leaderboard?.entries.length ?? 0) > 0

  return (
    <PremiumAppShell>
      <div className="space-y-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-hero-gradient relative overflow-hidden rounded-3xl border p-7"
        >
          <p className="premium-accent text-[11px] uppercase tracking-[0.2em]">Global Rankings</p>
          <h1 className="premium-heading mt-2 text-4xl font-bold">Practice Leaderboard</h1>
          <p className="premium-text-muted mt-2 max-w-2xl">
            Rankings are based on average scores across completed practice sessions on RYD Practice.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to="/practice/catalog" className="premium-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
              Start Practicing
            </Link>
            <Link to="/practice/attempts" className="premium-btn-secondary rounded-xl border px-4 py-2 text-sm font-semibold">
              My Attempts
            </Link>
          </div>
        </motion.section>

        <section className="premium-card rounded-2xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Trophy size={18} className="premium-accent" />
              Top performers
            </h3>
            {leaderboard?.totalRanked ? (
              <span className="premium-text-soft text-xs">{leaderboard.totalRanked} students ranked</span>
            ) : null}
          </div>

          {loading ? (
            <p className="premium-text-muted text-sm">Loading leaderboard...</p>
          ) : error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : !hasEntries ? (
            <div className="py-8 text-center">
              <Trophy size={36} className="premium-accent mx-auto" />
              <p className="premium-text-muted mt-3 text-sm">
                Hi {fullName.split(' ')[0] || 'there'} — complete a practice set to appear on the leaderboard.
              </p>
              <Link to="/practice/catalog" className="premium-btn-primary mt-4 inline-block rounded-xl px-4 py-2 text-sm font-semibold">
                Browse Practices
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard?.entries.map((row) => (
                <div
                  key={row.studentId}
                  className={`premium-inset flex items-center justify-between rounded-xl px-4 py-3 ${
                    row.isCurrentUser ? 'ring-1 ring-[#d05ac0]/50' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="premium-accent w-8 shrink-0 text-sm font-bold">#{row.rank}</span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {row.displayName}
                        {row.isCurrentUser ? <span className="premium-accent ml-1 text-xs">(You)</span> : null}
                      </p>
                      {row.state ? (
                        <p className="premium-text-soft text-xs">{row.state}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="premium-accent font-semibold">{row.averageScore}% avg</p>
                    <p className="premium-text-soft text-xs">
                      {row.completedSessions} session{row.completedSessions === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {leaderboard?.currentUser &&
          !leaderboard.entries.some((e) => e.studentId === leaderboard.currentUser?.studentId) ? (
            <div className="premium-inset mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--premium-card-border)' }}>
              <p className="premium-text-soft text-xs uppercase tracking-wide">Your rank</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-medium">
                  #{leaderboard.currentUser.rank} — {leaderboard.currentUser.displayName}
                </span>
                <span className="premium-accent font-semibold">{leaderboard.currentUser.averageScore}% avg</span>
              </div>
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-4">
          <article className="premium-card rounded-2xl border p-5">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Target size={16} className="premium-accent" /> How to climb
            </h3>
            <ul className="premium-text-muted mt-3 list-inside list-disc space-y-2 text-sm">
              <li>Complete daily practice sets</li>
              <li>Aim for high accuracy on each attempt</li>
              <li>Review mistakes within 24 hours</li>
            </ul>
          </article>
          <article className="premium-card rounded-2xl border p-5">
            <h3 className="text-lg font-semibold">Your progress</h3>
            <p className="premium-text-muted mt-2 text-sm">
              Track scores and paused sessions on the My Attempts page after you finish practice sets.
            </p>
            <Link to="/practice/attempts" className="premium-accent mt-4 inline-block text-sm font-semibold">
              View My Attempts →
            </Link>
          </article>
        </section>
      </div>
    </PremiumAppShell>
  )
}
