import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Users, Store, Package, Wallet, TrendingUp, Clock } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

async function getStats() {
  const supabase = createServerSupabaseClient()
  const [profiles, stores, products, withdrawals] = await Promise.all([
    supabase.from('profiles').select('id, role, created_at', { count: 'exact' }),
    supabase.from('stores').select('id, is_active', { count: 'exact' }),
    supabase.from('products').select('id', { count: 'exact' }),
    supabase.from('withdrawals').select('id, amount, status, created_at, full_name, network, role').order('created_at', { ascending: false }),
  ])
  return {
    totalUsers:     profiles.count ?? 0,
    agents:         profiles.data?.filter(p => p.role === 'agent').length ?? 0,
    promoters:      profiles.data?.filter(p => p.role === 'promoter').length ?? 0,
    activeStores:   stores.data?.filter(s => s.is_active).length ?? 0,
    totalStores:    stores.count ?? 0,
    totalProducts:  products.count ?? 0,
    pendingWd:      withdrawals.data?.filter(w => w.status === 'pending').length ?? 0,
    totalWdAmount:  withdrawals.data?.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0) ?? 0,
    recentWd:       withdrawals.data?.slice(0, 5) ?? [],
  }
}

export default async function OverviewPage() {
  const stats = await getStats()

  const cards = [
    { label: 'Total Users',      value: stats.totalUsers,                icon: Users,      color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
    { label: 'Active Stores',    value: stats.activeStores,              icon: Store,      color: 'text-green-400',  bg: 'bg-green-400/10'  },
    { label: 'Total Products',   value: stats.totalProducts,             icon: Package,    color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Pending Payouts',  value: stats.pendingWd,                 icon: Clock,      color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Agents',           value: stats.agents,                    icon: TrendingUp, color: 'text-red-400',    bg: 'bg-red-400/10'    },
    { label: 'Total Paid Out',   value: formatCurrency(stats.totalWdAmount), icon: Wallet, color: 'text-emerald-400',bg: 'bg-emerald-400/10'},
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide stats at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Recent withdrawals */}
      <div className="rounded-xl border border-border bg-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Recent Withdrawal Requests</h2>
        </div>
        <div className="divide-y divide-border">
          {stats.recentWd.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No withdrawal requests yet.</p>
          )}
          {stats.recentWd.map((w: any) => (
            <div key={w.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <div className="font-medium text-sm">{w.full_name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {w.network} · {w.role} · {formatDate(w.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">{formatCurrency(w.amount)}</span>
                <StatusBadge status={w.status} />
              </div>
            </div>
          ))}
        </div>
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
