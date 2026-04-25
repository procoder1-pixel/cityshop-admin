import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session!.user.id)
    .single()

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Admin account configuration</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Admin Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary">
            {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <div className="font-semibold">{profile?.full_name}</div>
            <div className="text-sm text-muted-foreground">{profile?.email}</div>
            <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15 inline-block">Administrator</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Platform Config</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-muted-foreground">Supabase Project</div>
          <div className="font-mono text-xs">pehvrvgptplowukdgone</div>
          <div className="text-muted-foreground">Platform</div>
          <div>CityShop Ghana</div>
          <div className="text-muted-foreground">Admin URL</div>
          <div className="text-xs font-mono">admin.cityshop.com</div>
        </div>
      </div>

      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 space-y-3">
        <h2 className="font-semibold text-sm text-destructive uppercase tracking-wider">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          To grant or revoke admin access, set the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">is_admin</code> flag
          directly in the <code className="text-xs bg-muted px-1.5 py-0.5 rounded">profiles</code> table in Supabase.
          The middleware will revoke sessions immediately on next request.
        </p>
      </div>
    </div>
  )
}
