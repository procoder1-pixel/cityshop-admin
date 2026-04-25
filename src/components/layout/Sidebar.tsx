'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Users, Megaphone, Store,
  Wallet, Settings, ShieldCheck, LogOut, ScrollText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const nav = [
  { label: 'Overview',       href: '/dashboard/overview',       icon: LayoutDashboard },
  { label: 'Withdrawals',    href: '/dashboard/withdrawals',    icon: Wallet },
  { label: 'Stores',         href: '/dashboard/stores',         icon: Store },
  { label: 'Products',       href: '/dashboard/products',       icon: Package },
  { label: 'Agents',         href: '/dashboard/agents',         icon: Users },
  { label: 'Promoters',      href: '/dashboard/promoters',      icon: Megaphone },
  { label: 'Announcements',  href: '/dashboard/announcements',  icon: Megaphone },
  { label: 'Audit Logs',     href: '/dashboard/audit-logs',     icon: ScrollText },
  { label: 'Settings',       href: '/dashboard/settings',       icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm leading-none">CityShop</div>
            <div className="text-xs text-muted-foreground mt-0.5">Admin Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary/10 text-primary border border-primary/15'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-border">
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
