'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const cleanName = fullName.replace(/[<>"'&]/g, '').trim().slice(0, 100)
    if (!cleanName) {
      toast('Please enter a valid name', 'error')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      setSuccess(true)
      toast('Check your email for a confirmation link!', 'success')
    }
    setLoading(false)
  }

  return (
    <div className="page-center">
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
        <ThemeSwitcher />
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" className="brand-logo" style={{ fontSize: '1.5rem', display: 'inline-block', marginBottom: '0.5rem' }}>InterMeet</Link>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Create your account</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Get started with free video conferencing</p>
        </div>

        {success ? (
          <div className="alert alert-success" style={{ textAlign: 'center', flexDirection: 'column', gap: '0.5rem', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem' }}>📧</div>
            <p style={{ fontWeight: 600 }}>Check your email!</p>
            <p style={{ fontSize: '0.85rem' }}>We sent a confirmation link to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                maxLength={100}
                autoComplete="name"
              />
            </div>

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
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: '0.25rem' }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        )}

        <hr className="divider" />

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
