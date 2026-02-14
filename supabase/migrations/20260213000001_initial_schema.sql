-- =====================================================
-- NEEDS-MATCHED ENGAGEMENT PLATFORM
-- Initial Database Schema Migration
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For embeddings/clustering

-- =====================================================
-- CORE ENTITIES
-- =====================================================

-- Organizations (Tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'reviewer', 'member')),
  notification_preferences JSONB DEFAULT '{"push": true, "email": true, "sms": false}',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ
);

-- Problem Categories (Dynamic Taxonomy)
CREATE TABLE problem_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES problem_categories(id) ON DELETE SET NULL,
  keywords TEXT[] DEFAULT '{}',
  description TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Source Platforms
CREATE TABLE platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_url TEXT,
  base_url TEXT,
  config JSONB DEFAULT '{}',
  rate_limits JSONB DEFAULT '{"requests_per_minute": 60, "requests_per_day": 1000}',
  is_active BOOLEAN DEFAULT true,
  requires_api_key BOOLEAN DEFAULT false,
  supports_auto_post BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Platform Credentials
CREATE TABLE organization_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  credentials JSONB DEFAULT '{}',  -- Encrypted API keys, tokens
  is_enabled BOOLEAN DEFAULT true,
  auto_post_enabled BOOLEAN DEFAULT false,
  daily_post_limit INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform_id)
);

-- =====================================================
-- ENGAGEMENT DATA (FULL RETENTION)
-- =====================================================

-- Detected Posts (Original Content - NEVER DELETE)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform_id UUID REFERENCES platforms(id) ON DELETE RESTRICT,

  -- Original Content (RETAINED FOREVER)
  external_id TEXT NOT NULL,
  external_url TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'post' CHECK (content_type IN ('post', 'comment', 'reply', 'thread', 'question', 'answer')),
  author_handle TEXT,
  author_display_name TEXT,
  author_avatar_url TEXT,

  -- Platform Metadata (at detection time)
  platform_metadata JSONB DEFAULT '{}',  -- likes, shares, upvotes, etc.
  parent_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,  -- for replies/comments

  -- Crawl Information
  crawl_source TEXT,  -- 'api', 'scrape', 'search'
  crawl_query TEXT,   -- The search query that found this post

  -- Timestamps (FULL AUDIT)
  external_created_at TIMESTAMPTZ,  -- when originally posted on platform
  detected_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(platform_id, external_id)
);

