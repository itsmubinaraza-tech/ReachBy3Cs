'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useOrg } from '@/contexts/org-context';
import type { Project, ProjectWithConfigs } from 'shared-types';

export interface UseProjectsResult {
  projects: ProjectWithConfigs[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProject: (data: CreateProjectData) => Promise<{ success: boolean; error?: string; project?: Project }>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<{ success: boolean; error?: string }>;
  deleteProject: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  value_proposition?: string;
  target_audience?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'technical' | 'empathetic';
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  value_proposition?: string;
  target_audience?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'technical' | 'empathetic';
  status?: 'active' | 'paused' | 'archived';
}

export function useProjects(): UseProjectsResult {
  const { organization } = useOrg();
  const supabase = useMemo(() => createClient(), []);

  const [projects, setProjects] = useState<ProjectWithConfigs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch projects with search config count
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          project_search_configs(count)
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform the data to include config_count
      const transformedProjects: ProjectWithConfigs[] = (data || []).map((project: any) => ({
        ...project,
        search_configs: [],
        config_count: project.project_search_configs?.[0]?.count || 0,
      }));

      setProjects(transformedProjects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, supabase]);

  const createProject = useCallback(async (data: CreateProjectData) => {
    if (!organization?.id) {
      return { success: false, error: 'Organization not found' };
    }

    try {
      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          organization_id: organization.id,
          name: data.name,
          description: data.description || null,
          value_proposition: data.value_proposition || null,
          target_audience: data.target_audience || null,
          tone: data.tone || 'professional',
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Refresh the list
      await fetchProjects();

      return { success: true, project };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create project',
      };
    }
  }, [organization?.id, supabase, fetchProjects]);

  const updateProject = useCallback(async (id: string, data: UpdateProjectData) => {
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Refresh the list
      await fetchProjects();

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update project',
      };
    }
  }, [supabase, fetchProjects]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      // Refresh the list
      await fetchProjects();

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete project',
      };
    }
  }, [supabase, fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    isLoading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

/**
 * Hook to fetch a single project with its search configs
 */
export function useProject(projectId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  const [project, setProject] = useState<ProjectWithConfigs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          project_search_configs(*)
        `)
        .eq('id', projectId)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const transformedProject: ProjectWithConfigs = {
        ...data,
        search_configs: data.project_search_configs || [],
        config_count: data.project_search_configs?.length || 0,
      };

      setProject(transformedProject);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    isLoading,
    error,
    refresh: fetchProject,
  };
}
