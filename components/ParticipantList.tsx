'use client'

import { useParticipants, useRoomContext } from '@livekit/components-react'
import { RemoteParticipant, RoomEvent } from 'livekit-client'
import { useEffect, useState } from 'react'

interface ParticipantListProps {
  isOpen: boolean
  onClose: () => void
}

export default function ParticipantList({ isOpen, onClose }: ParticipantListProps) {
  const participants = useParticipants()
  const room = useRoomContext()
  const [hands, setHands] = useState<Set<string>>(new Set())

  // Listen for hand raise events
  useEffect(() => {
    const onData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        const identity = participant?.identity || 'unknown'
        if (msg.type === 'hand') {
          setHands(prev => { 
            const s = new Set(prev)
            if (msg.raised) s.add(identity)
            else s.delete(identity) 
            return s 
          })
        }
      } catch { /* ignore */ }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => { room.off(RoomEvent.DataReceived, onData) }
  }, [room])

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-white/5 shadow-2xl relative" role="complementary" aria-label="Participants list">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
           </div>
           <h2 className="font-semibold text-white tracking-wide">People ({participants.length})</h2>
        </div>
        <button
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={onClose}
          aria-label="Close participants list"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {participants.map((p) => {
           const isMe = p.isLocal
           const isSpeaking = p.isSpeaking
           const hasHandRaised = hands.has(p.identity)

           return (
             <div key={p.identity} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group">
               <div className="flex items-center gap-3">
                 <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-white/10 ${isSpeaking ? 'ring-2 ring-blue-500 bg-zinc-800' : 'bg-zinc-800/50'}`}>
                    {(p.name || p.identity).charAt(0).toUpperCase()}
                    {hasHandRaised && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-[10px] rounded-full flex items-center justify-center border border-zinc-900">✋</div>
                    )}
                 </div>
                 <div>
                   <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                     {p.name || p.identity}
                     {isMe && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-white/5">You</span>}
                   </p>
                   <p className="text-[10px] text-zinc-500">{isSpeaking ? 'Speaking...' : 'In meeting'}</p>
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 {/* Mic Status */}
                 <div className={`p-1.5 rounded-full ${p.isMicrophoneEnabled ? 'text-zinc-400' : 'text-red-500 bg-red-500/10'}`}>
                   {p.isMicrophoneEnabled ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
                   ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" x2="12" y1="19" y2="23"/><line x1="8" x2="16" y1="23" y2="23"/></svg>
                   )}
                 </div>
                 
                 {/* Camera Status */}
                 <div className={`p-1.5 rounded-full ${p.isCameraEnabled ? 'text-zinc-400' : 'text-red-500 bg-red-500/10'}`}>
                    {p.isCameraEnabled ? (
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    ) : (
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 0.66 6-4.32v11.32l-6-4.32"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    )}
                 </div>
               </div>
             </div>
           )
        })}
      </div>
    </div>
  )
}
