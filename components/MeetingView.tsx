'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  useRoomContext,
  useTracks,
  useLocalParticipant,
  VideoTrack,
} from '@livekit/components-react'
import { RoomEvent, Track, Participant } from 'livekit-client'
import ChatSidebar from './ChatSidebar'
import ParticipantList from './ParticipantList'
import { Pin, PinOff } from 'lucide-react'

// --- Types ---
interface Props {
  roomName: string
  roomCode: string
  isCreator: boolean
  maxParticipants: number
  copied: boolean
  ending: boolean
  lobbyEntries: Array<{ id: string; user_id: string; display_name: string; status: string }>
  onCopyInvite: () => void
  onLeave: () => void
  onEndMeeting: () => void
  onAdmitReject: (userId: string, action: 'admit' | 'reject') => void
}

const EMOJIS = ['👍', '👏', '😂', '❤️', '🎉', '🔥', '😮', '✋']

// --- UI Components ---

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-white/90 dark:bg-zinc-950/90 text-zinc-900 dark:text-zinc-100 text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-zinc-200 dark:border-white/10 shadow-xl backdrop-blur-sm z-50">
      {text}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-950 border-r border-b border-zinc-200 dark:border-white/10 rotate-45" />
    </div>
  </div>
)

const ControlButton = ({
  active,
  danger,
  onClick,
  children,
  label,
  className
}: {
  active?: boolean
  danger?: boolean
  onClick: () => void
  children: React.ReactNode
  label?: string
  className?: string
}) => {
  const baseClass = "relative flex items-center justify-center transition-all duration-200 ease-out active:scale-90"
  const sizeClass = "w-11 h-11 md:w-12 md:h-12 rounded-full"
  
  let colorClass = "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 hover:text-zinc-900 dark:hover:text-white"
  
  if (active && !danger) {
    colorClass = "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md"
  } else if (!active && !danger) {
    colorClass = "bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 hover:text-zinc-900 dark:hover:text-white"
  }
  
  if (danger) {
    colorClass = active
      ? "bg-red-500 text-white shadow-[0_0_24px_-4px_rgba(239,68,68,0.6)]"
      : "bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
  }

  return (
    <Tooltip text={label || ''}>
      <button onClick={onClick} className={`${baseClass} ${sizeClass} ${colorClass} ${className || ''}`}>
        {children}
      </button>
    </Tooltip>
  )
}

export default function MeetingView(props: Props) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  const [showChat, setShowChat] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showEndMenu, setShowEndMenu] = useState(false)

  const [hands, setHands] = useState<Set<string>>(new Set())
  const [myHand, setMyHand] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  
  // Mobile check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto open chat on large screens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.innerWidth > 1280) setShowChat(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  // Click outside listeners
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowEmoji(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])


  
  const getParticipantAvatar = (p: Participant): string | undefined => {
    try {
      const meta = JSON.parse(p.metadata || '{}')
      return meta.avatar_url || undefined
    } catch {
      return undefined
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const focusTrack = tracks.find(t => t.participant.identity === pinnedId) ||
                     tracks.find(t => t.source === Track.Source.ScreenShare) || 
                     tracks.find(t => t.participant.isSpeaking && !t.participant.isLocal) || 
                     tracks.find(t => !t.participant.isLocal) || 
                     tracks[0]

  // Event Listeners
  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: Participant) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        const identity = participant?.identity || 'unknown'
        if (msg.type === 'hand') {
          setHands(prev => { const s = new Set(prev); if (msg.raised) s.add(identity); else s.delete(identity); return s })
        }
      } catch { /* ignore */ }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => { room.off(RoomEvent.DataReceived, onData) }
  }, [room])

  const sendReaction = useCallback((emoji: string) => {
    try {
      room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: 'reaction', emoji })), { reliable: true })
    } catch { /* ignore */ }
    setShowEmoji(false)
  }, [room])

  const toggleHand = useCallback(() => {
    const raised = !myHand
    setMyHand(raised)
    try {
      const identity = room.localParticipant.identity
      room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: 'hand', raised })), { reliable: true })
      setHands(prev => { const s = new Set(prev); if (raised) s.add(identity); else s.delete(identity); return s })
    } catch { /* ignore */ }
  }, [room, myHand])

  const toggleMic = () => {
    const enabled = localParticipant.isMicrophoneEnabled
    localParticipant.setMicrophoneEnabled(!enabled)
  }

  const toggleCam = () => {
    const enabled = localParticipant.isCameraEnabled
    localParticipant.setCameraEnabled(!enabled)
  }

  const toggleScreen = async () => {
    // Screen sharing requires getDisplayMedia, not available on most mobile browsers
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert('Screen sharing is not supported on this device/browser.')
      return
    }
    try {
      const enabled = localParticipant.isScreenShareEnabled
      await localParticipant.setScreenShareEnabled(!enabled)
    } catch (err) {
      console.warn('Screen share error:', err)
      // User cancelled or browser denied — do nothing
    }
  }

  const toggleFullscreen = () => {
    if (!stageRef.current) return
    if (!document.fullscreenElement) {
      stageRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="flex h-[100dvh] bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* ── Main Canvas ── */}
      <div className="flex-1 min-w-0 flex flex-col relative h-full transition-all duration-300 ease-in-out">
        
        {/* Top Header */}
        <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-start pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            
          </div>
          
        </div>

        {/* ── Video Stage ── */}
        <div className="flex-1 p-2 md:p-4 flex gap-4 overflow-hidden relative z-0">
          {isMobile ? (
            <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-max">
                {tracks.map(track => (
                  <div 
                    key={track.publication?.trackSid || track.participant.identity} 
                    className="relative w-full aspect-[16/9] sm:aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 shadow-2xl ring-1 ring-white/5 group"
                  >
                    {/* Video Track or Avatar Fallback */}
                    {track.publication?.track && track.participant.isCameraEnabled ? (
                      <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <div className="w-24 h-24 rounded-full shadow-2xl overflow-hidden bg-zinc-800 flex items-center justify-center text-2xl font-bold text-white">
                           {getParticipantAvatar(track.participant) ? (
                             <img src={getParticipantAvatar(track.participant)!} className="w-full h-full object-cover" alt="Avatar" />
                           ) : (
                             getInitials(track.participant.name || track.participant.identity)
                           )}
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPinnedId(pinnedId === track.participant.identity ? null : track.participant.identity) }}
                        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl border backdrop-blur-md transition-all active:scale-95 ${
                          pinnedId === track.participant.identity 
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' 
                            : 'bg-black/40 text-white/70 border-white/10'
                        }`}
                      >
                         {pinnedId === track.participant.identity ? <PinOff size={14} /> : <Pin size={14} />}
                         {pinnedId === track.participant.identity && <span className="text-[10px] font-bold uppercase tracking-wider">Pinned</span>}
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between z-30">
                      <div className="bg-zinc-900/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/10 shadow-lg flex items-center gap-2">
                         {getParticipantAvatar(track.participant) && (
                           <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20">
                             <img src={getParticipantAvatar(track.participant)} className="w-full h-full object-cover" alt="" />
                           </div>
                         )}
                         <span className="text-xs font-semibold text-white truncate block max-w-[100px]">
                           {track.participant.name || track.participant.identity}
                         </span>
                      </div>
                      <div className="flex gap-2">
                        {hands.has(track.participant.identity) && <span className="text-lg drop-shadow-md">✋</span>}
                        {!track.participant.isMicrophoneEnabled && (
                          <div className="p-1.5 bg-red-500/90 rounded-md backdrop-blur-sm shadow-sm">
                            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
          <div ref={stageRef} className="flex-1 relative rounded-3xl h-[620px] overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl ring-1 ring-white/5 group">
            {!focusTrack && (
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-zinc-900/50">
                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center animate-pulse border border-white/5 overflow-hidden">
                  {getParticipantAvatar(localParticipant) ? (
                    <img src={getParticipantAvatar(localParticipant)!} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <span className="text-3xl font-medium text-zinc-500">{(localParticipant.name || localParticipant.identity).charAt(0)}</span>
                  )}
                </div>
                <p className="mt-6 text-zinc-500 font-medium">Waiting for participant...</p>
              </div>
            )}
            {/* Video Track or Avatar Fallback */}
            {focusTrack && focusTrack.publication?.track && (focusTrack.participant.isCameraEnabled || focusTrack.source === Track.Source.ScreenShare) ? (
               <VideoTrack trackRef={focusTrack} className="absolute inset-0 w-full h-full object-cover z-10" />
            ) : focusTrack && (
               <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 rounded-full shadow-2xl overflow-hidden bg-zinc-800 flex items-center justify-center text-6xl font-bold text-white transition-transform hover:scale-105 duration-500">
                     {getParticipantAvatar(focusTrack.participant) ? (
                       <img src={getParticipantAvatar(focusTrack.participant)!} className="w-full h-full object-cover" alt="Participant Avatar" />
                     ) : (
                       getInitials(focusTrack.participant.name || focusTrack.participant.identity)
                     )}
                  </div>
               </div>
            )}
            
            {/* Fullscreen & Stats Overlay */}
            <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               {focusTrack?.source === Track.Source.ScreenShare && (
                 <button 
                   onClick={toggleFullscreen}
                   className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md border border-white/10 shadow-lg transition-all active:scale-95"
                   title="Toggle Fullscreen"
                 >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                 </button>
               )}
               {focusTrack && (
                 <button 
                   onClick={() => setPinnedId(pinnedId === focusTrack.participant.identity ? null : focusTrack.participant.identity)}
                   className={`flex items-center gap-2 p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all active:scale-95 ${
                     pinnedId === focusTrack.participant.identity 
                       ? 'bg-indigo-600 text-white border-indigo-400' 
                       : 'bg-black/60 hover:bg-black/80 text-white border-white/10'
                   }`}
                   title={pinnedId === focusTrack.participant.identity ? "Unpin" : "Pin"}
                 >
                    {pinnedId === focusTrack.participant.identity ? <PinOff size={18} /> : <Pin size={18} />}
                    {pinnedId === focusTrack.participant.identity && <span className="text-xs font-bold uppercase tracking-widest px-1">Pinned</span>}
                 </button>
               )}
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                  <div className="flex gap-2">
                     {focusTrack && (
                        <div className="bg-black/40 text-white px-3 py-1.5 rounded-lg backdrop-blur-md flex items-center gap-2 border border-white/10 shadow-sm">
                           {getParticipantAvatar(focusTrack.participant) && (
                              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
                                <img src={getParticipantAvatar(focusTrack.participant)} className="w-full h-full object-cover" alt="" />
                              </div>
                           )}
                           <span className="font-semibold text-sm">
                              {focusTrack.participant.name || focusTrack.participant.identity}
                           </span>
                           {!focusTrack.participant.isMicrophoneEnabled && (
                              <div className="p-1 bg-red-500/90 rounded-full">
                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
                              </div>
                           )}
                        </div>
                     )}
                     {hands.has(focusTrack?.participant.identity || '') && (
                        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-2 flex items-center gap-2">
                           <span className="text-sm">✋ Raised Hand</span>
                        </div>
                     )}
                  </div>
                </div>
              </div>
              {tracks.length > 1 && (
                <div className="hidden lg:flex flex-col gap-3 w-[280px] h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {tracks.filter(t => t !== focusTrack).map(track => (
                    <div key={track.publication?.trackSid || track.participant.identity} className="relative w-full aspect-video shrink-0 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 ring-1 ring-white/5 cursor-pointer hover:ring-indigo-500/50 transition-all group">

                      {/* Video Track or Avatar Fallback */}
                      {track.publication?.track && track.participant.isCameraEnabled ? (
                        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                          <div className="w-14 h-14 rounded-full shadow-lg overflow-hidden bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                             {getParticipantAvatar(track.participant) ? (
                               <img src={getParticipantAvatar(track.participant)!} className="w-full h-full object-cover" alt="Avatar" />
                             ) : (
                               getInitials(track.participant.name || track.participant.identity)
                             )}
                          </div>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-30">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPinnedId(pinnedId === track.participant.identity ? null : track.participant.identity) }}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border backdrop-blur-md transition-all ${
                            pinnedId === track.participant.identity 
                              ? 'bg-indigo-600 text-white border-indigo-400' 
                              : 'bg-black/40 text-white/70 border-white/10 hover:bg-black/60 hover:text-white'
                          }`}
                          title={pinnedId === track.participant.identity ? "Unpin" : "Pin"}
                        >
                           {pinnedId === track.participant.identity ? <PinOff size={12} /> : <Pin size={12} />}
                           {pinnedId === track.participant.identity && <span className="text-[9px] font-bold uppercase">Pinned</span>}
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center z-30 pointer-events-none">
                         <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur-sm max-w-[80%] border border-white/10 shadow-sm">
                            {getParticipantAvatar(track.participant) && (
                              <div className="w-3 h-3 rounded-full overflow-hidden border border-white/20">
                                <img src={getParticipantAvatar(track.participant)} className="w-full h-full object-cover" alt="" />
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-white truncate">
                               {track.participant.name || track.participant.identity}
                            </span>
                            {!track.participant.isMicrophoneEnabled && (
                              <svg className="w-3 h-3 text-red-400 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
                            )}
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Control Bar ── */}
        <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
          
          {isMobile ? (
            // ── Mobile Control Bar ──
            <div className="pointer-events-auto w-full">
               {/* Emoji picker floating above */}
               {showEmoji && (
                  <div ref={pickerRef} className="mx-4 mb-3 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
                     <div className="flex justify-between gap-1">
                        {EMOJIS.map(e => (
                           <button key={e} onClick={() => sendReaction(e)} className="text-2xl hover:scale-125 transition-transform p-1.5 rounded-xl active:bg-white/10">
                              {e}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {/* More menu drawer */}
               {showMoreMenu && (
                 <>
                   <div 
                     className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" 
                     onClick={() => setShowMoreMenu(false)}
                   />
                   <div className="fixed bottom-0 left-0 right-0 z-[70] bg-zinc-900 rounded-t-[28px] p-5 pt-3 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                      <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
                      <div className="grid grid-cols-3 gap-3 mb-3">
                         {/* People */}
                         <button 
                           onClick={() => { setShowParticipants(true); setShowChat(false); setShowMoreMenu(false) }}
                           className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-white/[0.06] active:bg-white/[0.12] transition-all"
                         >
                            <div className="w-11 h-11 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-zinc-300">People</span>
                         </button>
                         {/* Chat */}
                         <button 
                           onClick={() => { setShowChat(true); setShowParticipants(false); setShowMoreMenu(false) }}
                           className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-white/[0.06] active:bg-white/[0.12] transition-all"
                         >
                            <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <span className="text-xs font-medium text-zinc-300">Chat</span>
                         </button>
                         {/* Copy Link */}
                         <button 
                           onClick={() => { props.onCopyInvite(); setShowMoreMenu(false) }}
                           className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-white/[0.06] active:bg-white/[0.12] transition-all"
                         >
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${props.copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                               {props.copied 
                                 ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                 : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                               }
                            </div>
                            <span className="text-xs font-medium text-zinc-300">{props.copied ? 'Copied!' : 'Copy Link'}</span>
                         </button>
                      </div>
                      {/* Row 2 */}
                      <div className="grid grid-cols-2 gap-3">
                         {/* Raise Hand */}
                         <button 
                           onClick={() => { toggleHand(); setShowMoreMenu(false) }}
                           className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-95 ${
                             myHand ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'bg-zinc-100 dark:bg-white/6 text-zinc-600 dark:text-zinc-300'
                           }`}
                         >
                            <span className="text-xl">{myHand ? '👎' : '✋'}</span>
                            <span className="text-sm font-medium">{myHand ? 'Lower' : 'Raise Hand'}</span>
                         </button>
                         {/* Screen Share */}
                         <button 
                           onClick={() => { toggleScreen(); setShowMoreMenu(false) }}
                           className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-95 ${
                             localParticipant.isScreenShareEnabled ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'bg-zinc-100 dark:bg-white/6 text-zinc-600 dark:text-zinc-300'
                           }`}
                         >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="text-sm font-medium">{localParticipant.isScreenShareEnabled ? 'Stop' : 'Share Screen'}</span>
                         </button>
                      </div>
                      {/* Safe area spacing */}
                      <div className="h-[env(safe-area-inset-bottom,8px)]" />
                   </div>
                 </>
               )}

               {/* Mobile End Meeting Drawer */}
               {showEndMenu && props.isCreator && (
                 <>
                   <div 
                     className="fixed inset-0 bg-black/60 z-80 backdrop-blur-sm animate-in fade-in duration-300" 
                     onClick={() => setShowEndMenu(false)}
                   />
                   <div className="fixed bottom-0 left-0 right-0 z-90 bg-zinc-50 dark:bg-zinc-900 rounded-t-[28px] p-5 pt-3 border-t border-zinc-200 dark:border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 mb-[env(safe-area-inset-bottom,8px)]">
                      <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-6" />
                      
                      <div className="flex flex-col gap-3 pb-4">
                         <button 
                           onClick={() => { props.onLeave(); setShowEndMenu(false) }}
                           className="w-full py-4 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium flex items-center justify-between px-6 transition-all active:scale-98 border border-zinc-200 dark:border-transparent"
                         >
                            <span>Leave Meeting</span>
                            <span className="text-zinc-400 text-sm">Just you</span>
                         </button>
                         <button 
                           onClick={() => { props.onEndMeeting(); setShowEndMenu(false) }}
                           className="w-full py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center justify-between px-6 transition-all active:scale-98 shadow-[0_4px_20px_-4px_rgba(239,68,68,0.5)]"
                         >
                            <span>End Meeting for All</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                         </button>
                      </div>
                   </div>
                 </>
               )}

               {/* Main bottom bar */}
               <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200 dark:border-white/6 px-2 pb-[max(env(safe-area-inset-bottom,8px),8px)] pt-2">
                  <div className="flex items-center justify-around max-w-sm mx-auto">
                     <ControlButton onClick={toggleMic} active={localParticipant.isMicrophoneEnabled}>
                        {localParticipant.isMicrophoneEnabled 
                          ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                          : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        }
                     </ControlButton>
                     
                     <ControlButton onClick={toggleCam} active={localParticipant.isCameraEnabled}>
                        {localParticipant.isCameraEnabled 
                          ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        }
                     </ControlButton>

                     <ControlButton onClick={() => setShowEmoji(!showEmoji)} active={showEmoji}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </ControlButton>

                     <ControlButton onClick={() => setShowMoreMenu(true)} active={showMoreMenu}>
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                     </ControlButton>

                     {/* End call — prominent red circle */}
                     <button 
                       onClick={() => props.isCreator ? setShowEndMenu(true) : props.onLeave()}
                       className="w-14 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_24px_-4px_rgba(239,68,68,0.5)]"
                     >
                        <svg className="w-5 h-5 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                     </button>
                  </div>
               </div>
            </div>
          ) : (
            //  Desktop Control Bar 
            <div className="pointer-events-auto w-full bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200 dark:border-white/6 px-6 py-2 flex items-center h-20 justify-between">
              {/* Left: Time + Room Code */}
              <div className="flex items-center gap-4 min-w-[220px]">
                <span className="text-zinc-400 text-[13px] font-medium tabular-nums tracking-wide">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div className="w-px h-4 bg-white/10" />
                <span className="text-zinc-500 text-[13px] font-mono tracking-wider">{props.roomCode}</span>
              </div>

              {/* Center: Core Controls */}
              <div className="flex items-center gap-2">
                <ControlButton onClick={toggleMic} active={localParticipant.isMicrophoneEnabled} label={localParticipant.isMicrophoneEnabled ? "Mute" : "Unmute"}>
                   {localParticipant.isMicrophoneEnabled 
                     ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                   }
                </ControlButton>
                <ControlButton onClick={toggleCam} active={localParticipant.isCameraEnabled} label={localParticipant.isCameraEnabled ? "Stop Video" : "Start Video"}>
                   {localParticipant.isCameraEnabled 
                     ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m2 2 20 20"/></svg>
                   }
                </ControlButton>
                <ControlButton onClick={toggleScreen} active={localParticipant.isScreenShareEnabled} label={localParticipant.isScreenShareEnabled ? "Stop Presenting" : "Present Screen"}>
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </ControlButton>

                <div className="w-px h-8 bg-white/10 mx-1.5" />

                <div className="relative">
                  <ControlButton onClick={() => setShowEmoji(!showEmoji)} active={showEmoji} label="Reactions">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </ControlButton>
                  {showEmoji && (
                     <div ref={pickerRef} className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 px-3 py-2.5 rounded-2xl flex gap-1 shadow-2xl z-[60]">
                        {EMOJIS.map(e => (
                           <button key={e} onClick={() => sendReaction(e)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125 text-xl">
                              {e}
                           </button>
                        ))}
                     </div>
                  )}
                </div>
                <ControlButton onClick={toggleHand} active={myHand} label="Raise Hand">
                   <div className="relative">
                      <svg className="w-5 h-5" fill={myHand ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                      {hands.size > 0 && (
                         <span className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-indigo-500 rounded-full text-[10px] flex items-center justify-center font-bold ring-2 ring-zinc-950">{hands.size}</span>
                      )}
                   </div>
                </ControlButton>

                <div className="w-px h-8 bg-white/10 mx-1.5" />

                {/* End Call — red pill */}
                <div className="relative">
                  <button 
                    onClick={() => props.isCreator ? setShowEndMenu(!showEndMenu) : props.onLeave()}
                    className="w-14 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-[0_0_24px_-4px_rgba(239,68,68,0.5)]"
                  >
                     <svg className="w-5 h-5 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </button>
                  {showEndMenu && props.isCreator && (
                     <div className="absolute bottom-[calc(100%+12px)] right-0 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-50">
                        <button 
                           onClick={() => { props.onLeave(); setShowEndMenu(false) }}
                           className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
                        >
                           Leave Meeting
                        </button>
                        <button 
                           onClick={() => { props.onEndMeeting(); setShowEndMenu(false) }}
                           className="w-full text-left px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white text-sm font-medium text-red-500 transition-colors"
                        >
                           End Meeting for All
                        </button>
                     </div>
                  )}
                </div>
              </div>

              {/* Right: Utility Actions */}
              <div className="flex items-center gap-2 min-w-[220px] justify-end">
                 <ControlButton onClick={() => { setShowParticipants(!showParticipants); setShowChat(false) }} active={showParticipants} label="Participants">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                 </ControlButton>
                 <ControlButton onClick={() => { setShowChat(!showChat); setShowParticipants(false) }} active={showChat} label="Chat">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                 </ControlButton>
                 <ControlButton onClick={props.onCopyInvite} active={props.copied} label="Copy Link">
                    {props.copied 
                       ? <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    }
                 </ControlButton>
              </div>
            </div>
          )}
        </div>

        {/* ── Lobby Notification (Toast) ── */}
        {props.isCreator && props.lobbyEntries.length > 0 && (
          <div className="absolute top-24 left-4 z-[70] animate-in slide-in-from-left-4 fade-in duration-300 w-full max-w-sm">
             <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                         {props.lobbyEntries[0].display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <p className="font-bold text-white leading-tight">{props.lobbyEntries[0].display_name}</p>
                         <p className="text-xs text-zinc-400 mt-0.5">Wants to join the call</p>
                      </div>
                   </div>
                   <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => props.onAdmitReject(props.lobbyEntries[0].user_id, 'admit')}
                     className="flex-1 bg-white text-black py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-colors"
                   >
                     Admit
                   </button>
                   <button 
                     onClick={() => props.onAdmitReject(props.lobbyEntries[0].user_id, 'reject')}
                     className="flex-1 bg-zinc-800 text-zinc-300 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-700 hover:text-white transition-colors border border-white/5"
                   >
                     Deny
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* ── Side Panel (Chat / Participants) ── */}
      <div 
        className={`
          shrink-0 overflow-hidden h-full
          bg-zinc-950 border-l border-white/10 
          transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${(showChat || showParticipants) 
            ? 'w-full fixed inset-0 z-[60] md:relative md:z-auto md:w-[400px]' 
            : 'w-0 border-l-0'}
        `}
      >
        <div className="w-full md:w-[400px] h-full">
           {showChat && <ChatSidebar roomCode={props.roomCode} isOpen={true} onClose={() => setShowChat(false)} currentUserId={localParticipant.identity} />}
           {showParticipants && <ParticipantList isOpen={true} onClose={() => setShowParticipants(false)} />}
        </div>
      </div>

    </div>
  )
}
