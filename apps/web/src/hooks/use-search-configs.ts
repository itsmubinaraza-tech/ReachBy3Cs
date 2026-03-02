'use client';

import { useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProjectSearchConfig } from 'shared-types';

export interface CreateSearchConfigData {
  name: string;
  keywords: string[];
  excluded_keywords?: string[];
  matching_mode?: 'exact' | 'semantic' | 'both';
  max_post_age_days?: number;
  platforms: string[];
  reddit_subreddits?: string[];
  min_engagement?: number;
  crawl_frequency?: 'hourly' | 'daily' | 'weekly' | 'manual';
  is_active?: boolean;
}

export interface UpdateSearchConfigData extends Partial<CreateSearchConfigData> {}

export function useSearchConfigs(projectId: string) {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConfig = useCallback(async (data: CreateSearchConfigData): Promise<{ success: boolean; error?: string; config?: ProjectSearchConfig }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: config, error: insertError } = await supabase
        .from('project_search_configs')
        .insert({
          project_id: projectId,
          name: data.name,
          keywords: data.keywords,
          excluded_keywords: data.excluded_keywords || [],
          matching_mode: data.matching_mode || 'semantic',
          max_post_age_days: data.max_post_age_days || 90,
          platforms: data.platforms,
          reddit_subreddits: data.reddit_subreddits || [],
          min_engagement: data.min_engagement || 0,
          crawl_frequency: data.crawl_frequency || 'daily',
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true, config };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create configuration';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [projectId, supabase]);

  const updateConfig = useCallback(async (configId: string, data: UpdateSearchConfigData): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('project_search_configs')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update configuration';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const deleteConfig = useCallback(async (configId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('project_search_configs')
        .delete()
        .eq('id', configId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete configuration';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const toggleActive = useCallback(async (configId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
    return updateConfig(configId, { is_active: isActive });
  }, [updateConfig]);

  return {
    isLoading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleActive,
  };
}
