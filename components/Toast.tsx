'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 200)
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 3500)
  }, [removeToast])

  const icons: Record<ToastType, string> = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-100 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium min-w-[300px] pointer-events-auto cursor-pointer border
              transition-all duration-200 ease-in-out z-100
              ${t.exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0 animate-in slide-in-from-bottom-2 fade-in'}
              ${t.type === 'error' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400' : 
                t.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400' : 
                'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white'}
            `}
            onClick={() => removeToast(t.id)}
          >
            <span className="text-lg">{icons[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
