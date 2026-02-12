'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import type { User } from '@supabase/supabase-js'

interface RoomStat {
  id: string
  name: string
  room_code: string
  created_at: string
  is_active: boolean
  totalParticipants: number
  totalMessages: number
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<RoomStat[]>([])
  const [totals, setTotals] = useState({ rooms: 0, participants: 0, messages: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: myRooms } = await supabase
        .from('rooms')
        .select('id, name, room_code, created_at, is_active')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!myRooms || myRooms.length === 0) { setLoading(false); return }

      const roomIds = myRooms.map((r) => r.id)

      const { data: participantCounts } = await supabase
        .from('participants')
        .select('room_id')
        .in('room_id', roomIds)

      const pMap: Record<string, number> = {}
      participantCounts?.forEach((p: { room_id: string }) => {
        pMap[p.room_id] = (pMap[p.room_id] || 0) + 1
      })

      const { data: messageCounts } = await supabase
        .from('messages')
        .select('room_id')
        .in('room_id', roomIds)

      const mMap: Record<string, number> = {}
      messageCounts?.forEach((m: { room_id: string }) => {
        mMap[m.room_id] = (mMap[m.room_id] || 0) + 1
      })

      const stats: RoomStat[] = myRooms.map((r) => ({
        ...r,
        totalParticipants: pMap[r.id] || 0,
        totalMessages: mMap[r.id] || 0,
      }))

      setRooms(stats)
      setTotals({
        rooms: stats.length,
        participants: stats.reduce((s, r) => s + r.totalParticipants, 0),
        messages: stats.reduce((s, r) => s + r.totalMessages, 0),
      })
      setLoading(false)
    }
    init()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="w-24 h-6 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="w-32 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </header>
        <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
          <div className="w-48 h-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white font-sans">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/5 px-6 md:px-8 py-4 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">InterMeet</span>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <button 
            onClick={() => router.push('/dashboard')} 
            className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
          >
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3 border border-indigo-500/20">
            📊 Insights
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Analytics</h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Overview of your meetings and engagement
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">{totals.rooms}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Rooms Created</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">{totals.participants}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Joins</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-linear-to-br from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">{totals.messages}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Chat Messages</div>
          </div>
        </div>

        {/* Room list */}
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>📁</span> Your Rooms
        </h3>

        {rooms.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-white/5 rounded-2xl text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/50">
            No rooms created yet. Create one from the dashboard!
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((r) => (
              <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 hover:border-indigo-500/30 transition-colors shadow-sm">
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{r.name}</div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">{r.room_code}</span>
                    <span>·</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    <span>·</span>
                    {r.is_active ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold bg-green-500/10 px-1.5 py-0.5 rounded">Active</span>
                    ) : (
                      <span className="text-zinc-400">Ended</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0">
                  <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg border border-zinc-200 dark:border-white/5">
                    👥 {r.totalParticipants}
                  </span>
                  <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg border border-zinc-200 dark:border-white/5">
                    💬 {r.totalMessages}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
