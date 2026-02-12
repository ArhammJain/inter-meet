'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useToast } from '@/components/Toast'

import Reactions from '@/components/Reactions'
import NetworkQuality from '@/components/NetworkQuality'
import { createClient } from '@/lib/supabase/client'

type Stage = 'prejoin' | 'lobby' | 'password' | 'connecting' | 'connected' | 'error'

interface BreakoutRoom {
  id: string
  name: string
  room_code: string
  is_active: boolean
  participantCount: number
}

interface LobbyEntry {
  id: string
  user_id: string
  display_name: string
  status: string
}

function playSound(type: 'join' | 'leave') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.value = 0.1
    osc.frequency.value = type === 'join' ? 800 : 400
    osc.type = 'sine'
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch { /* ignore */ }
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { toast } = useToast()
  const supabase = createClient()

  const [stage, setStage] = useState<Stage>('prejoin')
  const [token, setToken] = useState('')
  const [roomName, setRoomName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isCreator, setIsCreator] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false)
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState('')


  const [showBreakout, setShowBreakout] = useState(false)
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([])
  const [breakoutName, setBreakoutName] = useState('')
  const [creatingBreakout, setCreatingBreakout] = useState(false)
  const [lobbyEntries, setLobbyEntries] = useState<LobbyEntry[]>([])

  const [videoEnabled, setVideoEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    if (stage !== 'connected') return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'm' || e.key === 'M') {
        setAudioEnabled((p) => { toast(!p ? 'Mic on' : 'Mic muted', 'info'); return !p })
      }
      if (e.key === 'v' || e.key === 'V') {
        setVideoEnabled((p) => { toast(!p ? 'Camera on' : 'Camera off', 'info'); return !p })
      }
      if (e.key === 'l' || e.key === 'L') router.push('/dashboard')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stage, toast, router])

  // Camera preview
  useEffect(() => {
    if (stage !== 'prejoin') return
    let cancelled = false
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: videoEnabled, audio: audioEnabled })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch { /* ignore */ }
    }
    start()
    return () => { cancelled = true; streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null }
  }, [stage, videoEnabled, audioEnabled])

  const stopPreview = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null }

  const handleJoin = useCallback(async (enteredPassword?: string) => {
    setStage('connecting')
    stopPreview()
    try {
      const res = await fetch('/api/livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, password: enteredPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.requiresPassword) { setStage('password'); if (enteredPassword) toast('Incorrect password', 'error'); return }
        if (data.requiresLobby) {
          setStage('lobby')
          await fetch('/api/room-lobby', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomCode: code }) })
          return
        }
        setError(data.error || 'Failed to join'); setStage('error'); return
      }
      setToken(data.token); setRoomName(data.roomName); setRoomCode(data.roomCode)
      setIsCreator(data.isCreator); setParticipantCount(data.participantCount)
      setMaxParticipants(data.maxParticipants); setWaitingRoomEnabled(data.waitingRoomEnabled)
      setStage('connected'); playSound('join')
    } catch { setError('Failed to connect to server'); setStage('error') }
  }, [code, toast])

  // Poll lobby when waiting
  useEffect(() => {
    if (stage !== 'lobby') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/room-lobby?roomCode=${code}&action=check`)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'admitted') handleJoin()
          else if (data.status === 'rejected') { setError('Host declined your request'); setStage('error') }
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [stage, code, handleJoin])

  // Realtime lobby entries for creator
  useEffect(() => {
    if (!isCreator || !waitingRoomEnabled || stage !== 'connected') return
    // Initial fetch
    const fetchLobby = async () => {
      try {
        const res = await fetch(`/api/room-lobby?roomCode=${code}&action=list`)
        if (res.ok) { const d = await res.json(); setLobbyEntries(d.entries || []) }
      } catch { /* ignore */ }
    }
    fetchLobby()

    // Subscribe to realtime lobby changes
    const channel = supabase
      .channel(`lobby-${code}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lobby' },
        () => { fetchLobby() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isCreator, waitingRoomEnabled, stage, code, supabase])

  const handleAdmitReject = async (userId: string, action: 'admit' | 'reject') => {
    await fetch('/api/room-lobby', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomCode: code, userId, action }) })
    setLobbyEntries((prev) => prev.filter((e) => e.user_id !== userId))
    toast(action === 'admit' ? 'User admitted' : 'User rejected', 'info')
  }

  const handleDisconnect = useCallback(() => { playSound('leave'); router.push('/dashboard') }, [router])

  const handleEndMeeting = async () => {
    setEnding(true)
    try {
      const res = await fetch('/api/end-room', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomCode: code }) })
      if (res.ok) { toast('Meeting ended for everyone', 'success'); router.push('/dashboard') }
      else { const d = await res.json(); toast(d.error || 'Failed to end meeting', 'error') }
    } catch { toast('Failed to end meeting', 'error') }
    setEnding(false)
  }

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${code}`)
    setCopied(true); toast('Invite link copied!', 'success'); setTimeout(() => setCopied(false), 2000)
  }

  const fetchBreakoutRooms = useCallback(async () => {
    try { const res = await fetch(`/api/breakout-rooms?parentRoomCode=${code}`); if (res.ok) { const d = await res.json(); setBreakoutRooms(d.breakoutRooms || []) } } catch { /* ignore */ }
  }, [code])

  const handleCreateBreakout = async () => {
    if (creatingBreakout) return; setCreatingBreakout(true)
    try {
      const res = await fetch('/api/breakout-rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentRoomCode: code, breakoutName: breakoutName || undefined }) })
      if (res.ok) { toast('Breakout room created!', 'success'); setBreakoutName(''); fetchBreakoutRooms() }
      else { const d = await res.json(); toast(d.error || 'Failed', 'error') }
    } catch { toast('Failed to create breakout room', 'error') }
    setCreatingBreakout(false)
  }

  useEffect(() => {
    if (showBreakout && stage === 'connected') {
      const timeout = setTimeout(fetchBreakoutRooms, 0)
      const i = setInterval(fetchBreakoutRooms, 10000)
      return () => { clearTimeout(timeout); clearInterval(i) }
    }
  }, [showBreakout, stage, fetchBreakoutRooms])

  // ===== RENDER =====

  if (stage === 'prejoin') {
    return (
      <div className="page-center" role="main" aria-label="Pre-join screen">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 520, width: '100%' }}>
          <span className="brand-logo" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>InterMeet</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>Ready to join?</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Room <span style={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-xs)' }}>{code}</span>
          </p>
          <div className={`video-preview${!videoEnabled ? ' video-preview-off' : ''}`} aria-label="Camera preview">
            {videoEnabled ? <video ref={videoRef} autoPlay playsInline muted /> : <><span style={{ fontSize: '2.5rem' }}>📷</span><span>Camera is off</span></>}
          </div>
          <div className="media-controls" role="toolbar" aria-label="Media controls">
            <button className={`media-btn${audioEnabled ? ' active' : ' off'}`} onClick={() => setAudioEnabled(!audioEnabled)} aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'} aria-pressed={audioEnabled}>
              {audioEnabled ? '🎙️' : '🔇'}
            </button>
            <button className={`media-btn${videoEnabled ? ' active' : ' off'}`} onClick={() => setVideoEnabled(!videoEnabled)} aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'} aria-pressed={videoEnabled}>
              {videoEnabled ? '📹' : '🚫'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', width: '100%', maxWidth: 340 }}>
            <button className="btn btn-outline" onClick={() => router.push('/dashboard')} style={{ flex: 1 }}>Cancel</button>
            <button className="btn btn-primary btn-lg" onClick={() => handleJoin()} style={{ flex: 2 }}>Join Meeting →</button>
          </div>
          <p style={{ color: 'var(--muted-light)', fontSize: '0.7rem', marginTop: '1.25rem' }}>
            Shortcuts: <kbd>M</kbd> mute · <kbd>V</kbd> camera · <kbd>L</kbd> leave
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'password') {
    return (
      <div className="page-center" role="main">
        <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Password Required</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>This room is password-protected.</p>
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(password) }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter room password" required autoFocus aria-label="Room password" style={{ textAlign: 'center' }} />
            <button type="submit" className="btn btn-primary btn-full">Join Meeting →</button>
          </form>
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm" style={{ marginTop: '1rem' }}>← Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (stage === 'lobby') {
    return (
      <div className="page-center" role="main">
        <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', animation: 'pulse-glow 2s ease-in-out infinite' }}>⏳</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Waiting Room</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>The host will let you in shortly...</p>
          <button onClick={() => router.push('/dashboard')} className="btn btn-outline btn-sm">← Leave</button>
        </div>
      </div>
    )
  }

  if (stage === 'connecting') {
    return (
      <div className="page-center" role="main">
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', animation: 'pulse-glow 2s ease-in-out infinite' }}>🔗</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Joining meeting...</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '0.15em' }}>{code}</p>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="page-center" role="main">
        <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>❌</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--danger)' }}>Cannot Join Room</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => router.push('/dashboard')} className="btn btn-primary btn-lg">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  // Connected
  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--background)' }} role="main">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'var(--card-bg)', backdropFilter: 'var(--backdrop-blur)', borderBottom: '1px solid var(--border)', zIndex: 10, flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem' }} role="banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span className="brand-logo" style={{ fontSize: '0.9rem' }}>InterMeet</span>
          <span style={{ color: 'var(--border)', fontSize: '0.8rem' }}>|</span>
          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{roomName}</span>
          <span className="hide-mobile" style={{ color: 'var(--muted-light)', fontSize: '0.7rem', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{roomCode}</span>
          <span className="participant-badge">{participantCount}/{maxParticipants}</span>
          <NetworkQuality />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          <Reactions />
          <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copyInviteLink}>{copied ? '✓ Copied' : '📋 Invite'}</button>
          {isCreator && <button className="btn btn-outline btn-sm" onClick={() => setShowBreakout(!showBreakout)}>{showBreakout ? '✕ Close' : '🔀 Breakout'}</button>}
          {isCreator && <button className="btn btn-danger btn-sm" onClick={handleEndMeeting} disabled={ending}>{ending ? 'Ending...' : 'End Meeting'}</button>}
        </div>
      </div>

      {/* Lobby bar for creator */}
      {isCreator && lobbyEntries.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', background: 'var(--success-bg)', borderBottom: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flexShrink: 0 }} role="alert">
          <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Waiting:</span>
          {lobbyEntries.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.8rem' }}>{e.display_name}</span>
              <button className="btn btn-primary btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleAdmitReject(e.user_id, 'admit')}>Admit</button>
              <button className="btn btn-danger btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleAdmitReject(e.user_id, 'reject')}>Reject</button>
            </div>
          ))}
        </div>
      )}

      {/* Breakout panel */}
      {showBreakout && isCreator && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: breakoutRooms.length > 0 ? '0.75rem' : 0 }}>
            <input className="input" value={breakoutName} onChange={(e) => setBreakoutName(e.target.value)} placeholder="Breakout room name" maxLength={100} style={{ flex: 1, padding: '0.375rem 0.625rem', fontSize: '0.8rem' }} />
            <button className="btn btn-primary btn-sm" onClick={handleCreateBreakout} disabled={creatingBreakout}>{creatingBreakout ? 'Creating...' : 'Create'}</button>
          </div>
          {breakoutRooms.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {breakoutRooms.map((br) => (
                <div key={br.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.625rem', background: 'var(--input-bg)', borderRadius: 6, fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 500 }}>{br.name}</span>
                  <span className="participant-badge">{br.participantCount}</span>
                  <button className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => window.open(`/room/${br.room_code}`, '_blank')}>Join</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <LiveKitRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} connect={true} video={videoEnabled} audio={audioEnabled} onDisconnected={handleDisconnect} data-lk-theme="default" style={{ height: '100%', width: '100%' }}>
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  )
}
