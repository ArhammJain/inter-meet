'use client'

import { useEffect, useState } from 'react'

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('intermeet-theme') as 'light' | 'dark' | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('intermeet-theme', next)
  }

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="sun" aria-hidden="true">☀️</span>
      <span className="moon" aria-hidden="true">🌙</span>
    </button>
  )
}
