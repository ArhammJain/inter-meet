'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import Navbar from '@/components/Navbar'
import type { User } from '@supabase/supabase-js'
import { Camera, Loader2, User as UserIcon, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

// --- UI Components ---
const ProfileBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#FAFAFA] dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans selection:bg-[#2057CC]/20 selection:text-[#2057CC]">
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-[#2057CC]/5 blur-[120px] rounded-full mix-blend-multiply dark:hidden" />
      <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-multiply dark:hidden" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
)

const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/80 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 shadow-2xl ring-1 ring-black/5 rounded-3xl p-8 relative overflow-hidden transition-all duration-300 ${className}`}>
    {children}
  </div>
)

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
      <ProfileBackground>
         <Navbar />
         <div className="min-h-screen flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/5 space-y-6 text-center">
                <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse mx-auto" />
                <div className="space-y-3">
                   <div className="w-32 h-4 bg-zinc-100 dark:bg-zinc-800 animate-pulse mx-auto rounded-full" />
                   <div className="w-48 h-3 bg-zinc-100 dark:bg-zinc-800 animate-pulse mx-auto rounded-full" />
                </div>
                <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
            </div>
         </div>
      </ProfileBackground>
    )
  }

  return (
    <ProfileBackground>
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 pt-24 md:pt-32">
        <GlassCard className="w-full max-w-lg mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="absolute top-6 left-6 p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all group"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>

          <div className="flex flex-col items-center mb-8 mt-4">
            {/* Avatar Section */}
            <div className="relative group mb-6">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-4xl font-bold text-[#2057CC] shadow-2xl shadow-[#2057CC]/10 overflow-hidden border-[4px] border-white dark:border-zinc-900 ring-1 ring-zinc-200 dark:ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]">
                {avatarUrl ? (
                  <div className="relative w-full h-full">
                    <Image 
                      src={avatarUrl} 
                      alt="Avatar" 
                      fill
                      className="object-cover"
                      unoptimized 
                    />
                  </div>
                ) : (
                  <span className="select-none">{getInitials(fullName || user?.email || '?')}</span>
                )}
                
                {/* Upload Loading Overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-10">
                     <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Camera Action Button */}
              <label 
                className={`absolute bottom-1 right-1 w-10 h-10 bg-[#2057CC] hover:bg-[#1a49ad] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-[#2057CC]/30 border-[3px] border-white dark:border-zinc-900 transition-all hover:scale-110 active:scale-95 z-20 ${uploading ? 'opacity-0 pointer-events-none' : ''}`}
                title="Change Avatar"
              >
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>

            {/* User Info Header */}
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                {fullName || 'User Profile'}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full inline-block border border-zinc-200 dark:border-white/5">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-5">
              
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <input
                    type="text"
                    className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2057CC]/20 focus:border-[#2057CC] transition-all placeholder-zinc-400 font-medium text-zinc-900 dark:text-white text-base"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    maxLength={100}
                    />
                </div>
              </div>

              {/* Email Input (Read Only) */}
              <div className="space-y-2 opacity-75">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                        <Mail className="w-5 h-5" />
                    </div>
                    <input
                    type="email"
                    className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-12 py-3.5 outline-none text-zinc-500 dark:text-zinc-400 cursor-not-allowed text-base font-mono"
                    value={user?.email || ''}
                    disabled
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-emerald-500" title="Verified">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
                <button 
                type="submit" 
                disabled={saving} 
                className="w-full py-4 bg-[#2057CC] hover:bg-[#1a49ad] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(32,87,204,0.39)] hover:shadow-[0_6px_20px_rgba(32,87,204,0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                {saving ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Changes...
                    </>
                ) : (
                    'Save Profile Changes'
                )}
                </button>
            </div>
            
            <div className="text-center">
                 <p className="text-xs text-zinc-400 dark:text-zinc-600">
                    Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                 </p>
            </div>
          </form>
        </GlassCard>
      </div>
    </ProfileBackground>
  )
}