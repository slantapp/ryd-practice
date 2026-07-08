import type { ReactNode } from 'react'
import { PracticeTopNav } from './PracticeTopNav'

export function PracticeShell({ children }: { children: ReactNode }) {
  return (
    <main className="practice-dashboard-shell">
      <PracticeTopNav />
      <section className="practice-main-area">
        {children}
      </section>
    </main>
  )
}
