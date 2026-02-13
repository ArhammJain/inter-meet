'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import Navbar from '@/components/Navbar'
import type { User } from '@supabase/supabase-js'
import { Camera, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Fetch profile data including avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setFullName(profile.full_name || user.user_metadata?.full_name || '')
          setAvatarUrl(profile.avatar_url)
        } else {
          setFullName(user.user_metadata?.full_name || '')
        }
      }
      setLoading(false)
    }
    init()
  }, [supabase])

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // 1. Validate file
    if (!file.type.startsWith('image/')) {
      toast('Please upload an image file', 'error')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast('Image must be less than 2MB', 'error')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 4. Update Profile in DB
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 5. Update Auth Meta (optional but good for consistency)
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      setAvatarUrl(publicUrl)
      toast('Avatar updated successfully!', 'success')
    } catch (err) {
      const error = err as Error
      console.error('Error uploading avatar:', error)
      toast(error.message || 'Error uploading image', 'error')
    } finally {
      setUploading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-sm border border-zinc-200 dark:border-white/5 space-y-4 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse mx-auto" />
            <div className="w-48 h-6 bg-zinc-200 dark:bg-zinc-800 animate-pulse mx-auto rounded" />
            <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
            <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative pt-24 md:pt-32">
      <Navbar />

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-8 shadow-sm">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6 flex items-center gap-1"
        >
          ← Back to Dashboard
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden border-4 border-white dark:border-zinc-800 ring-1 ring-zinc-200 dark:ring-white/10 mb-3">
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt="Avatar" 
                  width={96} 
                  height={96} 
                  className="w-full h-full object-cover"
                  unoptimized // Use unoptimized for Supabase storage to avoid extra setup/billing if not configured
                />
              ) : (
                getInitials(fullName || user?.email || '?')
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                   <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <label 
              className={`absolute bottom-3 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white dark:border-zinc-800 transition-all hover:scale-110 active:scale-95 ${uploading ? 'opacity-0 pointer-events-none' : ''}`}
              title="Change Avatar"
            >
               <Camera size={16} />
               <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>

          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-2">
            {user?.email}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Full Name</label>
            <input
              type="text"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-zinc-400 font-medium"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email</label>
            <input
              type="email"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none opacity-50 cursor-not-allowed"
              value={user?.email || ''}
              disabled
            />
          </div>

          <button 
            type="submit" 
            disabled={saving} 
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 mt-2"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
