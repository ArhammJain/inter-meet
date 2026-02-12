import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'

export default function AuthErrorPage() {
  return (
    <div className="page-center">
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
        <ThemeSwitcher />
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--danger)' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          There was an error during authentication. Please try signing in again.
        </p>
        <Link href="/auth/login" className="btn btn-primary btn-lg">
          Back to Login
        </Link>
      </div>
    </div>
  )
}
