'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      toast(error.message, 'error')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="page-center">
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
        <ThemeSwitcher />
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" className="brand-logo" style={{ fontSize: '1.5rem', display: 'inline-block', marginBottom: '0.5rem' }}>InterMeet</Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Welcome back</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: '0.25rem' }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <hr className="divider" />

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
