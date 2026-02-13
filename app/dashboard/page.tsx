'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'

import Navbar from '@/components/Navbar'
import type { User } from '@supabase/supabase-js'

// --- UI Sub-components ---

const DashboardBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#2057CC]/20 selection:text-[#2057CC]">
     <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2057CC]/5 blur-[120px] rounded-full mix-blend-multiply dark:hidden" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-multiply dark:hidden" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
     </div>
    <div className="relative z-10">{children}</div>
  </div>
)

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none transition-all duration-300 ${className}`}>
    {children}
  </div>
)

const SectionTitle = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
  <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-zinc-900 dark:text-white">
    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[#2057CC]">
      {icon}
    </div>
    {title}
  </h3>
)

// Icons
const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  Link: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
  Settings: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
  ArrowRight: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
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
      <DashboardBackground>
        <Navbar />
        <main className="max-w-6xl mx-auto p-6 md:p-8 pt-24 md:pt-32 space-y-8">
          <div className="w-48 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-[400px] bg-white/50 dark:bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-200 dark:border-zinc-800" />
            <div className="h-[400px] bg-white/50 dark:bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-200 dark:border-zinc-800" />
          </div>
        </main>
      </DashboardBackground>
    )
  }

  return (
    <DashboardBackground>
      {/* Header */}
      <Navbar />
      <main className="max-w-6xl mx-auto p-4 md:p-8 pt-20 md:pt-32">
        
        {/* Welcome Section */}
        <div className="mb-10 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              Welcome back, <br className="md:hidden"/>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#2057CC] to-indigo-500">
                {user?.user_metadata?.full_name?.split(' ')[0] || 'Guest'}
              </span>
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg">
              Ready to collaborate? Create a new space or join your team.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">System Operational</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Create Room Card */}
          <Card className="relative overflow-hidden group hover:border-[#2057CC]/30 dark:hover:border-[#2057CC]/30 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-[#2057CC]/10 to-transparent rounded-bl-[100px] -mr-8 -mt-8 pointer-events-none" />
            
            <SectionTitle icon={<Icons.Plus />} title="New Meeting" />
            
            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 ml-1">Room Name</label>
                <input
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2057CC]/20 focus:border-[#2057CC] transition-all placeholder-zinc-400 text-zinc-900 dark:text-white"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Weekly Sync, Project Review..."
                  maxLength={100}
                />
              </div>

              {/* Advanced Options Toggle */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-sm font-medium text-zinc-500 hover:text-[#2057CC] transition-colors group/btn py-2"
                >
                  <span className="flex items-center gap-2"><Icons.Settings /> Advanced Settings</span>
                  <span className={`transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
                </button>

                {/* Advanced Content */}
                {showAdvanced && (
                  <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                         <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">Security</label>
                         <input
                            type="password"
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#2057CC] transition-all placeholder-zinc-400"
                            value={newRoomPassword}
                            onChange={(e) => setNewRoomPassword(e.target.value)}
                            placeholder="Optional Password"
                            maxLength={50}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                          <input type="checkbox" checked={isPersistent} onChange={(e) => setIsPersistent(e.target.checked)} className="accent-[#2057CC] w-4 h-4 rounded" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">Persistent Room <span className="text-zinc-400 text-xs ml-1">(No expiry)</span></span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                          <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} className="accent-[#2057CC] w-4 h-4 rounded" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">Enable Waiting Room</span>
                        </label>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={creating} 
                className="relative w-full py-4 bg-[#2057CC] hover:bg-[#1a49ad] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(32,87,204,0.39)] hover:shadow-[0_6px_20px_rgba(32,87,204,0.23)] hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
              >
                {creating ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Setting up...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">Create Instant Meeting <Icons.ArrowRight /></span>
                )}
              </button>
            </form>
          </Card>

          {/* Join Room Card */}
          <Card className="flex flex-col">
             <SectionTitle icon={<Icons.Link />} title="Join Meeting" />
             
             <div className="flex-1 flex flex-col justify-center py-4">
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm leading-relaxed">
                    Have a room code? Enter it below to jump directly into the conversation securely.
                </p>

                <form onSubmit={handleJoinRoom} className="space-y-6">
                <div className="relative">
                    <input
                        type="text"
                        className="w-full bg-white dark:bg-black/20 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 py-5 outline-none focus:border-[#2057CC] focus:ring-4 focus:ring-[#2057CC]/10 transition-all text-center font-mono text-2xl md:text-3xl tracking-[0.2em] uppercase font-bold text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-700"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="••••••"
                        maxLength={6}
                    />
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        {roomCode.length === 6 && (
                            <span className="flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        )}
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={roomCode.length !== 6}
                    className="w-full py-4 bg-zinc-900 dark:bg-white border border-transparent hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 shadow-lg active:scale-[0.98]"
                >
                    Connect to Room
                </button>
                </form>
             </div>

             <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Invited via link? Check your calendar or email for the direct URL.
                </p>
             </div>
          </Card>
        </div>
      </main>
    </DashboardBackground>
  )
}