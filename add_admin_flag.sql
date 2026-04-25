-- ============================================================
-- Run in Supabase SQL Editor
-- Adds is_admin flag + admin RLS policies for all tables
-- ============================================================

-- 1. Add is_admin to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Grant your own account admin access (replace with your user ID)
-- Find your user ID: Supabase → Authentication → Users
-- UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your@email.com';

-- 3. Admin read policies (service role bypasses RLS, but these cover anon key usage)
CREATE POLICY "admin_read_profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_read_stores" ON public.stores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_update_stores" ON public.stores
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_read_withdrawals" ON public.withdrawals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_update_withdrawals" ON public.withdrawals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_read_products" ON public.products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_insert_products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "admin_delete_products" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );
