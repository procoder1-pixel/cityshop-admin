import { createServerSupabaseClient } from '@/lib/supabase/server'
import WithdrawalsClient from './WithdrawalsClient'

export const revalidate = 0

export default async function WithdrawalsPage() {
  const supabase = createServerSupabaseClient()
  const { data: withdrawals } = await supabase
    .from('withdrawals')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and process MoMo payout requests</p>
      </div>
      <WithdrawalsClient withdrawals={withdrawals ?? []} />
    </div>
  )
}
