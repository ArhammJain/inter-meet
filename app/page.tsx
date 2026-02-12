import Link from 'next/link'

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>InterMeet</h1>
        <p style={styles.subtitle}>
          Video conferencing made simple. Create or join meetings instantly.
        </p>
        <div style={styles.actions}>
          <Link href="/auth/login" style={styles.primaryBtn}>
            Sign In
          </Link>
          <Link href="/auth/signup" style={styles.secondaryBtn}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '480px',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    marginBottom: '1rem',
  },
  subtitle: {
    color: 'var(--muted)',
    fontSize: '1.1rem',
    lineHeight: 1.6,
    marginBottom: '2rem',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
}
