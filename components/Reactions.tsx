'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface Reaction {
  id: number
  emoji: string
  x: number
}

const REACTION_OPTIONS = [
  { emoji: '\u270B', label: 'Raise hand' },
  { emoji: '\uD83D\uDC4D', label: 'Thumbs up' },
  { emoji: '\uD83D\uDC4F', label: 'Clap' },
  { emoji: '\u2764\uFE0F', label: 'Heart' },
  { emoji: '\uD83D\uDE02', label: 'Laugh' },
  { emoji: '\uD83C\uDF89', label: 'Celebrate' },
]

export default function Reactions() {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const idRef = useRef(0)

  const sendReaction = useCallback((emoji: string) => {
    const id = ++idRef.current
    const x = 20 + Math.random() * 60
    setReactions((prev) => [...prev, { id, emoji, x }])
    setShowPicker(false)

    // Remove after animation
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id))
    }, 2500)
  }, [])

  return (
    <>
      {/* Floating reactions */}
      <div className="reactions-overlay" aria-hidden="true">
        {reactions.map((r) => (
          <span
            key={r.id}
            className="reaction-bubble"
            style={{ left: `${r.x}%` }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Reaction trigger */}
      <div style={{ position: 'relative' }}>
        {showPicker && (
          <div className="reaction-picker" role="menu" aria-label="Reactions">
            {REACTION_OPTIONS.map((r) => (
              <button
                key={r.label}
                className="reaction-pick-btn"
                onClick={() => sendReaction(r.emoji)}
                role="menuitem"
                aria-label={r.label}
                title={r.label}
              >
                {r.emoji}
              </button>
            ))}
          </div>
        )}
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowPicker(!showPicker)}
          aria-label="Open reactions"
          aria-expanded={showPicker}
        >
          {showPicker ? 'X' : '\u270B'}
        </button>
      </div>
    </>
  )
}
