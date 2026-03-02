-- Migration: Link posts to projects via search configs
-- Adds project_id to posts table for tracking which project found each post

-- ============================================
-- ADD PROJECT REFERENCE TO POSTS
-- ============================================

ALTER TABLE posts ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN search_config_id UUID REFERENCES project_search_configs(id) ON DELETE SET NULL;

-- Index for efficient lookup by project
CREATE INDEX idx_posts_project_id ON posts(project_id);
CREATE INDEX idx_posts_search_config_id ON posts(search_config_id);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN posts.project_id IS 'The project that found this post (via its search configs)';
COMMENT ON COLUMN posts.search_config_id IS 'The specific search config that matched this post';

-- ============================================
-- SEED DATA: Create default project for existing organizations
-- ============================================

-- Create a default project for WeAttuned
INSERT INTO projects (id, organization_id, name, description, value_proposition, target_audience, tone, status)
VALUES (
  'de7a0001-0001-0001-0001-000000000001',
  'aaaa1111-1111-1111-1111-111111111111',
  'Relationship Communication',
  'Helping couples communicate better through AI-powered emotional intelligence',
  'WeAttuned helps couples understand each other better by providing personalized communication insights based on emotional intelligence principles.',
  'Couples, married partners, and people in long-term relationships who want to improve their communication',
  'empathetic',
  'active'
);

-- Create default search configs for the WeAttuned project
INSERT INTO project_search_configs (id, project_id, name, keywords, platforms, reddit_subreddits, max_post_age_days, crawl_frequency, is_active)
VALUES
  (
    'c0n71901-0001-0001-0001-000000000001',
    'de7a0001-0001-0001-0001-000000000001',
    'Reddit Relationships',
    ARRAY['relationship communication', 'partner communication', 'marriage communication', 'how to talk to spouse'],
    ARRAY['reddit'],
    ARRAY['relationships', 'relationship_advice', 'Marriage', 'dating_advice'],
    90,
    'daily',
    true
  ),
  (
    'c0n71902-0002-0002-0002-000000000002',
    'de7a0001-0001-0001-0001-000000000001',
    'Multi-platform EQ',
    ARRAY['emotional intelligence couples', 'understand partner feelings', 'empathy relationship'],
    ARRAY['reddit', 'quora'],
    ARRAY['EmotionalIntelligence', 'selfimprovement'],
    60,
    'daily',
    true
  );

-- Link existing posts to the project
UPDATE posts
SET project_id = 'de7a0001-0001-0001-0001-000000000001',
    search_config_id = 'c0n71901-0001-0001-0001-000000000001'
WHERE organization_id = 'aaaa1111-1111-1111-1111-111111111111';
