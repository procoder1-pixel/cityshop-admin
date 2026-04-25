# CityShop Admin Dashboard

Secure Next.js 14 admin panel for the CityShop Ghana platform.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (same project as main app)
- React Hook Form + Zod
- Lucide Icons

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Copy `.env.local.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://pehvrvgptplowukdgone.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key   ← from Supabase → Settings → API
NEXT_PUBLIC_SITE_URL=https://admin.cityshop.com
```

### 3. Run the SQL migration
In Supabase SQL Editor, run `add_admin_flag.sql` then grant yourself admin:
```sql
UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your@email.com';
```

### 4. Run locally
```bash
npm run dev   # → http://localhost:3000
```

### 5. Deploy to Vercel
```bash
npx vercel
```
Set custom domain to `admin.cityshop.com` in Vercel → Project → Settings → Domains.

## Security Model

| Layer | Mechanism |
|-------|-----------|
| Route protection | `middleware.ts` — runs on every request |
| JIT session validation | Re-fetches `is_admin` from DB on every request |
| Login gate | Checks `is_admin` before issuing session |
| Immediate revocation | Set `is_admin = FALSE` in Supabase → next request kicks them out |
| DB policies | RLS policies enforce admin-only reads/writes at DB level |

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Admin login with JIT role check |
| `/dashboard/overview` | Platform stats + recent withdrawals |
| `/dashboard/withdrawals` | Approve / reject MoMo payout requests |
| `/dashboard/stores` | View all stores, activate/deactivate |
| `/dashboard/products` | Paginated product table + add product slide-over |
| `/dashboard/agents` | All agent accounts |
| `/dashboard/promoters` | All promoter accounts |
| `/dashboard/settings` | Admin profile + platform config |
