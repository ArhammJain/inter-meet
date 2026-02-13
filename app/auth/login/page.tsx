'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B] p-4 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#2057CC]/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeSwitcher />
      </div>

      {/* Glass Card */}
      <div className="w-full max-w-[420px] bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2rem] p-8 md:p-10 shadow-2xl ring-1 ring-black/5 relative z-10 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-[#2057CC] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#2057CC]/30 transition-transform group-hover:scale-110 group-hover:rotate-3">
              IM
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Welcome back</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium">
            Enter your details to sign in
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#2057CC] transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2057CC]/10 focus:border-[#2057CC] transition-all placeholder-zinc-400 text-zinc-900 dark:text-white font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@work.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Password</label>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#2057CC] transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2057CC]/10 focus:border-[#2057CC] transition-all placeholder-zinc-400 text-zinc-900 dark:text-white font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-[#2057CC] hover:bg-[#1a49ad] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(32,87,204,0.39)] hover:shadow-[0_6px_20px_rgba(32,87,204,0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying...</span>
                </>
            ) : (
                <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5 opacity-80" />
                </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/5 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-[#2057CC] font-bold hover:text-[#1a49ad] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
      
      {/* Footer Copyright */}
      <div className="absolute bottom-6 text-center">
         <p className="text-xs text-zinc-400 dark:text-zinc-600 font-medium">
            © InterMeet Inc. Secure Login.
         </p>
      </div>
    </div>
  )
}