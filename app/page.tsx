import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'

const FEATURES = [
  { icon: '📹', title: 'HD Video & Audio', desc: 'Crystal-clear conferencing powered by LiveKit\'s low-latency infrastructure' },
  { icon: '🔒', title: 'Secure Rooms', desc: 'Password protection, waiting rooms, and encrypted connections' },
  { icon: '💬', title: 'In-Call Chat', desc: 'Real-time messaging with persistent history for every meeting' },
  { icon: '👥', title: 'Breakout Rooms', desc: 'Split into focused groups for workshops and brainstorming' },
  { icon: '🎯', title: 'Smart Controls', desc: 'Keyboard shortcuts, reactions, and intuitive media controls' },
  { icon: '♾️', title: 'Persistent Links', desc: 'Create reusable meeting rooms that never expire' },
]

const STATS = [
  { value: '99.9%', label: 'Uptime' },
  { value: '<100ms', label: 'Latency' },
  { value: 'E2E', label: 'Encrypted' },
]

export default function Home() {
  return (
    <div className="page-full">
      {/* Nav */}
      <header style={{
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card-bg)',
        backdropFilter: 'var(--backdrop-blur)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <span className="brand-logo">InterMeet</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <ThemeSwitcher />
          <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{
          textAlign: 'center',
          padding: 'clamp(4rem, 10vw, 8rem) 1.5rem clamp(3rem, 8vw, 6rem)',
          maxWidth: 720,
          margin: '0 auto',
          position: 'relative',
        }}>
          <div className="section-badge">✨ Open Source & Free</div>
          <h1 style={{
            fontSize: 'clamp(2.25rem, 5.5vw, 4rem)',
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '1.25rem',
          }}>
            Video meetings,<br />
            <span className="gradient-text">made brilliant</span>
          </h1>
          <p style={{
            color: 'var(--muted)',
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            lineHeight: 1.7,
            maxWidth: 520,
            margin: '0 auto 2.5rem',
          }}>
            Create or join secure HD video meetings in seconds. No downloads, no friction — just click and connect.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/signup" className="btn btn-primary btn-lg">
              Start for Free →
            </Link>
            <Link href="/auth/login" className="btn btn-outline btn-lg">
              Sign In
            </Link>
          </div>

          {/* Trust stats */}
          <div style={{
            display: 'flex',
            gap: '2.5rem',
            justifyContent: 'center',
            marginTop: '3.5rem',
            flexWrap: 'wrap',
          }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.15rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{
          padding: '3rem 1.5rem 5rem',
          maxWidth: 960,
          margin: '0 auto',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-badge">🚀 Features</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Everything you need
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Built for teams who value simplicity and reliability
            </p>
          </div>
          <div className="responsive-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{
          textAlign: 'center',
          padding: '4rem 1.5rem 5rem',
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Create your free account and start hosting meetings in under 30 seconds.
          </p>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            Create Free Account →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '0.75rem',
      }}>
        <span className="brand-logo" style={{ fontSize: '0.9rem' }}>InterMeet</span>
        <span style={{ margin: '0 0.5rem' }}>·</span>
        Open-source video conferencing built with Next.js, LiveKit & Supabase
      </footer>
    </div>
  )
}
