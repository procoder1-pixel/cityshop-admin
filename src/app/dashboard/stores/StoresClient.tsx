'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatDate, cn } from '@/lib/utils'
import { ExternalLink, ToggleLeft, ToggleRight, Loader2, Store } from 'lucide-react'

export default function StoresClient({ stores }: { stores: any[] }) {
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleStore(id: string, current: boolean) {
    setToggling(id)
    const supabase = createClient()
    await supabase.from('stores').update({ is_active: !current }).eq('id', id)
    router.refresh()
    setToggling(null)
  }

  return (
    <div className="space-y-4">
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search stores…"
        className="w-full max-w-sm px-3 py-2 rounded-lg bg-card border border-input text-sm outline-none focus:ring-2 focus:ring-ring" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Store</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Owner</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-muted-foreground py-10">No stores found.</td></tr>
            )}
            {filtered.map((s: any) => (
              <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {s.logo_url
                      ? <Image src={s.logo_url} alt={s.name} width={32} height={32} className="rounded-lg object-cover w-8 h-8 flex-shrink-0" />
                      : <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">{s.name[0]}</div>
                    }
                    <span className="font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{s.profiles?.full_name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{s.profiles?.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-muted-foreground">{s.slug}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.created_at)}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold border',
                    s.is_active ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20')}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={`https://cityshop.com/store.html?slug=${s.slug}`} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => toggleStore(s.id, s.is_active)} disabled={toggling === s.id}
                      className={cn('p-1.5 rounded-lg transition-colors',
                        s.is_active
                          ? 'text-green-400 hover:bg-green-400/10'
                          : 'text-muted-foreground hover:text-green-400 hover:bg-green-400/10')}>
                      {toggling === s.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : s.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />
                      }
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
