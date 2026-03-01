-- =====================================================
-- ReachBy3Cs COMPLETE DATABASE SETUP (CLEAN INSTALL)
-- Project: lwubdaoaqoutcutqhnim
-- URL: https://lwubdaoaqoutcutqhnim.supabase.co
--
-- WARNING: This script DROPS ALL EXISTING TABLES
-- and recreates them from scratch!
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL EXISTING OBJECTS (COMPLETE CLEANUP)
-- =====================================================

-- Drop trigger on auth.users first (this one always exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop all functions (CASCADE will drop dependent triggers)
DROP FUNCTION IF EXISTS public.get_user_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_cluster_member_count() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_cts_score(DECIMAL, DECIMAL, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.check_auto_post_eligibility(DECIMAL, TEXT, INTEGER) CASCADE;

-- Drop all existing tables (CASCADE handles foreign keys and triggers)
DROP TABLE IF EXISTS public.automation_rules CASCADE;
DROP TABLE IF EXISTS public.daily_metrics CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.cluster_members CASCADE;
DROP TABLE IF EXISTS public.engagement_queue CASCADE;
DROP TABLE IF EXISTS public.responses CASCADE;
DROP TABLE IF EXISTS public.risk_scores CASCADE;
DROP TABLE IF EXISTS public.signals CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.clusters CASCADE;
DROP TABLE IF EXISTS public.organization_platforms CASCADE;
DROP TABLE IF EXISTS public.problem_categories CASCADE;
DROP TABLE IF EXISTS public.platforms CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- =====================================================
-- STEP 2: ENABLE EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- STEP 3: CREATE TABLES
-- =====================================================

-- Organizations (Tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{"theme": "default", "auto_post_enabled": false}',
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'reviewer', 'member')),
  notification_preferences JSONB DEFAULT '{"push": true, "email": true}',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Platforms
CREATE TABLE public.platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_url TEXT,
  base_url TEXT,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem Categories
CREATE TABLE public.problem_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Organization Platform Credentials
CREATE TABLE public.organization_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES public.platforms(id) ON DELETE CASCADE,
  credentials JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  auto_post_enabled BOOLEAN DEFAULT false,
  daily_post_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform_id)
);

-- Posts (Detected from platforms)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES public.platforms(id),
  external_id TEXT,
  external_url TEXT,
  content TEXT,
  content_type TEXT DEFAULT 'post',
  author_handle TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,
  platform_metadata JSONB DEFAULT '{}',
  parent_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  crawl_source TEXT,
  crawl_query TEXT,
  external_created_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signals (AI Analysis)
CREATE TABLE public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  problem_category_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
  emotional_intensity DECIMAL(4,3),
  keywords TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(4,3),
  entities JSONB DEFAULT '{}',
  sentiment TEXT,
  urgency_level TEXT,
  raw_analysis JSONB,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Scores
CREATE TABLE public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'blocked')),
  risk_score DECIMAL(4,3),
  context_flags TEXT[] DEFAULT '{}',
  risk_factors JSONB DEFAULT '{}',
  recommended_action TEXT,
  requires_human_review BOOLEAN DEFAULT false,
  block_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clusters
CREATE TABLE public.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  problem_category_id UUID REFERENCES public.problem_categories(id) ON DELETE SET NULL,
  keywords TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Responses (Generated by AI)
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES public.signals(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE SET NULL,
  value_first_response TEXT,
  soft_cta_response TEXT,
  contextual_response TEXT,
  selected_response TEXT,
  selected_type TEXT DEFAULT 'value_first' CHECK (selected_type IN ('value_first', 'soft_cta', 'contextual', 'custom')),
  cta_level INTEGER DEFAULT 0 CHECK (cta_level BETWEEN 0 AND 3),
  cta_analysis JSONB DEFAULT '{}',
  cts_score DECIMAL(4,3),
  cts_breakdown JSONB DEFAULT '{}',
  can_auto_post BOOLEAN DEFAULT false,
  auto_post_reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited', 'posted', 'failed', 'expired')),
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_device TEXT,
  review_notes TEXT,
  original_response TEXT,
  edited_response TEXT,
  edited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  posted_external_id TEXT,
  posted_external_url TEXT,
  posting_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Queue
CREATE TABLE public.engagement_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES public.responses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  queue_position INTEGER,
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'skipped', 'expired')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Cluster Members
CREATE TABLE public.cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES public.clusters(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  similarity_score DECIMAL(4,3),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cluster_id, post_id)
);

