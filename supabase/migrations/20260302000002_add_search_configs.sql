-- Migration: Add Project Search Configurations table
-- Each project can have up to 10 search configurations

-- ============================================
-- PROJECT SEARCH CONFIGS TABLE
-- ============================================

CREATE TABLE project_search_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  excluded_keywords TEXT[] DEFAULT '{}',
  matching_mode TEXT NOT NULL DEFAULT 'semantic' CHECK (matching_mode IN ('exact', 'semantic', 'both')),
  max_post_age_days INTEGER NOT NULL DEFAULT 90 CHECK (max_post_age_days > 0 AND max_post_age_days <= 365),
  platforms TEXT[] NOT NULL DEFAULT ARRAY['reddit', 'quora'],
  reddit_subreddits TEXT[] DEFAULT '{}',
  min_engagement INTEGER DEFAULT 0 CHECK (min_engagement >= 0),
  crawl_frequency TEXT DEFAULT 'daily' CHECK (crawl_frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  last_crawl_at TIMESTAMPTZ,
  next_crawl_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_search_configs_project_id ON project_search_configs(project_id);
CREATE INDEX idx_search_configs_is_active ON project_search_configs(is_active);
CREATE INDEX idx_search_configs_next_crawl ON project_search_configs(next_crawl_at) WHERE is_active = true;

-- Trigger to auto-update updated_at
CREATE TRIGGER project_search_configs_updated_at
  BEFORE UPDATE ON project_search_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION TO ENFORCE MAX 10 CONFIGS
-- ============================================

CREATE OR REPLACE FUNCTION check_max_search_configs()
RETURNS TRIGGER AS $$
DECLARE
  config_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO config_count
  FROM project_search_configs
  WHERE project_id = NEW.project_id;

  IF config_count >= 10 THEN
    RAISE EXCEPTION 'Maximum of 10 search configurations per project reached';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_search_configs
  BEFORE INSERT ON project_search_configs
  FOR EACH ROW
  EXECUTE FUNCTION check_max_search_configs();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE project_search_configs ENABLE ROW LEVEL SECURITY;

-- Users can only see configs from projects in their organization
CREATE POLICY "search_configs_select" ON project_search_configs FOR SELECT
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON p.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));

-- Users can insert configs in their organization's projects
CREATE POLICY "search_configs_insert" ON project_search_configs FOR INSERT
  WITH CHECK (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON p.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));

-- Users can update configs in their organization's projects
CREATE POLICY "search_configs_update" ON project_search_configs FOR UPDATE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON p.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));

-- Users can delete configs in their organization's projects
CREATE POLICY "search_configs_delete" ON project_search_configs FOR DELETE
  USING (project_id IN (
    SELECT p.id FROM projects p
    JOIN users u ON p.organization_id = u.organization_id
    WHERE u.id = auth.uid()
  ));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE project_search_configs IS 'Search configurations for crawling platforms. Max 10 per project.';
COMMENT ON COLUMN project_search_configs.keywords IS 'Keywords to search for';
COMMENT ON COLUMN project_search_configs.excluded_keywords IS 'Keywords to exclude from results';
COMMENT ON COLUMN project_search_configs.matching_mode IS 'How to match keywords: exact, semantic, or both';
COMMENT ON COLUMN project_search_configs.max_post_age_days IS 'Maximum age of posts to return (1-365 days)';
COMMENT ON COLUMN project_search_configs.platforms IS 'Platforms to search: reddit, twitter, quora, etc.';
COMMENT ON COLUMN project_search_configs.reddit_subreddits IS 'Specific subreddits to search (when Reddit is included)';
COMMENT ON COLUMN project_search_configs.min_engagement IS 'Minimum engagement (upvotes/likes) to include';
COMMENT ON COLUMN project_search_configs.crawl_frequency IS 'How often to run this search';
