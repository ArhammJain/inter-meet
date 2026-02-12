'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react'
import '@livekit/components-styles'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [token, setToken] = useState('')
  const [roomName, setRoomName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getToken = async () => {
      try {
        const res = await fetch('/api/livekit-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: code }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to join room')
          setLoading(false)
          return
        }

        setToken(data.token)
        setRoomName(data.roomName)
        setLoading(false)
      } catch {
        setError('Failed to connect to server')
        setLoading(false)
      }
    }

    getToken()
  }, [code])

  const handleDisconnect = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingCard}>
          <h2 style={styles.loadingTitle}>Joining meeting...</h2>
          <p style={styles.loadingText}>Room: {code}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={styles.errorCard}>
          <h2 style={styles.errorTitle}>Cannot Join Room</h2>
          <p style={styles.errorText}>{error}</p>
          <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.roomContainer}>
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ height: '100vh', width: '100vw' }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  loadingCard: {
    textAlign: 'center' as const,
  },
  loadingTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },
  loadingText: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
  },
  errorCard: {
    textAlign: 'center' as const,
    maxWidth: '400px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '2rem',
  },
  errorTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: 'var(--danger)',
  },
  errorText: {
    color: 'var(--muted)',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  },
  backBtn: {
    padding: '0.625rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  roomContainer: {
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
}
