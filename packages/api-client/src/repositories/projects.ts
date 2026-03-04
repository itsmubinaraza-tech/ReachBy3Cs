import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithConfigs,
  ProjectSearchConfig,
  ApiResult,
} from 'shared-types';
import { BaseRepository } from './base';

export class ProjectRepository extends BaseRepository<
  Project,
  ProjectInsert,
  ProjectUpdate
> {
  protected tableName = 'projects';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find all projects for an organization
   */
  async findByOrganization(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: keyof Project;
      orderDirection?: 'asc' | 'desc';
      status?: 'active' | 'paused' | 'archived';
    } = {}
  ): Promise<ApiResult<Project[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);

    // Filter by status if provided
    if (options.status) {
      query = query.eq('status', options.status);
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

    return { data: data as Project[], error: null };
  }

  /**
   * Find project by name within an organization (case-insensitive)
   */
  async findByName(
    organizationId: string,
    name: string
  ): Promise<ApiResult<Project | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .ilike('name', name)
      .maybeSingle();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Project | null, error: null };
  }

  /**
   * Get project with its search configs
   */
  async getWithConfigs(projectId: string): Promise<ApiResult<ProjectWithConfigs>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        search_configs:project_search_configs(*)
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      return this.handleError(error);
    }

    const project = data as Project & { search_configs: ProjectSearchConfig[] };
    return {
      data: {
        ...project,
        config_count: project.search_configs?.length || 0,
      },
      error: null,
    };
  }

  /**
   * Update project status
   */
  async updateStatus(
    projectId: string,
    status: 'active' | 'paused' | 'archived'
  ): Promise<ApiResult<Project>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Project, error: null };
  }

  /**
   * Count projects for an organization
   */
  async countByOrganization(
    organizationId: string,
    status?: 'active' | 'paused' | 'archived'
  ): Promise<ApiResult<number>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (status) {
      query = query.eq('status', status);
    }

    const { count, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: count || 0, error: null };
  }

  /**
   * Soft delete project by setting status to archived
   */
  async archive(projectId: string): Promise<ApiResult<Project>> {
    return this.updateStatus(projectId, 'archived');
  }
}
