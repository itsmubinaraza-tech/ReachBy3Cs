-- Migration: Auto-create user profile on signup
-- This ensures that when a user signs up via Supabase Auth,
-- a corresponding record is created in the users table
-- which is required for RLS policies to work correctly

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_org_id uuid;
BEGIN
  -- Try to find a default organization or create one
  -- In production, users typically select or create an org during onboarding
  -- This is a fallback to ensure the user record can be created
  SELECT id INTO default_org_id FROM organizations LIMIT 1;

  -- If no organization exists, create a default one
  IF default_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, settings)
    VALUES (
      'Default Organization',
      'default-org',
      '{"theme": "default", "auto_post_enabled": false}'::jsonb
    )
    RETURNING id INTO default_org_id;
  END IF;

  -- Insert the user profile
  INSERT INTO public.users (
    id,
    organization_id,
    email,
    full_name,
    role,
    notification_preferences
  )
  VALUES (
    new.id,
    default_org_id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'member',
    '{"push": true, "email": true}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = now();

  RETURN new;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also handle updates (in case email changes)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
  'Automatically creates a user profile in the users table when a new user signs up via Supabase Auth. '
  'This ensures RLS policies that depend on get_user_organization_id() function work correctly.';
