'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const unauthorized = params.get('reason') === 'unauthorized'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    // JIT check — verify is_admin before entering dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_admin) {
      await supabase.auth.signOut()
      setError('Access denied. This account does not have admin privileges.')
      setLoading(false)
      return
    }

    router.push('/dashboard/overview')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at top, hsl(0 84% 8%) 0%, hsl(222 47% 6%) 60%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">CityShop Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Secure administration portal</p>
        </div>

        {unauthorized && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            Your admin access has been revoked. Please contact support.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@cityshop.com"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring transition"
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Sign In to Admin'}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          admin.cityshop.com · Restricted access
        </p>
      </div>
    </div>
  )
}
