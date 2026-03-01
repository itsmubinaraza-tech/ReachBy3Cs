-- Fix RLS policy for users table to allow reading own profile
-- This resolves the circular dependency where users couldn't read their profile
-- because the existing policy required organization_id lookup which needs the profile

-- Add policy allowing users to read their own profile by auth.uid()
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- Also add policy for organizations so users can read their own org
CREATE POLICY "Users can read own organization" ON organizations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.organization_id = organizations.id)
  );
