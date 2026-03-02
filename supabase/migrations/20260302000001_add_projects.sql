-- Migration: Add Projects table
-- Projects group search configurations and provide context for AI responses

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  value_proposition TEXT,
  target_audience TEXT,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'friendly', 'technical', 'empathetic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT projects_org_name_unique UNIQUE (organization_id, name)
);

-- Index for efficient lookup by organization
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);

-- Trigger to auto-update updated_at
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see projects from their organization
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can insert projects in their organization
CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can update projects in their organization
CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Users can delete (archive) projects in their organization
CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE projects IS 'Projects group search configurations and provide context for AI response generation';
COMMENT ON COLUMN projects.name IS 'Display name of the project (unique per organization)';
COMMENT ON COLUMN projects.status IS 'Project status: active, paused, or archived';
COMMENT ON COLUMN projects.value_proposition IS 'The value proposition to use when generating responses';
COMMENT ON COLUMN projects.target_audience IS 'Description of the target audience for this project';
COMMENT ON COLUMN projects.tone IS 'Tone of voice for generated responses';