-- Signals (from Signal Detection Skill - FULL DATA RETENTION)
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  problem_category_id UUID REFERENCES problem_categories(id) ON DELETE SET NULL,

  -- Signal Detection Output (RETAINED)
  emotional_intensity DECIMAL(4,3) CHECK (emotional_intensity >= 0 AND emotional_intensity <= 1),
  keywords TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Extracted Entities
  entities JSONB DEFAULT '{}',  -- Named entities, topics, etc.
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),

  -- Full AI Analysis (RETAINED)
  raw_llm_response TEXT,  -- Full LLM output for debugging
  raw_analysis JSONB,     -- Parsed structured analysis
  prompt_version TEXT,    -- Track which prompt version was used
  model_used TEXT,        -- Which LLM model processed this
  tokens_used INTEGER,    -- Token count for cost tracking

  -- Processing Timestamps
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Scores (from Risk Scoring Skill - FULL DATA RETENTION)
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,

  -- Risk Assessment Output (RETAINED)
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'blocked')),
  risk_score DECIMAL(4,3) CHECK (risk_score >= 0 AND risk_score <= 1),
  context_flags TEXT[] DEFAULT '{}',
  risk_factors JSONB DEFAULT '{}',  -- Detailed breakdown of risk factors
  recommended_action TEXT,

  -- Crisis Detection
  crisis_indicators TEXT[] DEFAULT '{}',
  requires_human_review BOOLEAN DEFAULT false,
  block_reason TEXT,

  -- Full AI Analysis (RETAINED)
  raw_llm_response TEXT,
  raw_analysis JSONB,
  prompt_version TEXT,
  model_used TEXT,
  tokens_used INTEGER,

  -- Processing Timestamps
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Responses (ALL VARIANTS RETAINED)
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  cluster_id UUID,  -- Will be set when clustering runs (FK added after clusters table)

  -- ALL Generated Variants (RETAINED)
  value_first_response TEXT,     -- Pure value, no CTA
  soft_cta_response TEXT,        -- Value with subtle mention
  contextual_response TEXT,      -- Context-specific response

  -- Selected Response
  selected_response TEXT NOT NULL,
  selected_type TEXT CHECK (selected_type IN ('value_first', 'soft_cta', 'contextual', 'custom')),

  -- CTA Classification (RETAINED)
  cta_level INTEGER CHECK (cta_level BETWEEN 0 AND 3),
  cta_analysis JSONB DEFAULT '{}',

  -- CTS Decision (RETAINED)
  cts_score DECIMAL(4,3) CHECK (cts_score >= 0 AND cts_score <= 1),
  cts_breakdown JSONB DEFAULT '{}',  -- { signal_component, risk_component, cta_component }
  can_auto_post BOOLEAN DEFAULT false,
  auto_post_reason TEXT,

  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited', 'posted', 'failed', 'expired')),

  -- Review Information (RETAINED)
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_device TEXT,  -- 'web', 'mobile_ios', 'mobile_android', 'tablet'
  review_notes TEXT,
  review_duration_ms INTEGER,  -- How long the reviewer spent

  -- Edit History (if edited before approval)
  original_response TEXT,  -- Store original if edited
  edited_response TEXT,    -- Store edited version
  edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  edit_reason TEXT,

  -- Posting Information (RETAINED)
  posted_at TIMESTAMPTZ,
  posted_external_id TEXT,  -- ID on the platform after posting
  posted_external_url TEXT, -- URL on the platform after posting
  posting_method TEXT CHECK (posting_method IN ('api', 'clipboard', 'manual')),
  posting_error TEXT,       -- If failed, why
  posting_attempts INTEGER DEFAULT 0,

  -- Full AI Analysis (RETAINED)
  raw_llm_response TEXT,
  raw_analysis JSONB,
  prompt_version TEXT,
  model_used TEXT,
  tokens_used INTEGER,

  -- Processing Timestamps
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement Queue (for pending approvals)
CREATE TABLE engagement_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  priority INTEGER DEFAULT 0,
  queue_position INTEGER,
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- Auto-expire old items

  -- Queue Status
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'skipped', 'expired')),

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- =====================================================
-- COMMUNITY CLUSTERS
-- =====================================================

-- Community Clusters (with full tracking)
CREATE TABLE clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  problem_category_id UUID REFERENCES problem_categories(id) ON DELETE SET NULL,

  -- Cluster Metadata
  keywords TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),  -- For similarity search (pgvector)

  -- Statistics (updated periodically)
  member_count INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  avg_emotional_intensity DECIMAL(4,3),
  avg_risk_score DECIMAL(4,3),

  -- AI-generated insights
  ai_summary TEXT,
  trending_topics JSONB DEFAULT '{}',
  recommended_responses JSONB DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from responses to clusters
ALTER TABLE responses ADD CONSTRAINT fk_responses_cluster
  FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE SET NULL;

-- Cluster Membership (which posts belong to which cluster)
CREATE TABLE cluster_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES clusters(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,

  similarity_score DECIMAL(4,3),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by TEXT DEFAULT 'system',  -- 'system' or 'manual'

  UNIQUE(cluster_id, post_id)
);

-- =====================================================
-- COMPREHENSIVE AUDIT LOG
-- =====================================================

