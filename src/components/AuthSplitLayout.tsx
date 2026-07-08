import type { ReactNode } from 'react'

export function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-split">
      <section className="auth-visual">
        <img src="/auth-classroom.png" alt="Students in a computer-based test classroom" />
      </section>
      <section className="auth-panel">
        <div className="auth-card auth-card--flat">{children}</div>
      </section>
    </main>
  )
}
