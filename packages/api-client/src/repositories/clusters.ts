import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Cluster,
  ClusterInsert,
  ClusterUpdate,
  ClusterWithMembers,
  ClusterMember,
  ApiResult,
} from 'shared-types';
import { BaseRepository } from './base';

export class ClusterRepository extends BaseRepository<
  Cluster,
  ClusterInsert,
  ClusterUpdate
> {
  protected tableName = 'clusters';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findByOrganization(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: 'member_count' | 'engagement_count' | 'last_activity_at';
    } = {}
  ): Promise<ApiResult<Cluster[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);

    // Apply ordering
    const orderBy = options.orderBy || 'last_activity_at';
    query = query.order(orderBy, { ascending: false });

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Cluster[], error: null };
  }

  async findWithMembers(clusterId: string): Promise<ApiResult<ClusterWithMembers>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        members:cluster_members(
          id,
          post_id,
          similarity_score,
          added_at
        ),
        problem_category:problem_categories(id, name, description)
      `)
      .eq('id', clusterId)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as unknown as ClusterWithMembers, error: null };
  }

  async addMember(
    clusterId: string,
    postId: string,
    similarityScore: number
  ): Promise<ApiResult<ClusterMember>> {
    const { data, error } = await this.supabase
      .from('cluster_members')
      .insert({
        cluster_id: clusterId,
        post_id: postId,
        similarity_score: similarityScore,
      })
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as ClusterMember, error: null };
  }

  async removeMember(clusterId: string, postId: string): Promise<ApiResult<null>> {
    const { error } = await this.supabase
      .from('cluster_members')
      .delete()
      .eq('cluster_id', clusterId)
      .eq('post_id', postId);

    if (error) {
      return this.handleError(error);
    }

    return { data: null, error: null };
  }

  async updateActivity(clusterId: string): Promise<ApiResult<Cluster>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', clusterId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Cluster, error: null };
  }

  async updateStats(
    clusterId: string,
    stats: {
      member_count?: number;
      engagement_count?: number;
      avg_emotional_intensity?: number;
    }
  ): Promise<ApiResult<Cluster>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clusterId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Cluster, error: null };
  }

  async updateAiSummary(
    clusterId: string,
    summary: string,
    trendingTopics?: Record<string, unknown>
  ): Promise<ApiResult<Cluster>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        ai_summary: summary,
        trending_topics: trendingTopics,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clusterId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Cluster, error: null };
  }

  async getTopClusters(
    organizationId: string,
    limit = 10
  ): Promise<ApiResult<Cluster[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('member_count', { ascending: false })
      .limit(limit);

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Cluster[], error: null };
  }

  async getRecentlyActive(
    organizationId: string,
    hours = 24,
    limit = 10
  ): Promise<ApiResult<Cluster[]>> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .gte('last_activity_at', since)
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Cluster[], error: null };
  }
}
