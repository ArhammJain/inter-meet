'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || '')
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    const cleanName = fullName.replace(/[<>"'&]/g, '').trim().slice(0, 100)
    if (!cleanName) {
      toast('Please enter a valid name', 'error')
      setSaving(false)
      return
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: cleanName },
    })

    if (authError) {
      toast(authError.message, 'error')
      setSaving(false)
      return
    }

    if (user) {
      await supabase
        .from('profiles')
        .update({ full_name: cleanName, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    toast('Profile updated!', 'success')
    setSaving(false)
    router.refresh()
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="page-center">
        <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div className="skeleton" style={{ width: 72, height: 72, borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: 200, height: 20 }} />
            <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: '100%', height: 44, borderRadius: 10 }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-center">
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
        <ThemeSwitcher />
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <button
          onClick={() => router.push('/dashboard')}
          className="btn btn-ghost btn-sm"
          style={{ marginBottom: '1rem', padding: '0.25rem 0' }}
        >
          ← Back to Dashboard
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div className="avatar" style={{ width: 72, height: 72, fontSize: '1.5rem' }}>
            {getInitials(fullName || user?.email || '?')}
          </div>
          <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
            {user?.email}
          </p>
          <p style={{ marginTop: '0.25rem', color: 'var(--muted-light)', fontSize: '0.75rem' }}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="input-label">Full Name</label>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
              maxLength={100}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.5 }}
            />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary btn-full" style={{ marginTop: '0.25rem' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
