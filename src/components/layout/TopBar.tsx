import type { Profile } from '@/types/database'
import { Bell } from 'lucide-react'

export default function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <button className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {profile.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="text-sm">
            <div className="font-medium leading-none">{profile.full_name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  )
}
