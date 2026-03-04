import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProjectSearchConfig,
  ProjectSearchConfigInsert,
  ProjectSearchConfigUpdate,
  ApiResult,
} from 'shared-types';
import { BaseRepository } from './base';

const MAX_CONFIGS_PER_PROJECT = 10;

export class ProjectSearchConfigRepository extends BaseRepository<
  ProjectSearchConfig,
  ProjectSearchConfigInsert,
  ProjectSearchConfigUpdate
> {
  protected tableName = 'project_search_configs';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find all search configs for a project
   */
  async findByProject(
    projectId: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: keyof ProjectSearchConfig;
      orderDirection?: 'asc' | 'desc';
      isActive?: boolean;
    } = {}
  ): Promise<ApiResult<ProjectSearchConfig[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('project_id', projectId);

    // Filter by active status if provided
    if (options.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }

    // Apply ordering
    const orderBy = options.orderBy || 'created_at';
    query = query.order(orderBy as string, {
      ascending: options.orderDirection !== 'desc',
    });

    // Apply pagination
    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as ProjectSearchConfig[], error: null };
  }

  /**
   * Count configs for a project
   */
  async countByProject(projectId: string): Promise<ApiResult<number>> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if (error) {
      return this.handleError(error);
    }

    return { data: count || 0, error: null };
  }

  /**
   * Check if project can add more configs (max 10)
   */
  async canAddConfig(projectId: string): Promise<ApiResult<boolean>> {
    const countResult = await this.countByProject(projectId);
    if (countResult.error) {
      return { data: null, error: countResult.error };
    }

    return { data: (countResult.data || 0) < MAX_CONFIGS_PER_PROJECT, error: null };
  }

  /**
   * Create a new search config with validation
   * Enforces max 10 configs per project
   */
  async createWithValidation(
    input: ProjectSearchConfigInsert
  ): Promise<ApiResult<ProjectSearchConfig>> {
    // Check if we can add more configs
    const canAddResult = await this.canAddConfig(input.project_id);
    if (canAddResult.error) {
      return { data: null, error: canAddResult.error };
    }

    if (!canAddResult.data) {
      return {
        data: null,
        error: {
          code: 'MAX_CONFIGS_EXCEEDED',
          message: `Maximum of ${MAX_CONFIGS_PER_PROJECT} search configs per project reached`,
        },
      };
    }

    return this.create(input);
  }

  /**
   * Find config by name within a project
   */
  async findByName(
    projectId: string,
    name: string
  ): Promise<ApiResult<ProjectSearchConfig | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('project_id', projectId)
      .ilike('name', name)
      .maybeSingle();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as ProjectSearchConfig | null, error: null };
  }

  /**
   * Toggle config active status
   */
  async toggleActive(configId: string): Promise<ApiResult<ProjectSearchConfig>> {
    // First get current status
    const { data: current, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('is_active')
      .eq('id', configId)
      .single();

    if (fetchError) {
      return this.handleError(fetchError);
    }

    // Toggle status
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        is_active: !current?.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as ProjectSearchConfig, error: null };
  }

  /**
   * Update last crawl timestamp
   */
  async updateLastCrawl(configId: string): Promise<ApiResult<ProjectSearchConfig>> {
    const now = new Date();
    const nextCrawl = new Date(now.getTime());

    // Get current config to determine next crawl time
    const { data: current, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('crawl_frequency')
      .eq('id', configId)
      .single();

    if (fetchError) {
      return this.handleError(fetchError);
    }

    // Calculate next crawl based on frequency
    switch (current?.crawl_frequency) {
      case 'hourly':
        nextCrawl.setHours(nextCrawl.getHours() + 1);
        break;
      case 'daily':
        nextCrawl.setDate(nextCrawl.getDate() + 1);
        break;
      case 'weekly':
        nextCrawl.setDate(nextCrawl.getDate() + 7);
        break;
      case 'manual':
      default:
        // For manual, don't set next crawl
        break;
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        last_crawl_at: now.toISOString(),
        next_crawl_at: current?.crawl_frequency === 'manual' ? null : nextCrawl.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', configId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as ProjectSearchConfig, error: null };
  }

  /**
   * Get configs that are due for crawling
   */
  async getDueCrawls(organizationId?: string): Promise<ApiResult<ProjectSearchConfig[]>> {
    const now = new Date().toISOString();

    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        project:projects!inner(organization_id)
      `)
      .eq('is_active', true)
      .neq('crawl_frequency', 'manual')
      .lte('next_crawl_at', now);

    if (organizationId) {
      query = query.eq('project.organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as ProjectSearchConfig[], error: null };
  }
}
