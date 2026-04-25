import { createServerSupabaseClient } from '@/lib/supabase/server'
import AnnouncementsClient from './AnnouncementsClient'
import { Megaphone } from 'lucide-react'

export const revalidate = 0

export default async function AnnouncementsPage() {
  const supabase = createServerSupabaseClient()
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" /> Announcements
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Post banner messages to all user dashboards</p>
      </div>
      <AnnouncementsClient announcements={announcements ?? []} />
    </div>
  )
}
