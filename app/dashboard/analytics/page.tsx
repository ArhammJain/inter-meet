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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<RoomStat[]>([])
  const [totals, setTotals] = useState({ rooms: 0, participants: 0, messages: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUser(user)

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
  }, [])

  if (loading) {
    return (
      <div className="page-full">
        <header className="header-responsive" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 2rem', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', backdropFilter: 'var(--backdrop-blur)' }}>
          <div className="skeleton" style={{ width: 100, height: 24 }} />
          <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 10 }} />
        </header>
        <main className="main-responsive" style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: 840, width: '100%', margin: '0 auto' }}>
          <div className="skeleton" style={{ width: 200, height: 32, marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />)}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-full">
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
          <ThemeSwitcher />
          <button onClick={() => router.push('/dashboard')} className="btn btn-outline btn-sm">← Dashboard</button>
        </div>
      </header>

      <main className="main-responsive" style={{ flex: 1, padding: '2.5rem 2rem', maxWidth: 840, width: '100%', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-badge">📊 Insights</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Analytics</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Overview of your meetings and engagement
          </p>
        </div>

        {/* Summary cards */}
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div className="stat-card">
            <div className="stat-value">{totals.rooms}</div>
            <div className="stat-label">Rooms Created</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totals.participants}</div>
            <div className="stat-label">Total Joins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totals.messages}</div>
            <div className="stat-label">Chat Messages</div>
          </div>
        </div>

        {/* Room list */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📁</span> Your Rooms
        </h3>

        {rooms.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '2rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
            No rooms created yet. Create one from the dashboard!
          </div>
        ) : (
          <div className="history-list">
            {rooms.map((r) => (
              <div key={r.id} className="history-item">
                <div className="history-item-info">
                  <div className="history-item-name">{r.name}</div>
                  <div className="history-item-meta">
                    <span style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{r.room_code}</span>
                    <span style={{ margin: '0 0.35rem' }}>·</span>
                    {new Date(r.created_at).toLocaleDateString()}
                    <span style={{ margin: '0 0.35rem' }}>·</span>
                    {r.is_active ? (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active</span>
                    ) : (
                      <span style={{ color: 'var(--muted-light)' }}>Ended</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>👥 {r.totalParticipants}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>💬 {r.totalMessages}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
