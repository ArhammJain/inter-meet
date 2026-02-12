'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  sender_name: string
  is_me?: boolean // Optional flag if you want to distinguish visually in frontend logic
}

interface ChatSidebarProps {
  roomCode: string
  isOpen: boolean
  onClose: () => void
  currentUserId?: string // Pass this if you have it to distinguish 'me' vs 'them'
}

export default function ChatSidebar({ roomCode, isOpen, onClose, currentUserId }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Determine if a message is from the current user (simple heuristic or passed prop)
  const isMe = (msg: Message) => {
    // If you don't have currentUserId available in props, 
    // you might need to fetch it or store it in context.
    // For now, this is a placeholder check.
    return msg.user_id === currentUserId
  }

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?roomCode=${roomCode}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch { /* ignore */ }
  }, [roomCode])

  useEffect(() => {
    if (!isOpen) return
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, content }),
      })

      if (res.ok) {
        setNewMessage('')
        await fetchMessages()
      } else {
        const errorText = await res.text()
        console.error(`Failed to send message: ${res.status} ${res.statusText} - ${errorText}`)
      }
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-white/5 shadow-2xl relative" role="complementary" aria-label="Meeting chat">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
           </div>
           <h2 className="font-semibold text-white tracking-wide">In-Call Messages</h2>
        </div>
        <button
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          onClick={onClose}
          aria-label="Close chat"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="12" y1="7" x2="12" y2="13"/></svg>
            </div>
            <p className="text-sm font-medium text-zinc-400">No messages yet</p>
            <p className="text-xs text-zinc-600 mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
             const me = isMe(msg)
             // Check if previous message was from same sender to group visually
             const isSequence = idx > 0 && messages[idx - 1].user_id === msg.user_id
             
             return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${me ? 'items-end' : 'items-start'} ${isSequence ? 'mt-1' : 'mt-4'} animate-in slide-in-from-bottom-2 duration-300`}
              >
                {!isSequence && (
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    <span className="text-xs font-bold text-zinc-400">{msg.sender_name}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{formatTime(msg.created_at)}</span>
                  </div>
                )}
                
                <div className={`
                  max-w-[85%] px-4 py-2.5 text-sm break-words shadow-sm
                  ${me 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                    : 'bg-zinc-800 text-zinc-200 border border-white/5 rounded-2xl rounded-tl-none'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-zinc-900/80 backdrop-blur-md border-t border-white/5">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1 group">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Send a message..."
              className="w-full bg-zinc-950 border border-white/10 rounded-full pl-5 pr-12 py-3.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-inner"
              disabled={sending}
              autoComplete="off"
            />
            
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white disabled:opacity-0 disabled:scale-75 disabled:pointer-events-none hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              {sending ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              )}
            </button>
          </div>
        </form>
        <div className="text-center mt-2">
           <p className="text-[10px] text-zinc-600">Messages are visible to everyone in the call</p>
        </div>
      </div>
    </div>
  )
}