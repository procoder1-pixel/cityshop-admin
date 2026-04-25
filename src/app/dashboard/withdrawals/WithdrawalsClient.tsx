'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Withdrawal } from '@/types/database'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { CheckCircle, XCircle, Loader2, Phone } from 'lucide-react'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const

export default function WithdrawalsClient({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const router  = useRouter()
  const [filter, setFilter]   = useState<typeof STATUS_FILTERS[number]>('all')
  const [loading, setLoading] = useState<string | null>(null)
  const [note, setNote]       = useState<Record<string, string>>({})

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter)

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setLoading(id)
    const supabase = createClient()
    await supabase.from('withdrawals').update({ status, note: note[id] ?? '' }).eq('id', id)
    router.refresh()
    setLoading(null)
  }

  const counts = {
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              filter === f
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            )}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span className="ml-1.5 text-xs opacity-70">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">MoMo Details</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-10">No requests found.</td></tr>
            )}
            {filtered.map(w => (
              <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium">{w.full_name}</div>
                  <div className="text-xs text-muted-foreground">{w.email} · {w.role}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono">{w.momo_number}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{w.network}</div>
                </td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(w.amount)}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(w.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                <td className="px-4 py-3">
                  {w.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Optional note…"
                        value={note[w.id] ?? ''}
                        onChange={e => setNote(n => ({ ...n, [w.id]: e.target.value }))}
                        className="px-2 py-1 text-xs rounded-md bg-background border border-input outline-none focus:ring-1 focus:ring-ring w-32"
                      />
                      <button onClick={() => updateStatus(w.id, 'approved')} disabled={loading === w.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-400/10 text-green-400 border border-green-400/20 text-xs font-medium hover:bg-green-400/20 transition-colors disabled:opacity-50">
                        {loading === w.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Approve
                      </button>
                      <button onClick={() => updateStatus(w.id, 'rejected')} disabled={loading === w.id}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-400/10 text-red-400 border border-red-400/20 text-xs font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50">
                        <XCircle className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{w.note || '—'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
    approved: 'bg-green-400/10  text-green-400  border-green-400/20',
    rejected: 'bg-red-400/10    text-red-400    border-red-400/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${map[status] ?? ''}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
