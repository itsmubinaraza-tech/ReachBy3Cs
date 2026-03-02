-- =====================================================
-- FIX: Add INSERT policies for signup flow
-- =====================================================
-- Problem: RLS policies only had SELECT policies for organizations
-- and users tables, blocking new user signup.

-- Allow authenticated users to INSERT organizations
-- (They can only create orgs, not read other orgs)
CREATE POLICY "orgs_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to INSERT their own user profile
-- (Must match auth.uid())
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Allow users to UPSERT (required for onConflict upsert pattern)
-- This covers the case where trigger already created the user
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
