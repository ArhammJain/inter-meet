'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  useRoomContext,
  useTracks,
  useLocalParticipant,
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
  onEndMeeting: () => void
  onAdmitReject: (userId: string, action: 'admit' | 'reject') => void
}

const EMOJIS = ['👍', '👏', '😂', '❤️', '🎉', '🔥', '😮', '✋']

// --- UI Components ---

const Tooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
  <div className="group relative flex items-center justify-center">
    {children}
    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-950/90 text-zinc-100 text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-white/10 shadow-xl backdrop-blur-sm z-50">
      {text}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45" />
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
  const baseClass = "relative flex items-center justify-center transition-all duration-200 ease-out active:scale-95"
  const sizeClass = "w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl"
  
  let colorClass = "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 border border-transparent"
  
  if (active) {
    colorClass = danger 
      ? "bg-red-500 text-white shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] border-red-400/20" 
      : "bg-zinc-100 text-zinc-900 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] border-white"
  } else if (danger) {
     colorClass = "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
  }

  return (
    <Tooltip text={label || ''}>
      <button onClick={onClick} className={`${baseClass} ${sizeClass} ${colorClass} ${className}`}>
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

  const toggleScreen = () => {
    const enabled = localParticipant.isScreenShareEnabled
    localParticipant.setScreenShareEnabled(!enabled)
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
      <div className="flex-1 flex flex-col relative h-full transition-all duration-300 ease-in-out">
        
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
                    {/* Avatar Circle (always visible since video tiles were removed) */}
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <div className="w-24 h-24 rounded-full shadow-2xl overflow-hidden bg-zinc-800 flex items-center justify-center text-2xl font-bold text-white">
                         {getParticipantAvatar(track.participant) ? (
                           <img src={getParticipantAvatar(track.participant)!} className="w-full h-full object-cover" alt="Avatar" />
                         ) : (
                           getInitials(track.participant.name || track.participant.identity)
                         )}
                      </div>
                    </div>
                    
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
          <div ref={stageRef} className="flex-1 relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl ring-1 ring-white/5 group">
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
            {/* Stage Avatar */}
            {focusTrack && (
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
                      {hands.has(focusTrack?.participant.identity || '') && (
                         <div className="bg-indigo-600 text-white px-3 py-2 rounded-xl shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-2">
                            ✋ Raised Hand
                         </div>
                      )}
                   </div>
                </div>
              </div>
              {tracks.length > 1 && (
                <div className="hidden lg:flex flex-col gap-3 w-[280px] h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {tracks.filter(t => t !== focusTrack).map(track => (
                    <div key={track.publication?.trackSid || track.participant.identity} className="relative w-full aspect-video shrink-0 bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 ring-1 ring-white/5 cursor-pointer hover:ring-indigo-500/50 transition-all group">

                      {/* Minimalist Avatar Overlay */}
                      {!track.participant.isCameraEnabled && (
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

                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                         <div className="flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded backdrop-blur-sm max-w-[80%]">
                            {getParticipantAvatar(track.participant) && (
                              <div className="w-3 h-3 rounded-full overflow-hidden border border-white/20">
                                <img src={getParticipantAvatar(track.participant)} className="w-full h-full object-cover" alt="" />
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-white truncate">
                               {track.participant.name || track.participant.identity}
                            </span>
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
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center z-50 pointer-events-none px-4">
          
          {isMobile ? (
            // Mobile Controls
            <div className="pointer-events-auto w-full max-w-sm mx-auto">
               <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-[24px] p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,1)] ring-1 ring-white/5">
                  <div className="flex items-center justify-between gap-1">
                     <ControlButton onClick={toggleMic} active={localParticipant.isMicrophoneEnabled}>
                        {localParticipant.isMicrophoneEnabled 
                          ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                          : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        }
                     </ControlButton>
                     
                     <ControlButton onClick={toggleCam} active={localParticipant.isCameraEnabled}>
                        {localParticipant.isCameraEnabled 
                          ? <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          : <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        }
                     </ControlButton>

                     <ControlButton onClick={() => setShowEmoji(!showEmoji)} active={showEmoji} className="text-indigo-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     </ControlButton>

                     <ControlButton onClick={() => setShowMoreMenu(true)} active={showMoreMenu}>
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                     </ControlButton>

                     <div className="w-px h-8 bg-white/10 mx-1" />

                     <ControlButton onClick={props.onEndMeeting} danger>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
                     </ControlButton>
                  </div>
               </div>
                
               {/* Mobile Emoji Drawer */}
               {showEmoji && (
                  <div ref={pickerRef} className="absolute bottom-[calc(100%+16px)] left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
                     <div className="flex justify-between gap-1">
                        {EMOJIS.map(e => (
                           <button key={e} onClick={() => sendReaction(e)} className="text-2xl hover:scale-125 transition-transform p-1">
                              {e}
                           </button>
                        ))}
                     </div>
                  </div>
               )}

               {/* ── MOBILE DRAWER (Bento Grid) ── */}
               {showMoreMenu && (
                 <>
                   {/* Backdrop */}
                   <div 
                     className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm animate-in fade-in duration-300" 
                     onClick={() => setShowMoreMenu(false)}
                   />
                   
                   {/* Drawer Content */}
                   <div className="fixed bottom-0 left-0 right-0 z-[70] bg-zinc-900 rounded-t-[32px] p-6 border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
                      
                      {/* Handle */}
                      <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-8" />
                      
                      {/* Bento Grid */}
                      <div className="grid grid-cols-2 gap-4">
                         
                         {/* Card 1: People */}
                         <button 
                           onClick={() => { setShowParticipants(true); setShowChat(false); setShowMoreMenu(false) }}
                           className="flex flex-col items-center justify-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 p-6 rounded-3xl border border-white/5 transition-all active:scale-95"
                         >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <span className="font-semibold text-zinc-200">People</span>
                         </button>

                         {/* Card 2: Chat */}
                         <button 
                           onClick={() => { setShowChat(true); setShowParticipants(false); setShowMoreMenu(false) }}
                           className="flex flex-col items-center justify-center gap-3 bg-zinc-800/50 hover:bg-zinc-800 p-6 rounded-3xl border border-white/5 transition-all active:scale-95"
                         >
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <span className="font-semibold text-zinc-200">Chat</span>
                         </button>

                         {/* Card 3: Raise Hand (Wide) */}
                         <button 
                           onClick={() => { toggleHand(); setShowMoreMenu(false) }}
                           className={`col-span-2 flex items-center justify-between px-6 py-5 rounded-3xl border transition-all active:scale-95 ${
                             myHand 
                               ? 'bg-zinc-100 text-zinc-900 border-zinc-100' 
                               : 'bg-zinc-800/50 text-zinc-200 border-white/5 hover:bg-zinc-800'
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <span className="text-2xl">{myHand ? '👎' : '✋'}</span>
                               <span className="font-semibold text-lg">{myHand ? 'Lower Hand' : 'Raise Hand'}</span>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${myHand ? 'border-zinc-900' : 'border-zinc-500'}`}>
                               {myHand && <div className="w-3 h-3 bg-zinc-900 rounded-full" />}
                            </div>
                         </button>

                         {/* Card 4: Copy Link (Wide) */}
                         <button 
                           onClick={() => { props.onCopyInvite(); setShowMoreMenu(false) }}
                           className={`col-span-2 flex items-center justify-between px-6 py-5 rounded-3xl border border-white/5 transition-all active:scale-95 ${
                             props.copied ? 'bg-green-500/20 border-green-500/30' : 'bg-zinc-800/50 hover:bg-zinc-800'
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${props.copied ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                                  {props.copied 
                                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                  }
                               </div>
                               <span className={`font-semibold text-lg ${props.copied ? 'text-green-400' : 'text-zinc-200'}`}>
                                 {props.copied ? 'Link Copied' : 'Copy Invite Link'}
                               </span>
                            </div>
                         </button>

                         {/* Card 5: Screen Presenting (Wide) */}
                         <button 
                           onClick={() => { toggleScreen(); setShowMoreMenu(false) }}
                           className={`col-span-2 flex items-center justify-between px-6 py-5 rounded-3xl border transition-all active:scale-95 ${
                             localParticipant.isScreenShareEnabled 
                               ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_10px_30px_-5px_rgba(79,70,229,0.4)]' 
                               : 'bg-zinc-800/50 text-zinc-200 border-white/5 hover:bg-zinc-800'
                           }`}
                         >
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${localParticipant.isScreenShareEnabled ? 'bg-white/20' : 'bg-zinc-700'}`}>
                                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                               </div>
                               <span className="font-semibold text-lg">{localParticipant.isScreenShareEnabled ? 'Stop Presenting' : 'Present Screen'}</span>
                            </div>
                         </button>

                      </div>
                   </div>
                 </>
               )}
            </div>
          ) : (
            // Desktop Control Bar
            <div className="pointer-events-auto flex items-center gap-3 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 px-4 py-3 rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/5 max-w-4xl hover:bg-zinc-900/90 transition-colors">
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
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    }
                 </ControlButton>
                 <ControlButton onClick={toggleScreen} active={localParticipant.isScreenShareEnabled} label={localParticipant.isScreenShareEnabled ? "Stop Presenting" : "Present Screen"}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                 </ControlButton>
              </div>

              <div className="w-px h-8 bg-zinc-700/50 mx-2" />

              <div className="flex items-center gap-2 relative">
                 <ControlButton onClick={() => setShowEmoji(!showEmoji)} active={showEmoji} label="Reactions">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </ControlButton>
                 <ControlButton onClick={toggleHand} active={myHand} label="Raise Hand">
                    <div className="relative">
                       <svg className="w-5 h-5" fill={myHand ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                       {hands.size > 0 && (
                          <span className="absolute -top-3 -right-3 w-4 h-4 bg-indigo-500 rounded-full text-[10px] flex items-center justify-center font-bold ring-2 ring-zinc-900">{hands.size}</span>
                       )}
                    </div>
                 </ControlButton>
                 {showEmoji && (
                    <div ref={pickerRef} className="absolute bottom-[calc(100%+24px)] left-1/2 -translate-x-1/2 bg-zinc-950/90 backdrop-blur-xl border border-white/10 px-3 py-2.5 rounded-2xl flex gap-1 shadow-2xl z-[60]">
                       {EMOJIS.map(e => (
                          <button key={e} onClick={() => sendReaction(e)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125 text-xl">
                             {e}
                          </button>
                       ))}
                    </div>
                 )}
              </div>

              <div className="w-px h-8 bg-zinc-700/50 mx-2" />

              <div className="flex items-center gap-2">
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

              <div className="w-px h-8 bg-zinc-700/50 mx-2" />

              <button 
                onClick={props.onEndMeeting}
                className="group flex items-center gap-2 px-5 h-11 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all duration-300 border border-red-500/20 hover:border-red-500"
              >
                 <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
                 <span className="font-semibold text-sm">End</span>
              </button>
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

      {/* ── Sliding Sidebar ── */}
      <div 
        className={`
          fixed inset-y-0 right-0 z-[60] w-full md:w-[400px] 
          bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] 
          transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${(showChat || showParticipants) ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
         {showChat && <ChatSidebar roomCode={props.roomCode} isOpen={true} onClose={() => setShowChat(false)} currentUserId={localParticipant.identity} />}
         {showParticipants && <ParticipantList isOpen={true} onClose={() => setShowParticipants(false)} />}
      </div>

    </div>
  )
}