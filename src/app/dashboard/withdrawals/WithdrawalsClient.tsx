// @ts-nocheck
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { CheckCircle, XCircle, Loader2, Phone, Copy, Banknote } from 'lucide-react'

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected'] as const

export default function WithdrawalsClient({ withdrawals }) {
  const router  = useRouter()
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(null)
  const [note, setNote]       = useState({})
  const [momoRef, setMomoRef] = useState({})
  const [copied, setCopied]   = useState(null)

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter)

  const counts = {
    pending:  withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  }

  const totalPaid = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((s, w) => s + Number(w.amount), 0)

  async function updateStatus(id, status) {
    setLoading(id)
    const supabase = createClient()
    const noteText = status === 'approved' && momoRef[id]
      ? `MoMo Ref: ${momoRef[id]}${note[id] ? ' · ' + note[id] : ''}`
      : note[id] ?? ''
    await supabase.from('withdrawals')
      .update({ status, note: noteText, updated_at: new Date().toISOString() })
      .eq('id', id)
    // Log audit
    const user = (await supabase.auth.getUser()).data.user
    await (supabase as any).from('audit_logs').insert({
      action: status === 'approved' ? 'approve_withdrawal' : 'reject_withdrawal',
      detail: `${status} withdrawal of GH₵${withdrawals.find(w=>w.id===id)?.amount} for ${withdrawals.find(w=>w.id===id)?.full_name}. ${noteText}`,
      admin_id: user?.id ?? null,
      target_user_id: withdrawals.find(w=>w.id===id)?.user_id ?? null,
    })
    router.refresh()
    setLoading(null)
  }

  function copyNumber(num) {
    navigator.clipboard.writeText(num)
    setCopied(num)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: counts.pending, color: 'text-yellow-400' },
          { label: 'Approved', value: counts.approved, color: 'text-green-400' },
          { label: 'Rejected', value: counts.rejected, color: 'text-red-400' },
          { label: 'Total Paid Out', value: `GH₵ ${totalPaid.toFixed(2)}`, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

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
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
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
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-sm">{w.momo_number}</span>
                    <button onClick={() => copyNumber(w.momo_number)}
                      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy number">
                      <Copy className="w-3 h-3" />
                    </button>
                    {copied === w.momo_number && <span className="text-xs text-green-400">Copied!</span>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{w.network}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-base">{formatCurrency(w.amount)}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(w.created_at)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={w.status} />
                  {w.note && <div className="text-xs text-muted-foreground mt-1 max-w-xs">{w.note}</div>}
                </td>
                <td className="px-4 py-3">
                  {w.status === 'pending' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="MoMo transaction ref…"
                        value={momoRef[w.id] ?? ''}
                        onChange={e => setMomoRef(n => ({ ...n, [w.id]: e.target.value }))}
                        className="px-2 py-1 text-xs rounded-md bg-background border border-input outline-none focus:ring-1 focus:ring-ring w-full"
                      />
                      <input
                        type="text"
                        placeholder="Optional note…"
                        value={note[w.id] ?? ''}
                        onChange={e => setNote(n => ({ ...n, [w.id]: e.target.value }))}
                        className="px-2 py-1 text-xs rounded-md bg-background border border-input outline-none focus:ring-1 focus:ring-ring w-full"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(w.id, 'approved')} disabled={loading === w.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-400/10 text-green-400 border border-green-400/20 text-xs font-medium hover:bg-green-400/20 transition-colors disabled:opacity-50">
                          {loading === w.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
                          Mark Paid
                        </button>
                        <button onClick={() => updateStatus(w.id, 'rejected')} disabled={loading === w.id}
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-400/10 text-red-400 border border-red-400/20 text-xs font-medium hover:bg-red-400/20 transition-colors disabled:opacity-50">
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
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

function StatusBadge({ status }) {
  const map = {
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
