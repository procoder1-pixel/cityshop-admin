'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, cn } from '@/lib/utils'
import { Trash2, Send } from 'lucide-react'
import type { Announcement } from '@/types/database'

const TYPES = ['info', 'warning', 'success', 'error'] as const
type AType = typeof TYPES[number]

const typeStyle: Record<AType, string> = {
  info:    'bg-blue-400/10 text-blue-400 border-blue-400/20',
  warning: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  success: 'bg-green-400/10 text-green-400 border-green-400/20',
  error:   'bg-red-400/10 text-red-400 border-red-400/20',
}

type TargetRole = 'all' | 'agents' | 'promoters'

export default function AnnouncementsClient({ announcements: initial }: { announcements: Announcement[] }) {
  const [items, setItems]     = useState<Announcement[]>(initial)
  const [message, setMessage] = useState('')
  const [type, setType]       = useState<AType>('info')
  const [target, setTarget]   = useState<TargetRole>('all')
  const [posting, setPosting] = useState(false)
  const supabase = createClient()

  async function post() {
    if (!message.trim()) return
    setPosting(true)
    const insert = {
      message:     message.trim(),
      type:        type,
      target_role: target,
      is_active:   true,
    }
    const { data, error } = await supabase
      .from('announcements')
      .insert(insert)
      .select()
      .single()
    if (!error && data) {
      const user = (await supabase.auth.getUser()).data.user
      await supabase.from('audit_logs').insert({
        action:   'post_announcement',
        detail:   `Posted "${message.trim().slice(0, 60)}" to ${target}`,
        admin_id: user?.id ?? null,
        target_user_id: null,
      })
      setItems(prev => [data as Announcement, ...prev])
      setMessage('')
    }
    setPosting(false)
  }

  async function remove(id: string, msg: string) {
    if (!confirm('Delete this announcement?')) return
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) {
      const user = (await supabase.auth.getUser()).data.user
      await supabase.from('audit_logs').insert({
        action:        'delete_announcement',
        detail:        `Deleted: "${msg.slice(0, 60)}"`,
        admin_id:      user?.id ?? null,
        target_user_id: null,
      })
      setItems(prev => prev.filter(x => x.id !== id))
    }
  }

  async function toggleActive(item: Announcement) {
    const val = !item.is_active
    const { error } = await supabase.from('announcements').update({ is_active: val }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_active: val } : x))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-base">New Announcement</h2>
        <textarea
          value={message} onChange={e => setMessage(e.target.value)}
          rows={3} placeholder="Write your announcement message…"
          className="w-full px-3 py-2 rounded-lg bg-background border border-input text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={cn('px-3 py-1 rounded-full text-xs font-semibold border capitalize transition-all',
                  type === t ? typeStyle[t] : 'bg-muted text-muted-foreground border-border hover:opacity-80')}>
                {t}
              </button>
            ))}
          </div>
          <select
            value={target}
            onChange={e => setTarget(e.target.value as TargetRole)}
            className="px-3 py-1 rounded-lg bg-background border border-input text-sm outline-none">
            <option value="all">All users</option>
            <option value="agents">Agents only</option>
            <option value="promoters">Promoters only</option>
          </select>
          <button onClick={post} disabled={posting || !message.trim()}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Send className="w-4 h-4" />
            {posting ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No announcements yet.</p>
        )}
        {items.map(a => (
          <div key={a.id} className={cn(
            'rounded-xl border p-4 flex items-start gap-3 transition-opacity',
            !a.is_active && 'opacity-50',
            typeStyle[a.type as AType]
          )}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{a.message}</p>
              <div className="flex gap-3 mt-1 text-xs opacity-70">
                <span className="capitalize">{a.type}</span>
                <span>→ {a.target_role}</span>
                <span>{formatDate(a.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(a)}
                className="text-xs px-2 py-1 rounded-md border border-current opacity-70 hover:opacity-100 transition-opacity">
                {a.is_active ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => remove(a.id, a.message)}
                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
