'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setCreating(true)
    setError('')

    const code = generateRoomCode()

    const { data, error: insertError } = await supabase
      .from('rooms')
      .insert({
        name: newRoomName || 'My Meeting',
        room_code: code,
        creator_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setCreating(false)
    } else {
      router.push(`/room/${data.room_code}`)
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.trim().toUpperCase()}`)
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.logo}>InterMeet</h1>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user?.email}</span>
          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.greeting}>
          <h2 style={styles.greetingTitle}>
            Welcome, {user?.user_metadata?.full_name || 'there'}
          </h2>
          <p style={styles.greetingText}>
            Create a new meeting or join an existing one.
          </p>
        </div>

        <div style={styles.grid}>
          {/* Create Room Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>New Meeting</h3>
            <form onSubmit={handleCreateRoom} style={styles.form}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Meeting name (optional)"
                style={styles.input}
              />
              <button type="submit" disabled={creating} style={styles.primaryBtn}>
                {creating ? 'Creating...' : 'Create Meeting'}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Join Meeting</h3>
            <form onSubmit={handleJoinRoom} style={styles.form}>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter room code"
                required
                maxLength={6}
                style={{
                  ...styles.input,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  fontWeight: 600,
                }}
              />
              <button type="submit" style={styles.secondaryBtn}>
                Join Meeting
              </button>
            </form>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userEmail: {
    fontSize: '0.85rem',
    color: 'var(--muted)',
  },
  signOutBtn: {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--foreground)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    padding: '3rem 2rem',
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto',
  },
  greeting: {
    marginBottom: '2.5rem',
  },
  greetingTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
  },
  greetingText: {
    color: 'var(--muted)',
    fontSize: '0.95rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  input: {
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--input-bg)',
    color: 'var(--foreground)',
    fontSize: '0.9rem',
    outline: 'none',
  },
  primaryBtn: {
    padding: '0.625rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '0.625rem',
    borderRadius: '8px',
    border: '1px solid var(--primary)',
    background: 'transparent',
    color: 'var(--primary)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    marginTop: '1.5rem',
    padding: '0.625rem',
    borderRadius: '8px',
    background: '#fef2f2',
    color: '#dc2626',
    fontSize: '0.85rem',
    border: '1px solid #fecaca',
  },
}
