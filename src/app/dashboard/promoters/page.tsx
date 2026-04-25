import { createServerSupabaseClient } from '@/lib/supabase/server'
import UsersTable from '@/components/tables/UsersTable'

export const revalidate = 0

export default async function PromotersPage() {
  const supabase = createServerSupabaseClient()
  const { data: promoters } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'promoter')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Promoters</h1>
        <p className="text-muted-foreground text-sm mt-1">{promoters?.length ?? 0} registered promoters</p>
      </div>
      <UsersTable users={promoters ?? []} role="promoter" />
    </div>
  )
}
