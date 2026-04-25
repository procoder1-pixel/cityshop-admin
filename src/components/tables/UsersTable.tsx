'use client'
import { useState } from 'react'
import { formatDate, cn } from '@/lib/utils'
import { UserCheck, UserX, ShieldCheck, Trash2, ToggleLeft, ToggleRight, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

type UserWithStore = Profile & {
  stores?: Array<{ name: string; is_active: boolean; is_verified: boolean }>
}

export default function UsersTable({ users: initial, role }: { users: UserWithStore[]; role: string }) {
  const [search, setSearch]   = useState('')
  const [users, setUsers]     = useState<UserWithStore[]>(initial)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  async function logAction(action: string, targetId: string, detail: string) {
    const user = (await supabase.auth.getUser()).data.user
    await supabase.from('audit_logs').insert({
      action,
      target_user_id: targetId,
      detail,
      admin_id: user?.id ?? null,
    })
  }

  async function toggleVerified(u: UserWithStore) {
    setLoading(u.id + '_verify')
    const val = !u.stores?.[0]?.is_verified
    const { error } = await supabase.from('stores').update({ is_verified: val }).eq('owner_id', u.id)
    if (!error) {
      await logAction('verify_store', u.id, `Set is_verified=${val} for ${u.email}`)
      setUsers(prev => prev.map(x => x.id === u.id
        ? { ...x, stores: x.stores?.map(s => ({ ...s, is_verified: val })) }
        : x))
    }
    setLoading(null)
  }

  async function toggleSuspend(u: UserWithStore) {
    setLoading(u.id + '_suspend')
    const val = !u.is_suspended
    const { error } = await supabase.from('profiles').update({ is_suspended: val }).eq('id', u.id)
    if (!error) {
      await logAction('suspend_user', u.id, `Set is_suspended=${val} for ${u.email}`)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_suspended: val } : x))
    }
    setLoading(null)
  }

  async function toggleSubscription(u: UserWithStore) {
    setLoading(u.id + '_sub')
    const val = !u.subscription_active
    const end = val ? new Date(Date.now() + 30 * 86400000).toISOString() : null
    const { error } = await supabase.from('profiles')
      .update({ subscription_active: val, subscription_end: end, paystack_ref: val ? 'MANUAL_OVERRIDE' : '' })
      .eq('id', u.id)
    if (!error) {
      await logAction('toggle_subscription', u.id, `Set subscription_active=${val} for ${u.email}`)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, subscription_active: val } : x))
    }
    setLoading(null)
  }

  async function deleteUser(u: UserWithStore) {
    if (!confirm(`Permanently delete ${u.full_name} (${u.email})? This cannot be undone.`)) return
    setLoading(u.id + '_delete')
    await logAction('delete_user', u.id, `Deleted ${u.role} ${u.email}`)
    const { error } = await supabase.from('profiles').delete().eq('id', u.id)
    if (!error) setUsers(prev => prev.filter(x => x.id !== u.id))
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder={`Search ${role}s…`}
        className="w-full max-w-sm px-3 py-2 rounded-lg bg-card border border-input text-sm outline-none focus:ring-2 focus:ring-ring" />

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              {role === 'agent' && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>}
              {role === 'agent' && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subscription</th>}
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-10">No {role}s found.</td></tr>
            )}
            {filtered.map(u => (
              <tr key={u.id} className={cn('hover:bg-muted/20 transition-colors', u.is_suspended && 'opacity-50')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {u.full_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="font-medium">{u.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>

                {role === 'agent' && (
                  <td className="px-4 py-3">
                    {u.stores?.[0]
                      ? <div className="flex items-center gap-1.5 text-xs">
                          <Store className="w-3 h-3" />
                          {u.stores[0].name}
                          {u.stores[0].is_verified && <ShieldCheck className="w-3 h-3 text-green-400" />}
                        </div>
                      : <span className="text-muted-foreground text-xs">No store</span>}
                  </td>
                )}

                {role === 'agent' && (
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSubscription(u)}
                      disabled={!!loading}
                      title="Click to toggle subscription"
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 w-fit hover:opacity-80 transition-opacity',
                        u.subscription_active
                          ? 'bg-green-400/10 text-green-400 border-green-400/20'
                          : 'bg-muted text-muted-foreground border-border'
                      )}>
                      {loading === u.id + '_sub'
                        ? '…'
                        : u.subscription_active
                          ? <><ToggleRight className="w-3 h-3" />Active</>
                          : <><ToggleLeft className="w-3 h-3" />Inactive</>}
                    </button>
                  </td>
                )}

                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>

                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border',
                    u.is_suspended
                      ? 'bg-red-400/10 text-red-400 border-red-400/20'
                      : 'bg-muted text-muted-foreground border-border')}>
                    {u.is_suspended ? 'Suspended' : 'Active'}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {role === 'agent' && (
                      <button
                        onClick={() => toggleVerified(u)}
                        disabled={!!loading}
                        title={u.stores?.[0]?.is_verified ? 'Remove verification' : 'Verify store'}
                        className={cn('p-1.5 rounded-lg transition-colors',
                          u.stores?.[0]?.is_verified
                            ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20'
                            : 'text-muted-foreground hover:text-green-400 hover:bg-green-400/10')}>
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleSuspend(u)}
                      disabled={!!loading}
                      title={u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      className={cn('p-1.5 rounded-lg transition-colors',
                        u.is_suspended
                          ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                          : 'text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10')}>
                      {loading === u.id + '_suspend'
                        ? <span className="text-xs">…</span>
                        : u.is_suspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteUser(u)}
                      disabled={!!loading}
                      title="Delete user"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                      {loading === u.id + '_delete'
                        ? <span className="text-xs">…</span>
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
