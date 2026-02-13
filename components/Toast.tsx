'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'info' | 'success' | 'error'

interface Toast {
  id: number
  message: string
  type: ToastType
  exiting?: boolean
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// --- Internal Component to handle Swipe Logic & UI ---
function ToastItem({ t, onRemove }: { t: Toast; onRemove: (id: number) => void }) {
  const [dragX, setDragX] = useState(0)
  const touchStartX = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const currentX = e.touches[0].clientX
      const diff = currentX - touchStartX.current
      // Only allow dragging right
      if (diff > 0) setDragX(diff)
    }
  }

  const handleTouchEnd = () => {
    if (dragX > 100) {
      // Swipe threshold met
      onRemove(t.id)
    } else {
      // Snap back
      setDragX(0)
    }
    touchStartX.current = null
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${dragX}px)`,
        opacity: 1 - dragX / 200, // Fade out as you swipe
        touchAction: 'none'
      }}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm
        min-w-[300px] max-w-[400px] pointer-events-auto cursor-grab active:cursor-grabbing
        bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800
        transition-all duration-300 ease-out
        ${t.exiting 
          ? 'opacity-0 translate-x-10 scale-95' 
          : 'animate-in slide-in-from-bottom-5 fade-in duration-300'}
      `}
    >
      {/* Minimal Icon */}
      <div className={`shrink-0 ${
        t.type === 'error' ? 'text-red-500' : 
        t.type === 'success' ? 'text-emerald-500' : 
        'text-blue-500'
      }`}>
        {t.type === 'success' ? <CheckCircle2 size={18} /> :
         t.type === 'error' ? <AlertCircle size={18} /> :
         <Info size={18} />}
      </div>

      {/* Content - Removed Titles for Minimalism */}
      <p className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-200 leading-snug">
        {t.message}
      </p>

      {/* Subtle Close Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(t.id); }}
        className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors pl-2 border-l border-zinc-100 dark:border-zinc-800"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Container: Centered on mobile, Bottom-Right on Desktop */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 flex flex-col items-center md:items-end gap-2 z-[100] pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} t={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}