import { createServerSupabaseClient } from '@/lib/supabase/server'
import StoresClient from './StoresClient'

export const revalidate = 0

export default async function StoresPage() {
  const supabase = createServerSupabaseClient()
  const { data: stores } = await supabase
    .from('stores')
    .select('*, profiles(full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stores</h1>
        <p className="text-muted-foreground text-sm mt-1">{stores?.length ?? 0} stores registered</p>
      </div>
      <StoresClient stores={stores ?? []} />
    </div>
  )
}