-- Master Audit Log (ALL system actions)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action Details
  action_type TEXT NOT NULL,  -- 'response.approved', 'response.rejected', 'response.posted', etc.
  action_category TEXT NOT NULL,  -- 'engagement', 'admin', 'system', 'auth'
  entity_type TEXT NOT NULL,  -- 'post', 'signal', 'response', 'cluster', 'user', 'organization'
  entity_id UUID NOT NULL,

  -- Full Context (RETAINED)
  action_data JSONB DEFAULT '{}',  -- Full details of the action
  previous_state JSONB,            -- State before action
  new_state JSONB,                 -- State after action

  -- Device & Session Info
  device_type TEXT,           -- 'web', 'mobile_ios', 'mobile_android', 'tablet', 'api'
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,

  -- Geolocation (optional)
  country_code TEXT,
  region TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & METRICS
-- =====================================================

-- Analytics Events (granular tracking)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL,
  event_category TEXT,  -- 'engagement', 'review', 'posting', 'community', 'system'
  event_data JSONB DEFAULT '{}',

  -- Attribution
  source_platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL,
  related_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  related_response_id UUID REFERENCES responses(id) ON DELETE SET NULL,
  related_cluster_id UUID REFERENCES clusters(id) ON DELETE SET NULL,

  -- Device Info
  device_type TEXT,

  -- Session
  session_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Aggregates (for fast dashboard queries)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,

  -- Engagement Metrics
  posts_detected INTEGER DEFAULT 0,
  signals_generated INTEGER DEFAULT 0,
  responses_generated INTEGER DEFAULT 0,
  responses_approved INTEGER DEFAULT 0,
  responses_rejected INTEGER DEFAULT 0,
  responses_auto_posted INTEGER DEFAULT 0,
  responses_manually_posted INTEGER DEFAULT 0,
  responses_expired INTEGER DEFAULT 0,

  -- Platform Breakdown
  platform_breakdown JSONB DEFAULT '{}',  -- { "reddit": 50, "twitter": 30 }

  -- Risk Breakdown
  risk_breakdown JSONB DEFAULT '{}',  -- { "low": 60, "medium": 30, "high": 8, "blocked": 2 }

  -- CTA Breakdown
  cta_breakdown JSONB DEFAULT '{}',  -- { "0": 40, "1": 35, "2": 20, "3": 5 }

  -- Community Metrics
  new_clusters_detected INTEGER DEFAULT 0,
  cluster_engagements INTEGER DEFAULT 0,

  -- Performance Metrics
  avg_detection_time_ms INTEGER,
  avg_pipeline_time_ms INTEGER,
  avg_review_time_ms INTEGER,

  -- Cost Metrics
  total_tokens_used INTEGER DEFAULT 0,
  estimated_cost_cents INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, metric_date)
);

-- =====================================================
-- AUTOMATION SETTINGS
-- =====================================================

-- Automation Rules
CREATE TABLE automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Conditions
  conditions JSONB NOT NULL,  -- { min_cts: 0.8, max_risk: "low", max_cta: 1, platforms: ["reddit"] }

  -- Actions
  action_type TEXT NOT NULL CHECK (action_type IN ('auto_approve', 'auto_post', 'assign_to', 'notify', 'skip')),
  action_config JSONB DEFAULT '{}',

  -- Limits
  daily_limit INTEGER,
  hourly_limit INTEGER,

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,

  -- Stats
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(organization_id, role);

-- Problem Categories
CREATE INDEX idx_problem_categories_org ON problem_categories(organization_id);
CREATE INDEX idx_problem_categories_parent ON problem_categories(parent_id);

-- Posts
CREATE INDEX idx_posts_org_detected ON posts(organization_id, detected_at DESC);
CREATE INDEX idx_posts_platform ON posts(platform_id, detected_at DESC);
CREATE INDEX idx_posts_external ON posts(platform_id, external_id);
CREATE INDEX idx_posts_content_type ON posts(organization_id, content_type);

-- Signals
CREATE INDEX idx_signals_post ON signals(post_id);
CREATE INDEX idx_signals_category ON signals(problem_category_id);
CREATE INDEX idx_signals_confidence ON signals(confidence_score DESC);