-- Audit Log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_category TEXT,
  entity_type TEXT,
  entity_id UUID,
  action_data JSONB DEFAULT '{}',
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Metrics
CREATE TABLE public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  posts_detected INTEGER DEFAULT 0,
  signals_generated INTEGER DEFAULT 0,
  responses_generated INTEGER DEFAULT 0,
  responses_approved INTEGER DEFAULT 0,
  responses_rejected INTEGER DEFAULT 0,
  responses_auto_posted INTEGER DEFAULT 0,
  platform_breakdown JSONB DEFAULT '{}',
  risk_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, metric_date)
);

-- =====================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- =====================================================

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_org_id uuid;
BEGIN
  -- Find or create default organization
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'weattuned' LIMIT 1;

  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id FROM organizations LIMIT 1;
  END IF;

  IF default_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, settings)
    VALUES ('Default Organization', 'default-org', '{"theme": "default", "auto_post_enabled": false}'::jsonb)
    RETURNING id INTO default_org_id;
  END IF;

  -- Upsert user profile
  INSERT INTO public.users (id, organization_id, email, full_name, role, notification_preferences)
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

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Auto-create user profile when someone signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_responses_updated_at
  BEFORE UPDATE ON public.responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clusters_updated_at
  BEFORE UPDATE ON public.clusters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 7: CREATE RLS POLICIES
-- =====================================================

-- USERS TABLE
CREATE POLICY "users_read_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR organization_id = get_user_organization_id());

CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_service" ON public.users
  FOR ALL TO service_role
  USING (true);

-- ORGANIZATIONS TABLE
CREATE POLICY "orgs_read" ON public.organizations
  FOR SELECT TO authenticated
  USING (id = get_user_organization_id());

CREATE POLICY "orgs_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "orgs_service" ON public.organizations
  FOR ALL TO service_role
  USING (true);

-- PLATFORMS TABLE (Public read)
CREATE POLICY "platforms_read" ON public.platforms
  FOR SELECT
  USING (true);

CREATE POLICY "platforms_service" ON public.platforms
  FOR ALL TO service_role
  USING (true);

-- PROBLEM CATEGORIES TABLE
CREATE POLICY "categories_read" ON public.problem_categories
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "categories_service" ON public.problem_categories
  FOR ALL TO service_role
  USING (true);

-- ORGANIZATION PLATFORMS TABLE
CREATE POLICY "org_platforms_read" ON public.organization_platforms
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "org_platforms_service" ON public.organization_platforms
  FOR ALL TO service_role
  USING (true);

-- POSTS TABLE
CREATE POLICY "posts_read" ON public.posts
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "posts_service" ON public.posts
  FOR ALL TO service_role
  USING (true);

-- SIGNALS TABLE
CREATE POLICY "signals_read" ON public.signals
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = signals.post_id
    AND posts.organization_id = get_user_organization_id()
  ));

CREATE POLICY "signals_service" ON public.signals
  FOR ALL TO service_role
  USING (true);

-- RISK SCORES TABLE
CREATE POLICY "risk_read" ON public.risk_scores
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM signals
    JOIN posts ON posts.id = signals.post_id
    WHERE signals.id = risk_scores.signal_id
    AND posts.organization_id = get_user_organization_id()
  ));

CREATE POLICY "risk_service" ON public.risk_scores
  FOR ALL TO service_role
  USING (true);

-- RESPONSES TABLE
CREATE POLICY "responses_read" ON public.responses
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM signals
    JOIN posts ON posts.id = signals.post_id
    WHERE signals.id = responses.signal_id
    AND posts.organization_id = get_user_organization_id()
  ));

CREATE POLICY "responses_update" ON public.responses
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM signals
    JOIN posts ON posts.id = signals.post_id
    WHERE signals.id = responses.signal_id
    AND posts.organization_id = get_user_organization_id()
  ));

CREATE POLICY "responses_service" ON public.responses
  FOR ALL TO service_role
  USING (true);

-- ENGAGEMENT QUEUE TABLE
CREATE POLICY "queue_read" ON public.engagement_queue
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "queue_update" ON public.engagement_queue
  FOR UPDATE TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "queue_service" ON public.engagement_queue
  FOR ALL TO service_role
  USING (true);

