'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  LiveKitRoom,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { useToast } from '@/components/Toast'
import MeetingView from '@/components/MeetingView'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

// --- Logic & Types (Unchanged) ---
type Stage = 'prejoin' | 'lobby' | 'password' | 'connecting' | 'connected' | 'error'

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

// --- UI Components (Responsive Update) ---

// 1. Theme Provider Wrapper
const RoomThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#2057CC]/20 selection:text-[#2057CC]">
    {children}
  </div>
)

// 2. Background with Adaptive Padding
const Background = ({ children }: { children: React.ReactNode }) => (
  <RoomThemeProvider>
    <div className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden transition-colors duration-300">
      {/* Mesh Gradients - Adjusted for mobile performance */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[40%] bg-[#2057CC]/10 blur-[80px] md:blur-[120px] rounded-full mix-blend-multiply dark:hidden" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-indigo-500/10 blur-[80px] md:blur-[120px] rounded-full mix-blend-multiply dark:hidden" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-[0.05]" />
      
      <Navbar />
      {/* Mobile: pt-16, Desktop: pt-32 */}
      <div className="relative z-10 w-full h-full flex flex-col pt-16 md:pt-32 px-4 pb-4 md:pb-8">{children}</div>
    </div>
  </RoomThemeProvider>
)

// 3. Responsive Glass Card
const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl ring-1 ring-black/5 rounded-2xl md:rounded-3xl p-6 md:p-12 flex flex-col items-center text-center max-w-[90vw] md:max-w-[480px] w-full mx-auto relative overflow-hidden transition-all duration-300 ${className}`}>
    {children}
  </div>
)

// 4. Professional Spinner
const Spinner = () => (
  <div className="relative w-8 h-8 md:w-10 md:h-10">
    <svg className="animate-spin text-[#2057CC]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
)

// 5. Icons
const Icons = {
  MicOn: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
  MicOff: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
  VideoOn: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
  VideoOff: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>,
  Lock: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  const { toast } = useToast()
  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast }, [toast])
  const supabase = createClient()

  const [stage, setStage] = useState<Stage>('prejoin')
  const [token, setToken] = useState('')
  const [roomName, setRoomName] = useState('')
  const [isCreator, setIsCreator] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(false)
  const [error, setError] = useState('')
  const [ending, setEnding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [password, setPassword] = useState('')
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

  // Camera preview logic
  useEffect(() => {
    if (stage !== 'prejoin') return
    let cancelled = false
    const start = async () => {
      const constraints: MediaStreamConstraints = { video: videoEnabled, audio: audioEnabled }
      if (!videoEnabled && !audioEnabled) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        const name = (err as DOMException)?.name
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          if (videoEnabled && audioEnabled) {
            try {
              const fallback = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
              if (cancelled) { fallback.getTracks().forEach((t) => t.stop()); return }
              streamRef.current = fallback
              if (videoRef.current) videoRef.current.srcObject = fallback
              setVideoEnabled(false)
              toastRef.current('Camera not found — joining with audio only', 'error')
              return
            } catch { }
          }
          if (videoEnabled) { setVideoEnabled(false); toastRef.current('Camera not found on this device', 'error') }
          if (audioEnabled) { setAudioEnabled(false); toastRef.current('Microphone not found on this device', 'error') }
        } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          toastRef.current('Permission denied — please allow camera/mic access', 'error')
          if (videoEnabled) setVideoEnabled(false)
          if (audioEnabled) setAudioEnabled(false)
        }
      }
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
      setToken(data.token); setRoomName(data.roomName)
      setIsCreator(data.isCreator)
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
    const fetchLobby = async () => {
      try {
        const res = await fetch(`/api/room-lobby?roomCode=${code}&action=list`)
        if (res.ok) { const d = await res.json(); setLobbyEntries(d.entries || []) }
      } catch { /* ignore */ }
    }
    fetchLobby()

    const channel = supabase
      .channel(`lobby-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby' }, () => { fetchLobby() })
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

  // ===== RENDER =====

  // Pre-join screen
  if (stage === 'prejoin') {
    return (
      <Background>
        {/* Responsive Container: Stacks on mobile, Row on Large Screens */}
        <div className="w-full pt-20 lg:pt-0 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-12 h-full md:h-[80vh]">
          
          {/* Left: Video Preview */}
          <div className="w-full lg:flex-[1.6] flex flex-col gap-6 md:gap-8 order-1 lg:order-1">
            <div className="relative w-full aspect-video bg-black rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)] md:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] ring-1 md:ring-4 ring-white/5 group transition-transform duration-500 hover:scale-[1.01]">
              {videoEnabled ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-95" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-zinc-800/80 flex items-center justify-center mb-4 md:mb-6 border border-white/5 shadow-2xl">
                    <span className="text-zinc-600 scale-100 md:scale-125"><Icons.VideoOff /></span>
                  </div>
                  <span className="text-zinc-400 font-medium tracking-wide text-xs md:text-sm uppercase">Camera is off</span>
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3">
                 <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 transition-colors ${videoEnabled ? 'bg-black/40 border-emerald-500/30' : 'bg-black/40 border-red-500/30'}`}>
                    <span className={`block w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shadow-lg ${videoEnabled ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                    <span className="text-[10px] md:text-xs font-semibold text-white/90 tracking-wide">{videoEnabled ? 'READY' : 'OFF'}</span>
                 </div>
              </div>

              </div>

              {/* Bottom Control Bar - Moved Out */}
              <div className="flex items-center justify-center gap-4 mt-4 md:mt-6">
                 <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-xl ${
                      audioEnabled 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    }`}
                  >
                    {audioEnabled ? <Icons.MicOn /> : <Icons.MicOff />}
                  </button>
                  <button
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 shadow-xl ${
                      videoEnabled 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    }`}
                  >
                    {videoEnabled ? <Icons.VideoOn /> : <Icons.VideoOff />}
                  </button>
              </div>

          </div>

          {/* Right: Actions */}
          <div className="w-full lg:flex-1 flex flex-col lg:pb-30 items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 order-2 lg:order-2">
            <div className="hidden lg:block">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2057CC]/10 border border-[#2057CC]/20 text-[#2057CC] dark:text-[#5a8bf5] text-[10px] md:text-xs font-bold tracking-widest uppercase mb-4 md:mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2057CC] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2057CC]"></span>
                  </span>
                  Ready to connect
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3 md:mb-4">
                  Join the <br className="hidden md:block" />
                  <span className="text-[#2057CC]">InterJob Room</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                  You are about to enter room <span className="font-mono font-medium text-zinc-900 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded border border-black/5 dark:border-white/10 break-all">{code}</span>.
                </p>
            </div>

            <div className="w-full max-w-sm space-y-3 md:space-y-4">
              <button 
                onClick={() => handleJoin()}
                className="group relative w-full overflow-hidden bg-[#2057CC] hover:bg-[#1a49ad] text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-base md:text-lg shadow-[0_10px_40px_-10px_rgba(32,87,204,0.4)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center justify-center gap-2">
                  Join Meeting 
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </span>
              </button>
              
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-medium transition-colors border border-zinc-200 dark:border-zinc-800 text-sm md:text-base"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Background>
    )
  }
  
  // Password screen
  if (stage === 'password') {
    return (
      <Background>
        <GlassCard>
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-[#2057CC]/10 flex items-center justify-center text-[#2057CC] mb-6 md:mb-8 ring-1 ring-[#2057CC]/20 shadow-lg shadow-[#2057CC]/10 rotate-3">
            <Icons.Lock />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Protected Room</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 md:mb-8 text-sm md:text-base">This session requires a passcode to enter.</p>
          
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(password) }} className="w-full flex flex-col gap-3 md:gap-4">
            <div className="relative group">
                <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter Passcode" 
                required 
                autoFocus 
                // text-base is critical to prevent iOS Zoom
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl md:rounded-2xl px-5 py-3.5 md:py-4 text-center text-zinc-900 dark:text-white placeholder-zinc-400 outline-none focus:border-[#2057CC] focus:ring-4 focus:ring-[#2057CC]/10 transition-all font-mono tracking-widest text-base md:text-lg"
                />
            </div>
            <button type="submit" className="w-full bg-[#2057CC] hover:bg-[#1a49ad] text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold shadow-lg shadow-[#2057CC]/20 transition-all mt-2 active:scale-[0.98] text-base md:text-lg">
              Verify & Join
            </button>
          </form>
          <button onClick={() => router.push('/dashboard')} className="mt-6 md:mt-8 text-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors font-medium">Return to Dashboard</button>
        </GlassCard>
      </Background>
    )
  }

  // Lobby / waiting room
  if (stage === 'lobby') {
    return (
      <Background>
        <GlassCard>
          <div className="mb-6 md:mb-8 p-4 md:p-5 bg-[#2057CC]/5 rounded-full ring-1 ring-[#2057CC]/20">
            <Spinner />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2">You are in the Lobby</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 md:mb-8 max-w-[280px] leading-relaxed text-xs md:text-sm">
            We&apos;ve notified the host. <br/>You will be automatically admitted once approved.
          </p>
          <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-6 md:mb-8">
              <div className="h-full bg-[#2057CC] w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-[#2057CC] transition-colors text-xs md:text-sm font-medium">
            Cancel Request
          </button>
        </GlassCard>
      </Background>
    )
  }

  // Connecting
  if (stage === 'connecting') {
    return (
      <Background>
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500 mt-[-10vh]">
           <div className="relative">
             <div className="absolute inset-0 bg-[#2057CC] blur-2xl opacity-20 animate-pulse"></div>
             <div className="relative bg-white dark:bg-zinc-900 p-4 rounded-3xl shadow-2xl border border-white/10">
                <Spinner />
             </div>
           </div>
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Establishing Connection...</h2>
            <p className="font-mono text-[10px] md:text-xs text-zinc-400 mt-2 uppercase tracking-widest">Securing Route • {code}</p>
          </div>
        </div>
      </Background>
    )
  }

  // Error
  if (stage === 'error') {
    return (
      <Background>
        <GlassCard className="border-red-500/20 shadow-red-500/5">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 ring-1 ring-red-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Connection Failed</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6 md:mb-8 text-sm">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 px-8 py-3.5 rounded-xl font-bold transition-all w-full text-sm md:text-base">Back to Dashboard</button>
        </GlassCard>
      </Background>
    )
  }

  // ===== CONNECTED =====
  return (
    <RoomThemeProvider>
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        video={videoEnabled}
        audio={audioEnabled}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ height: '100vh', width: '100vw' }}
      >
        <MeetingView
          roomName={roomName}
          roomCode={code}
          isCreator={isCreator}
          maxParticipants={maxParticipants}
          copied={copied}
          ending={ending}
          lobbyEntries={lobbyEntries}
          onCopyInvite={copyInviteLink}
          onLeave={handleDisconnect}
          onEndMeeting={handleEndMeeting}
          onAdmitReject={handleAdmitReject}
        />
      </LiveKitRoom>
    </RoomThemeProvider>
  )
}