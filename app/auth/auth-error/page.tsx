import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Authentication Error</h1>
        <p style={styles.message}>
          Something went wrong during authentication. Please try again.
        </p>
        <Link href="/auth/login" style={styles.button}>
          Back to Login
        </Link>
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
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: 'var(--danger)',
  },
  message: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  button: {
    display: 'inline-block',
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
}
