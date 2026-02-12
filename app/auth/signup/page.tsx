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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 mb-2">InterMeet</Link>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Create your account</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Get started with free video conferencing</p>
        </div>

        {success ? (
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 rounded-xl space-y-2">
            <div className="text-4xl mb-2">📧</div>
            <p className="font-bold text-green-800 dark:text-green-400">Check your email!</p>
            <p className="text-sm text-green-700 dark:text-green-300">We sent a confirmation link to <strong className="font-semibold">{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Full Name</label>
              <input
                type="text"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-zinc-400"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
                maxLength={100}
                autoComplete="name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email</label>
              <input
                type="email"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-zinc-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Password</label>
              <input
                type="password"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-zinc-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        )}

        <hr className="my-8 border-t border-zinc-200 dark:border-white/10" />

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