-- Risk Scores
CREATE INDEX idx_risk_scores_signal ON risk_scores(signal_id);
CREATE INDEX idx_risk_scores_level ON risk_scores(risk_level);

-- Responses
CREATE INDEX idx_responses_signal ON responses(signal_id);
CREATE INDEX idx_responses_status ON responses(status, created_at DESC);
CREATE INDEX idx_responses_cluster ON responses(cluster_id);
CREATE INDEX idx_responses_reviewed ON responses(reviewed_by, reviewed_at DESC);
CREATE INDEX idx_responses_cts ON responses(cts_score DESC);

-- Queue
CREATE INDEX idx_queue_org_status ON engagement_queue(organization_id, status, priority DESC);
CREATE INDEX idx_queue_assigned ON engagement_queue(assigned_to, status);
CREATE INDEX idx_queue_response ON engagement_queue(response_id);

-- Clusters
CREATE INDEX idx_clusters_org ON clusters(organization_id, last_activity_at DESC);
CREATE INDEX idx_clusters_category ON clusters(problem_category_id);
CREATE INDEX idx_clusters_embedding ON clusters USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Cluster Members
CREATE INDEX idx_cluster_members_cluster ON cluster_members(cluster_id);
CREATE INDEX idx_cluster_members_post ON cluster_members(post_id);

-- Audit Log
CREATE INDEX idx_audit_log_org_created ON audit_log(organization_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action_type, created_at DESC);

-- Analytics Events
CREATE INDEX idx_analytics_org_date ON analytics_events(organization_id, created_at DESC);
CREATE INDEX idx_analytics_type ON analytics_events(event_type, created_at DESC);

-- Daily Metrics
CREATE INDEX idx_daily_metrics_org_date ON daily_metrics(organization_id, metric_date DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (id = get_user_organization_id());

CREATE POLICY "Owners can update organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'owner')
  );

-- Users: Can see users in same organization
CREATE POLICY "Users can view org members" ON users
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (
    organization_id = get_user_organization_id() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Problem Categories: Organization isolation
CREATE POLICY "Org isolation for problem_categories" ON problem_categories
  FOR ALL USING (organization_id = get_user_organization_id());

-- Organization Platforms: Organization isolation
CREATE POLICY "Org isolation for organization_platforms" ON organization_platforms
  FOR ALL USING (organization_id = get_user_organization_id());

-- Posts: Organization isolation
CREATE POLICY "Org isolation for posts" ON posts
  FOR ALL USING (organization_id = get_user_organization_id());

-- Signals: Via posts organization
CREATE POLICY "Org isolation for signals" ON signals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM posts WHERE posts.id = signals.post_id AND posts.organization_id = get_user_organization_id())
  );

-- Risk Scores: Via signals -> posts organization
CREATE POLICY "Org isolation for risk_scores" ON risk_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM signals
      JOIN posts ON posts.id = signals.post_id
      WHERE signals.id = risk_scores.signal_id AND posts.organization_id = get_user_organization_id()
    )
  );

-- Responses: Via signals -> posts organization
CREATE POLICY "Org isolation for responses" ON responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM signals
      JOIN posts ON posts.id = signals.post_id
      WHERE signals.id = responses.signal_id AND posts.organization_id = get_user_organization_id()
    )
  );

-- Engagement Queue: Organization isolation
CREATE POLICY "Org isolation for engagement_queue" ON engagement_queue
  FOR ALL USING (organization_id = get_user_organization_id());

-- Clusters: Organization isolation
CREATE POLICY "Org isolation for clusters" ON clusters
  FOR ALL USING (organization_id = get_user_organization_id());

-- Cluster Members: Via clusters organization
CREATE POLICY "Org isolation for cluster_members" ON cluster_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM clusters WHERE clusters.id = cluster_members.cluster_id AND clusters.organization_id = get_user_organization_id())
  );

-- Audit Log: Organization isolation (read only for most users)
CREATE POLICY "Org isolation for audit_log" ON audit_log
  FOR SELECT USING (organization_id = get_user_organization_id());