-- CLUSTERS TABLE
CREATE POLICY "clusters_read" ON public.clusters
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "clusters_service" ON public.clusters
  FOR ALL TO service_role
  USING (true);

-- CLUSTER MEMBERS TABLE
CREATE POLICY "members_read" ON public.cluster_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clusters
    WHERE clusters.id = cluster_members.cluster_id
    AND clusters.organization_id = get_user_organization_id()
  ));

CREATE POLICY "members_service" ON public.cluster_members
  FOR ALL TO service_role
  USING (true);

-- AUDIT LOG TABLE
CREATE POLICY "audit_read" ON public.audit_log
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "audit_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "audit_service" ON public.audit_log
  FOR ALL TO service_role
  USING (true);

-- DAILY METRICS TABLE
CREATE POLICY "metrics_read" ON public.daily_metrics
  FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "metrics_service" ON public.daily_metrics
  FOR ALL TO service_role
  USING (true);

-- =====================================================
-- STEP 8: CREATE INDEXES
-- =====================================================
CREATE INDEX idx_users_org ON public.users(organization_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_posts_org ON public.posts(organization_id);
CREATE INDEX idx_posts_platform ON public.posts(platform_id);
CREATE INDEX idx_posts_detected ON public.posts(detected_at DESC);
CREATE INDEX idx_signals_post ON public.signals(post_id);
CREATE INDEX idx_risk_signal ON public.risk_scores(signal_id);
CREATE INDEX idx_responses_signal ON public.responses(signal_id);
CREATE INDEX idx_responses_status ON public.responses(status);
CREATE INDEX idx_responses_created ON public.responses(created_at DESC);
CREATE INDEX idx_queue_org ON public.engagement_queue(organization_id);
CREATE INDEX idx_queue_status ON public.engagement_queue(status);
CREATE INDEX idx_clusters_org ON public.clusters(organization_id);

-- =====================================================
-- STEP 9: INSERT SEED DATA
-- =====================================================

-- Insert default organization (WeAttuned)
INSERT INTO public.organizations (id, name, slug, settings)
VALUES ('aaaa1111-1111-1111-1111-111111111111', 'WeAttuned', 'weattuned',
  '{"theme": "default", "auto_post_enabled": false, "daily_post_limit": 50}');

-- Insert platforms
INSERT INTO public.platforms (id, name, slug, icon_url, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Reddit', 'reddit', '/icons/reddit.svg', true),
  ('22222222-2222-2222-2222-222222222222', 'Twitter/X', 'twitter', '/icons/twitter.svg', true),
  ('33333333-3333-3333-3333-333333333333', 'Quora', 'quora', '/icons/quora.svg', true),
  ('44444444-4444-4444-4444-444444444444', 'LinkedIn', 'linkedin', '/icons/linkedin.svg', true),
  ('55555555-5555-5555-5555-555555555555', 'Google Search', 'google', '/icons/google.svg', true);

-- Insert problem categories for WeAttuned
INSERT INTO public.problem_categories (id, organization_id, name, slug, keywords, description) VALUES
  ('ca711111-1111-1111-1111-111111111111', 'aaaa1111-1111-1111-1111-111111111111',
   'Relationship Communication', 'relationship-communication',
   ARRAY['relationship', 'partner', 'communicate', 'talk'],
   'Issues related to communication within relationships'),
  ('ca722222-2222-2222-2222-222222222222', 'aaaa1111-1111-1111-1111-111111111111',
   'Conflict Resolution', 'conflict-resolution',
   ARRAY['conflict', 'argument', 'fight', 'resolve'],
   'Managing and resolving conflicts'),
  ('ca733333-3333-3333-3333-333333333333', 'aaaa1111-1111-1111-1111-111111111111',
   'Emotional Connection', 'emotional-connection',
   ARRAY['emotional', 'connection', 'intimacy', 'distant'],
   'Building and maintaining emotional bonds');

-- Link platforms to WeAttuned organization
INSERT INTO public.organization_platforms (organization_id, platform_id, is_enabled) VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', true),
  ('aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', true),
  ('aaaa1111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', true),
  ('aaaa1111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', true);

-- =====================================================
-- STEP 10: GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- DONE!
-- =====================================================
SELECT 'SUCCESS: Database setup complete!' as status,
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as tables_created;
