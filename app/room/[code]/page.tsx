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

// --- UI Components (Redesigned) ---

// 1. Theme Provider Wrapper
const RoomThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-50">
    {children}
  </div>
)

// 2. Background with Premium Depth (No Purple)
const Background = ({ children }: { children: React.ReactNode }) => (
  <RoomThemeProvider>
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Subtle Lighting Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(30,58,138,0.15),transparent_40%)] opacity-30 dark:opacity-100" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
      <Navbar />
      <div className="relative z-10 w-full h-full flex flex-col pt-24 md:pt-32 px-4">{children}</div>
    </div>
  </RoomThemeProvider>
)

// 3. High-End Glass Card
const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/5 shadow-2xl rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center max-w-md w-full mx-auto relative overflow-hidden transition-all duration-300 ${className}`}>
    <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-600/0 via-blue-500/50 to-blue-600/0 opacity-50" />
    {children}
  </div>
)

// 4. Minimalist Spinner
const Spinner = () => (
  <div className="relative w-12 h-12">
    <div className="absolute inset-0 rounded-full border-[3px] border-zinc-800"></div>
    <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
  </div>
)

// 5. Utility Icons
const Icons = {
  MicOn: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
  MicOff: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
  VideoOn: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>,
  VideoOff: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>,
  Lock: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
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

  // Camera preview
  useEffect(() => {
    if (stage !== 'prejoin') return
    let cancelled = false
    const start = async () => {
      const constraints: MediaStreamConstraints = { video: videoEnabled, audio: audioEnabled }
      // Don't request if both are off
      if (!videoEnabled && !audioEnabled) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch (err) {
        const name = (err as DOMException)?.name
        if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          // Device not available — try falling back
          if (videoEnabled && audioEnabled) {
            // Try audio-only first
            try {
              const fallback = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
              if (cancelled) { fallback.getTracks().forEach((t) => t.stop()); return }
              streamRef.current = fallback
              if (videoRef.current) videoRef.current.srcObject = fallback
              setVideoEnabled(false)
              toastRef.current('Camera not found — joining with audio only', 'error')
              return
            } catch {
              // No audio either
            }
          }
          if (videoEnabled) { setVideoEnabled(false); toastRef.current('Camera not found on this device', 'error') }
          if (audioEnabled) { setAudioEnabled(false); toastRef.current('Microphone not found on this device', 'error') }
        } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          toastRef.current('Permission denied — please allow camera/mic access', 'error')
          if (videoEnabled) setVideoEnabled(false)
          if (audioEnabled) setAudioEnabled(false)
        }
        // Other errors silently ignored (e.g. AbortError, OverconstrainedError)
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
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:h-[85vh]">
          
          {/* Left Column: Video Preview */}
          <div className="w-full lg:flex-[1.4] flex flex-col gap-6">
            <div className="relative w-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/5 group">
              {videoEnabled ? (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                    <span className="text-zinc-500"><Icons.VideoOff /></span>
                  </div>
                  <span className="text-zinc-400 font-medium tracking-wide">Camera is off</span>
                </div>
              )}
              
              {/* Overlay Badge */}
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-2">
                 <span className={`block w-2 h-2 rounded-full ${videoEnabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                 <span className="text-xs font-medium text-white/90">Preview</span>
              </div>
            </div>

            {/* Media Controls */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 border ${
                  audioEnabled 
                  ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white' 
                  : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                }`}
              >
                {audioEnabled ? <Icons.MicOn /> : <Icons.MicOff />}
                <span className="hidden sm:inline">{audioEnabled ? 'Mic On' : 'Mic Off'}</span>
              </button>
              
              <button
                onClick={() => setVideoEnabled(!videoEnabled)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 border ${
                  videoEnabled 
                  ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white' 
                  : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                }`}
              >
                {videoEnabled ? <Icons.VideoOn /> : <Icons.VideoOff />}
                <span className="hidden sm:inline">{videoEnabled ? 'Camera On' : 'Camera Off'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Info & Action */}
          <div className="w-full lg:flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase">
              Secure Meeting
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-indigo-400 dark:text-white mb-4">
              Join the <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">Session</span>
            </h1>
            
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-md">
              You are entering room <span className="font-mono text-zinc-200 bg-zinc-800/50 px-2 py-0.5 rounded border border-white/5">{code}</span>.
              <br/>Please check your setup before connecting.
            </p>

            <div className="w-full max-w-md space-y-3">
              <button 
                onClick={() => handleJoin()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-semibold text-lg shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] transition-all transform hover:scale-[1.01] active:scale-[0.99] border border-blue-400/20"
              >
                Join Meeting
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-white py-3 rounded-xl font-medium transition-colors border border-transparent hover:border-white/5"
              >
                Return to Dashboard
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
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 ring-1 ring-red-500/20">
            <Icons.Lock />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Password Protected</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-sm">Please enter the credentials to access this room.</p>
          
          <form onSubmit={(e) => { e.preventDefault(); handleJoin(password) }} className="w-full flex flex-col gap-4">
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              autoFocus 
              className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3.5 text-center text-white placeholder-zinc-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono tracking-widest"
            />
            <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 py-3.5 rounded-xl font-bold shadow-lg transition-colors mt-2">
              Unlock Room
            </button>
          </form>
          <button onClick={() => router.push('/dashboard')} className="mt-6 text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider font-semibold">Cancel</button>
        </GlassCard>
      </Background>
    )
  }

  // Lobby / waiting room
  if (stage === 'lobby') {
    return (
      <Background>
        <GlassCard>
          <div className="mb-8 p-4 bg-zinc-100 dark:bg-zinc-950/30 rounded-full">
            <Spinner />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Waiting Room</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-[280px] leading-relaxed text-sm">
            We&apos;ve notified the host. You will be admitted automatically once approved.
          </p>
          <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-white transition-colors text-sm font-medium">
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
        <div className="flex flex-col items-center gap-8">
           <div className="relative">
             <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
             <Spinner />
           </div>
          <div className="text-center">
            <h2 className="text-lg font-medium text-white tracking-wide">Connecting securely...</h2>
            <p className="font-mono text-xs text-zinc-500 mt-2">E2EE • {code}</p>
          </div>
        </div>
      </Background>
    )
  }

  // Error
  if (stage === 'error') {
    return (
      <Background>
        <GlassCard className="border-red-500/10">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 ring-1 ring-red-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Failed</h2>
          <p className="text-zinc-400 mb-8">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-3 rounded-xl font-medium transition-all w-full border border-white/5">Back to Dashboard</button>
        </GlassCard>
      </Background>
    )
  }

  // ===== CONNECTED =====
  return (
    <RoomThemeProvider>
      <Navbar />
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