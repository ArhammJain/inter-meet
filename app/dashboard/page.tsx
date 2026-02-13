'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

import Navbar from '@/components/Navbar'
import type { User } from '@supabase/supabase-js'



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

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)


    }
    init()
    return () => { if (realtimeChannel) supabase.removeChannel(realtimeChannel) }
  }, [supabase])



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
      <Navbar />
      <main className="max-w-5xl mx-auto p-6 md:p-8 pt-24 md:pt-32">
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


      </main>
    </div>
  )
}
