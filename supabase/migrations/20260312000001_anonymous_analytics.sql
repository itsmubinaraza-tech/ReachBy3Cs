-- Track anonymous search activity (no PII)
-- This table stores aggregate search data from anonymous landing page users
-- No user-identifiable information is stored

CREATE TABLE anonymous_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_timestamp TIMESTAMPTZ DEFAULT NOW(),
  platforms_searched TEXT[],        -- ['reddit.com', 'stackoverflow.com']
  result_count INT,                 -- Number of posts returned
  session_hash TEXT,                -- Hashed session ID (not trackable to user)
  target_audience_category TEXT,    -- Generic category, not exact text
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed - this is aggregate analytics data only
-- The table is write-only from the API and read-only for admin analytics

-- Index for reporting queries
CREATE INDEX idx_anonymous_searches_timestamp
  ON anonymous_search_analytics(search_timestamp);

CREATE INDEX idx_anonymous_searches_platforms
  ON anonymous_search_analytics USING GIN(platforms_searched);

-- Add comment for documentation
COMMENT ON TABLE anonymous_search_analytics IS
  'Tracks anonymous search activity from landing page for analytics. No PII stored.';

COMMENT ON COLUMN anonymous_search_analytics.session_hash IS
  'One-way hash of session ID - cannot be reversed to identify user';

COMMENT ON COLUMN anonymous_search_analytics.target_audience_category IS
  'Generic category derived from search, not the exact user input';