CREATE POLICY "System can insert audit_log" ON audit_log
  FOR INSERT WITH CHECK (organization_id = get_user_organization_id());

-- Analytics Events: Organization isolation
CREATE POLICY "Org isolation for analytics_events" ON analytics_events
  FOR ALL USING (organization_id = get_user_organization_id());

-- Daily Metrics: Organization isolation
CREATE POLICY "Org isolation for daily_metrics" ON daily_metrics
  FOR ALL USING (organization_id = get_user_organization_id());

-- Automation Rules: Organization isolation
CREATE POLICY "Org isolation for automation_rules" ON automation_rules
  FOR ALL USING (organization_id = get_user_organization_id());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problem_categories_updated_at BEFORE UPDATE ON problem_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_platforms_updated_at BEFORE UPDATE ON organization_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at BEFORE UPDATE ON responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clusters_updated_at BEFORE UPDATE ON clusters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at BEFORE UPDATE ON daily_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cluster member count trigger
CREATE OR REPLACE FUNCTION update_cluster_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clusters SET member_count = member_count + 1 WHERE id = NEW.cluster_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clusters SET member_count = member_count - 1 WHERE id = OLD.cluster_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cluster_count_on_member_change
  AFTER INSERT OR DELETE ON cluster_members
  FOR EACH ROW EXECUTE FUNCTION update_cluster_member_count();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate CTS score
CREATE OR REPLACE FUNCTION calculate_cts_score(
  p_signal_confidence DECIMAL,
  p_risk_score DECIMAL,
  p_cta_level INTEGER
) RETURNS DECIMAL AS $$
DECLARE
  v_signal_component DECIMAL;
  v_risk_component DECIMAL;
  v_cta_component DECIMAL;
BEGIN
  -- Signal component (40% weight)
  v_signal_component := COALESCE(p_signal_confidence, 0.5) * 0.4;

  -- Risk component (30% weight) - inverse of risk
  v_risk_component := (1 - COALESCE(p_risk_score, 0.5)) * 0.3;

  -- CTA component (30% weight) - lower CTA is better for auto-post
  v_cta_component := CASE
    WHEN p_cta_level = 0 THEN 1.0
    WHEN p_cta_level = 1 THEN 0.7
    WHEN p_cta_level = 2 THEN 0.3
    ELSE 0.0
  END * 0.3;

  RETURN ROUND((v_signal_component + v_risk_component + v_cta_component)::NUMERIC, 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check auto-post eligibility
CREATE OR REPLACE FUNCTION check_auto_post_eligibility(
  p_cts_score DECIMAL,
  p_risk_level TEXT,
  p_cta_level INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    p_cts_score >= 0.7 AND
    p_risk_level = 'low' AND
    p_cta_level <= 1
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations (companies using the platform)';
COMMENT ON TABLE users IS 'Users within organizations with role-based access';
COMMENT ON TABLE platforms IS 'External platforms (Reddit, Twitter, etc.) that we crawl and post to';
COMMENT ON TABLE posts IS 'Original content detected from external platforms - NEVER deleted for audit trail';
COMMENT ON TABLE signals IS 'AI-detected engagement signals from posts - full analysis retained';
COMMENT ON TABLE risk_scores IS 'Risk assessment for each signal - determines engagement safety';
COMMENT ON TABLE responses IS 'Generated response variants and approval status - all versions retained';
COMMENT ON TABLE engagement_queue IS 'Queue of responses pending review/approval';
COMMENT ON TABLE clusters IS 'AI-detected community clusters based on post similarity';
COMMENT ON TABLE cluster_members IS 'Membership of posts in clusters';
COMMENT ON TABLE audit_log IS 'Complete audit trail of all system actions';
COMMENT ON TABLE analytics_events IS 'Granular analytics events for detailed reporting';
COMMENT ON TABLE daily_metrics IS 'Pre-aggregated daily metrics for fast dashboard queries';
COMMENT ON TABLE automation_rules IS 'User-configurable automation rules for auto-approval/posting';
