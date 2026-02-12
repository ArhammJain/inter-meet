'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import type { User } from '@supabase/supabase-js'

interface Room {
  id: string
  name: string
  room_code: string
  created_at: string
  is_active: boolean
  creator_id: string
}

interface MeetingHistory {
  id: string
  joined_at: string
  left_at: string | null
  rooms: Room
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [roomCode, setRoomCode] = useState('')
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomPassword, setNewRoomPassword] = useState('')
  const [isPersistent, setIsPersistent] = useState(false)
  const [waitingRoom, setWaitingRoom] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [history, setHistory] = useState<MeetingHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeRoomCounts, setActiveRoomCounts] = useState<Record<string, number>>({})
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (user) {
        const { data: meetings } = await supabase
          .from('participants')
          .select('id, joined_at, left_at, rooms(id, name, room_code, created_at, is_active, creator_id)')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(20)

        if (meetings) {
          const parsed = meetings as unknown as MeetingHistory[]
          setHistory(parsed)

          const activeRoomIds = parsed.filter((m) => m.rooms?.is_active).map((m) => m.rooms.id)

          if (activeRoomIds.length > 0) {
            const { data: counts } = await supabase
              .from('participants')
              .select('room_id')
              .in('room_id', activeRoomIds)
              .is('left_at', null)

            if (counts) {
              const countMap: Record<string, number> = {}
              counts.forEach((c: { room_id: string }) => { countMap[c.room_id] = (countMap[c.room_id] || 0) + 1 })
              setActiveRoomCounts(countMap)
            }

            realtimeChannel = supabase
              .channel('dashboard-participants')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, (payload) => {
                const roomId = (payload.new as { room_id?: string })?.room_id || (payload.old as { room_id?: string })?.room_id
                if (!roomId || !activeRoomIds.includes(roomId)) return
                supabase.from('participants').select('room_id').eq('room_id', roomId).is('left_at', null)
                  .then(({ data }) => { if (data) setActiveRoomCounts((prev) => ({ ...prev, [roomId]: data.length })) })
              })
              .subscribe()
          }
        }
        setHistoryLoading(false)
      }
    }
    init()
    return () => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const sanitizeRoomName = (name: string) => name.replace(/[<>"'&]/g, '').trim().slice(0, 100)

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setCreating(true)

    const roomName = sanitizeRoomName(newRoomName) || 'My Meeting'

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode()
      const insertData: Record<string, unknown> = { name: roomName, room_code: code, creator_id: user.id }
      if (isPersistent) insertData.is_persistent = true
      if (waitingRoom) insertData.waiting_room_enabled = true
      if (newRoomPassword.trim()) insertData.password_hash = newRoomPassword.trim()

      const { data, error: insertError } = await supabase.from('rooms').insert(insertData).select().single()

      if (!insertError && data) {
        toast('Meeting created!', 'success')
        router.push(`/room/${data.room_code}`)
        return
      }

      if (insertError && !insertError.message.includes('duplicate') && !insertError.message.includes('unique')) {
        toast(insertError.message, 'error')
        setCreating(false)
        return
      }
    }

    toast('Failed to generate a unique room code. Please try again.', 'error')
    setCreating(false)
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (code.length !== 6) { toast('Room code must be 6 characters', 'error'); return }
    router.push(`/room/${code}`)
  }

  const copyInviteLink = useCallback(async (code: string) => {
    const url = `${window.location.origin}/room/${code}`
    await navigator.clipboard.writeText(url)
    setCopiedCode(code)
    toast('Invite link copied!', 'success')
    setTimeout(() => setCopiedCode(null), 2000)
  }, [toast])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="page-full">
        <header className="header-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', backdropFilter: 'var(--backdrop-blur)' }}>
          <div className="skeleton" style={{ width: 100, height: 24 }} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 70, height: 38, borderRadius: 10 }} />
          </div>
        </header>
        <main className="main-responsive" style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: 840, width: '100%', margin: '0 auto' }}>
          <div className="skeleton" style={{ width: 250, height: 32, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 320, height: 18, marginBottom: 40 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
            <div className="skeleton" style={{ height: 180, borderRadius: 14 }} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-full">
      {/* Header */}
      <header className="header-responsive" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 2rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card-bg)',
        backdropFilter: 'var(--backdrop-blur)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <span className="brand-logo">InterMeet</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href="/dashboard/analytics" className="btn btn-ghost btn-sm hide-mobile">📊 Analytics</Link>
          <Link href="/dashboard/profile" className="btn btn-ghost btn-sm hide-mobile">
            {user?.user_metadata?.full_name || user?.email}
          </Link>
          <ThemeSwitcher />
          <button onClick={handleSignOut} className="btn btn-outline btn-sm">Sign Out</button>
        </div>
      </header>

      <main className="main-responsive" style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: 840, width: '100%', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Welcome, {user?.user_metadata?.full_name || 'there'} 👋
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Create a new meeting or join an existing one.
          </p>
        </div>

        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Create Room */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>➕</span> New Meeting
            </h3>
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                className="input"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Meeting name (optional)"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', padding: '0.25rem 0', fontSize: '0.75rem' }}
              >
                {showAdvanced ? '▾ Hide options' : '▸ Advanced options'}
              </button>
              {showAdvanced && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  padding: '0.875rem',
                  background: 'var(--background-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                }}>
                  <input
                    type="password"
                    className="input"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    placeholder="Room password (optional)"
                    maxLength={50}
                    style={{ fontSize: '0.825rem' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer', color: 'var(--foreground)' }}>
                    <input type="checkbox" checked={isPersistent} onChange={(e) => setIsPersistent(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    Persistent room (no 24h expiry)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', cursor: 'pointer', color: 'var(--foreground)' }}>
                    <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                    Enable waiting room
                  </label>
                </div>
              )}
              <button type="submit" disabled={creating} className="btn btn-primary btn-full">
                {creating ? 'Creating...' : 'Create Meeting →'}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🔗</span> Join Meeting
            </h3>
            <form onSubmit={handleJoinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                type="text"
                className="input"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Enter 6-digit code"
                maxLength={6}
                style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, textAlign: 'center', fontSize: '1.1rem' }}
              />
              <button type="submit" className="btn btn-secondary btn-full" disabled={roomCode.length !== 6}>
                Join Meeting →
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📋</span> Recent Meetings
          </h3>

          {historyLoading ? (
            <div className="history-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
              No meetings yet. Create one to get started!
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-info">
                    <div className="history-item-name">{item.rooms?.name || 'Untitled Meeting'}</div>
                    <div className="history-item-meta">
                      <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{item.rooms?.room_code}</span>
                      <span style={{ margin: '0 0.35rem' }}>·</span>
                      {formatDate(item.joined_at)}
                      {item.rooms?.is_active && activeRoomCounts[item.rooms.id] ? (
                        <span className="participant-badge" style={{ marginLeft: '0.5rem' }}>
                          🟢 {activeRoomCounts[item.rooms.id]} in call
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    <button
                      className={`copy-btn${copiedCode === item.rooms?.room_code ? ' copied' : ''}`}
                      onClick={() => copyInviteLink(item.rooms.room_code)}
                    >
                      {copiedCode === item.rooms?.room_code ? '✓ Copied' : 'Copy Link'}
                    </button>
                    {item.rooms?.is_active && (
                      <button className="btn btn-primary btn-sm" onClick={() => router.push(`/room/${item.rooms.room_code}`)}>
                        Rejoin
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
