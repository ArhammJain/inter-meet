'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#09090B] p-4 relative overflow-hidden font-sans selection:bg-[#2057CC]/20 selection:text-[#2057CC]">
      {/* Premium Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#2057CC]/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      {/* Theme Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeSwitcher />
      </div>

      {/* Glass Card */}
      <div className="w-full max-w-[440px] bg-white/70 dark:bg-zinc-900/60 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2rem] p-8 md:p-10 shadow-2xl ring-1 ring-black/5 relative z-10 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-[#2057CC] flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#2057CC]/30 transition-transform group-hover:scale-110 group-hover:-rotate-3">
              IM
            </div>
          </Link>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Create Account</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 font-medium text-center max-w-[280px]">
            Join InterMeet for seamless, high-fidelity video collaboration.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center p-8 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 ring-4 ring-emerald-50 dark:ring-emerald-900/10">
                <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Check your inbox</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
              We've sent a verification link to <br/>
              <span className="font-semibold text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">{email}</span>
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Click the link to activate your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#2057CC] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2057CC]/10 focus:border-[#2057CC] transition-all placeholder-zinc-400 text-zinc-900 dark:text-white font-medium"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#2057CC] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  className="w-full bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#2057CC]/10 focus:border-[#2057CC] transition-all placeholder-zinc-400 text-zinc-900 dark:text-white font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                      <span>Creating Account...</span>
                  </>
              ) : (
                  <>
                      <span>Get Started</span>
                      <ArrowRight className="w-5 h-5 opacity-80" />
                  </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/5 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#2057CC] font-bold hover:text-[#1a49ad] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      
      {/* Footer Copyright */}
      <div className="absolute bottom-6 text-center pointer-events-none">
         <p className="text-xs text-zinc-400 dark:text-zinc-600 font-medium">
            © InterMeet Inc. Secure Sign-up.
         </p>
      </div>
    </div>
  )
}