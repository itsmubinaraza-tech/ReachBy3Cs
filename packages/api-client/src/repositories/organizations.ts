import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Organization,
  OrganizationInsert,
  OrganizationUpdate,
  OrganizationSettings,
  ApiResult,
} from 'shared-types';
import { BaseRepository } from './base';

export class OrganizationRepository extends BaseRepository<
  Organization,
  OrganizationInsert,
  OrganizationUpdate
> {
  protected tableName = 'organizations';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findBySlug(slug: string): Promise<ApiResult<Organization>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Organization, error: null };
  }

  async updateSettings(
    id: string,
    settings: Partial<OrganizationSettings>
  ): Promise<ApiResult<Organization>> {
    // First get current settings
    const { data: current, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('settings')
      .eq('id', id)
      .single();

    if (fetchError) {
      return this.handleError(fetchError);
    }

    // Merge settings
    const mergedSettings = {
      ...(current?.settings || {}),
      ...settings,
    };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ settings: mergedSettings, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Organization, error: null };
  }

  async getWithPlatforms(id: string): Promise<ApiResult<Organization & { platforms: unknown[] }>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        organization_platforms(
          id,
          is_enabled,
          search_config,
          last_crawl_at,
          platform:platforms(id, name, slug, icon_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Organization & { platforms: unknown[] }, error: null };
  }
}
