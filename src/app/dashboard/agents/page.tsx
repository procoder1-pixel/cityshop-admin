import { createServerSupabaseClient } from '@/lib/supabase/server'
import UsersTable from '@/components/tables/UsersTable'

export const revalidate = 0

export default async function AgentsPage() {
  const supabase = createServerSupabaseClient()
  const { data: agents } = await supabase
    .from('profiles')
    .select('*, stores(name, is_active)')
    .eq('role', 'agent')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-muted-foreground text-sm mt-1">{agents?.length ?? 0} registered agents</p>
      </div>
      <UsersTable users={agents ?? []} role="agent" />
    </div>
  )
}
