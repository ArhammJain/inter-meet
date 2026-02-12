'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  sender_name: string
}

interface ChatSidebarProps {
  roomCode: string
  isOpen: boolean
  onClose: () => void
}

export default function ChatSidebar({ roomCode, isOpen, onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
  }, [isOpen, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    setSending(true)
    setNewMessage('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, content }),
      })

      if (res.ok) {
        fetchMessages()
      }
    } catch { /* ignore */ }
    setSending(false)
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) return null

  return (
    <div className="chat-sidebar" role="complementary" aria-label="Meeting chat">
      <div className="chat-header">
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Chat</span>
        <button
          className="btn btn-outline btn-sm"
          onClick={onClose}
          aria-label="Close chat"
          style={{ padding: '0.2rem 0.5rem' }}
        >
          X
        </button>
      </div>

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '2rem' }}>
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              <div className="chat-message-header">
                <span className="chat-sender">{msg.sender_name}</span>
                <span className="chat-time">{formatTime(msg.created_at)}</span>
              </div>
              <div className="chat-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <input
          ref={inputRef}
          className="input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={1000}
          aria-label="Chat message"
          style={{ fontSize: '0.85rem', padding: '0.5rem 0.625rem' }}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!newMessage.trim() || sending}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  )
}
