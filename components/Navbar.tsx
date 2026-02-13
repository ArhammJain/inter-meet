'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ThemeSwitcher from './ThemeSwitcher'
import Image from 'next/image'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('?')
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        // Get profile for avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()

        if (profile) {
          setAvatarUrl(profile.avatar_url)
          const name = profile.full_name || user.email || '?'
          setInitials(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2))
        } else {
           const name = user.email || '?'
           setInitials(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2))
        }
      }
    }
    getUser()
  }, [supabase])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 pointer-events-none">
      {/* Pointer events auto for interactive elements */}
      
      {/* Left: Logo */}
      <div className="pointer-events-auto">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/20 transition-transform group-hover:scale-110">
            IM
          </div>
          <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight hidden md:block">
            InterMeet
          </span>
        </Link>
      </div>

      {/* Center: Spacer */}
      <div className="flex-1" />

      {/* Right: Actions */}
      <div className="pointer-events-auto flex items-center gap-4">
        <ThemeSwitcher />
        
        {user && (
          <Link href="/dashboard/profile" className="relative group block">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 p-[2px] shadow-lg transition-transform hover:scale-105 active:scale-95">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden relative">
                 {avatarUrl ? (
                   <Image 
                     src={avatarUrl} 
                     alt="Profile" 
                     width={40} 
                     height={40} 
                     className="w-full h-full object-cover"
                     unoptimized
                   />
                 ) : (
                   <span className="text-xs font-bold text-white">{initials}</span>
                 )}
              </div>
            </div>
          </Link>
        )}
      </div>
    </nav>
  )
}
