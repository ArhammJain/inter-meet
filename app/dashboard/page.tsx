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
  }, [supabase])

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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="w-24 h-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="w-20 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
          <div className="w-64 h-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-6 md:px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          InterMeet
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/analytics" className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            📊 Analytics
          </Link>
          <Link href="/dashboard/profile" className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            {user?.user_metadata?.full_name || user?.email}
          </Link>
          <div className="h-4 w-px bg-zinc-200 dark:bg-white/10 mx-1 hidden md:block" />
          <ThemeSwitcher />
          <button 
            onClick={handleSignOut} 
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            Welcome, {user?.user_metadata?.full_name || 'there'} 👋
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Create a new meeting or join an existing one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Room */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:border-indigo-500/30 transition-colors">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">➕</span> New Meeting
            </h3>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <input
                type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-zinc-500"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Meeting name (optional)"
                maxLength={100}
              />
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-zinc-500 hover:text-indigo-500 transition-colors flex items-center gap-1"
              >
                {showAdvanced ? '▾ Hide options' : '▸ Advanced options'}
              </button>
              {showAdvanced && (
                <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-white/5 animate-in slide-in-from-top-2">
                  <input
                    type="password"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all placeholder-zinc-500"
                    value={newRoomPassword}
                    onChange={(e) => setNewRoomPassword(e.target.value)}
                    placeholder="Room password (optional)"
                    maxLength={50}
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input type="checkbox" checked={isPersistent} onChange={(e) => setIsPersistent(e.target.checked)} className="accent-indigo-500 w-4 h-4 rounded" />
                    Persistent room (no 24h expiry)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                    <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="accent-indigo-500 w-4 h-4 rounded" />
                    Enable waiting room
                  </label>
                </div>
              )}
              <button 
                type="submit" 
                disabled={creating} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5"
              >
                {creating ? 'Creating...' : 'Create Meeting →'}
              </button>
            </form>
          </div>

          {/* Join Room */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm hover:border-indigo-500/30 transition-colors">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-xl">🔗</span> Join Meeting
            </h3>
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <input
                type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-zinc-400 text-center font-mono text-lg tracking-widest uppercase font-bold"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="ENTER CODE"
                maxLength={6}
              />
              <button 
                type="submit" 
                disabled={roomCode.length !== 6}
                className="w-full py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              >
                Join Meeting →
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Recent Meetings
          </h3>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-2xl text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
              No meetings yet. Create one to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 hover:border-indigo-500/30 transition-colors group shadow-sm">
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 transition-colors">
                      {item.rooms?.name || 'Untitled Meeting'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">{item.rooms?.room_code}</span>
                      <span>·</span>
                      <span>{formatDate(item.joined_at)}</span>
                      {item.rooms?.is_active && activeRoomCounts[item.rooms.id] ? (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium ml-2 bg-green-500/10 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          {activeRoomCounts[item.rooms.id]} live
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        copiedCode === item.rooms?.room_code 
                        ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' 
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      onClick={() => copyInviteLink(item.rooms.room_code)}
                    >
                      {copiedCode === item.rooms?.room_code ? '✓ Copied' : 'Copy Link'}
                    </button>
                    {item.rooms?.is_active && (
                      <button 
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm" 
                        onClick={() => router.push(`/room/${item.rooms.room_code}`)}
                      >
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
