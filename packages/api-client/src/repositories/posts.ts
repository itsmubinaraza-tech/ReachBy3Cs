import type { SupabaseClient } from '@supabase/supabase-js';
import type { Post, PostInsert, PostWithSignal, ApiResult } from 'shared-types';
import { BaseRepository } from './base';

export class PostRepository extends BaseRepository<Post, PostInsert, Partial<Post>> {
  protected tableName = 'posts';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findByExternalId(
    platformId: string,
    externalId: string
  ): Promise<ApiResult<Post | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('platform_id', platformId)
      .eq('external_id', externalId)
      .maybeSingle();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Post | null, error: null };
  }

  async findByOrganization(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      platformId?: string;
      since?: string;
    } = {}
  ): Promise<ApiResult<Post[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('detected_at', { ascending: false });

    if (options.platformId) {
      query = query.eq('platform_id', options.platformId);
    }

    if (options.since) {
      query = query.gte('detected_at', options.since);
    }

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Post[], error: null };
  }

  async findWithSignals(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      hasSignal?: boolean;
    } = {}
  ): Promise<ApiResult<PostWithSignal[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        signal:signals(
          id,
          emotional_intensity,
          keywords,
          confidence_score,
          problem_category:problem_categories(id, name)
        ),
        platform:platforms(id, name, slug, icon_url)
      `)
      .eq('organization_id', organizationId)
      .order('detected_at', { ascending: false });

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    let result = data as PostWithSignal[];

    // Filter by hasSignal if specified
    if (options.hasSignal !== undefined) {
      result = result.filter((post) =>
        options.hasSignal ? post.signal !== null : post.signal === null
      );
    }

    return { data: result, error: null };
  }

  async getRecentByPlatform(
    organizationId: string,
    platformId: string,
    hours = 24
  ): Promise<ApiResult<Post[]>> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('platform_id', platformId)
      .gte('detected_at', since)
      .order('detected_at', { ascending: false });

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Post[], error: null };
  }

  async checkDuplicate(
    platformId: string,
    externalId: string
  ): Promise<ApiResult<boolean>> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('platform_id', platformId)
      .eq('external_id', externalId);

    if (error) {
      return this.handleError(error);
    }

    return { data: (count || 0) > 0, error: null };
  }
}
