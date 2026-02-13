'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ThemeSwitcher from './ThemeSwitcher'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('?')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 dark:border-white/5 bg-white/70 dark:bg-black/70 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9 rounded-xl bg-[#2057CC] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_-3px_rgba(32,87,204,0.4)] transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_-3px_rgba(32,87,204,0.6)]">
               <span className="relative z-10">IM</span>
               {/* Subtle Shine Effect */}
               <div className="absolute inset-0 rounded-xl bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight hidden md:block group-hover:text-[#2057CC] transition-colors">
              InterMeet
            </span>
          </Link>
        </div>

        {/* Center: Spacer (Or Navigation Links if added later) */}
        <div className="flex-1" />

        {/* Right: Actions */}
        <div className="flex items-center gap-3 md:gap-5">
          <ThemeSwitcher />
          
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="group flex items-center gap-2 outline-none p-1 rounded-full transition-all"
              >
                <div className={`relative w-9 h-9 rounded-full p-[2px] transition-all duration-300 ${showDropdown ? 'bg-[#2057CC] shadow-[0_0_0_2px_rgba(32,87,204,0.2)]' : 'bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}>
                  <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
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
                       <span className="text-xs font-bold text-[#2057CC]">{initials}</span>
                     )}
                  </div>
                </div>
                {/* Desktop Name Label */}
                <span className="hidden md:block text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-[100px] truncate group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {user.user_metadata?.full_name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown size={14} className={`hidden md:block text-zinc-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full right-0 mt-3 w-60 bg-white/90 dark:bg-black/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/5 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 origin-top-right ring-1 ring-black/5">
                  
                  {/* Header */}
                  <div className="px-5 py-4 bg-zinc-50/50 dark:bg-white/5 border-b border-zinc-100 dark:border-white/5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {user.user_metadata?.full_name || 'Account'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-mono">
                      {user.email}
                    </p>
                  </div>

                  {/* Links */}
                  <div className="p-2 space-y-1">
                    <Link 
                      href="/dashboard/profile" 
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-[#2057CC]/10 hover:text-[#2057CC] dark:hover:text-[#2057CC] rounded-xl transition-colors group"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-[#2057CC] group-hover:bg-[#2057CC]/10 transition-colors">
                        <UserIcon size={16} />
                      </div>
                      Profile Settings
                    </Link>
                  </div>
                  
                  {/* Divider */}
                  <div className="h-px bg-zinc-100 dark:bg-white/5 mx-2 my-1" />

                  {/* Logout */}
                  <div className="p-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors group text-left"
                    >
                      <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                         <LogOut size={16} />
                      </div>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}