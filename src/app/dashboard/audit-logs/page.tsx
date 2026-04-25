import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ShieldAlert } from 'lucide-react'

export const revalidate = 0

const ACTION_LABELS: Record<string, string> = {
  verify_store:        '✅ Verified store',
  suspend_user:        '🚫 Suspended user',
  delete_user:         '🗑 Deleted user',
  toggle_subscription: '💳 Toggled subscription',
  post_announcement:   '📢 Posted announcement',
  delete_announcement: '🗑 Deleted announcement',
}

export default async function AuditLogsPage() {
  const supabase = createServerSupabaseClient()
  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-primary" /> Audit Logs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Record of all admin actions</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Detail</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!logs?.length && (
              <tr><td colSpan={3} className="text-center text-muted-foreground py-10">No audit logs yet.</td></tr>
            )}
            {logs?.map(log => (
              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs max-w-md truncate">
                  {log.detail ?? '—'}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {formatDate(log.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
