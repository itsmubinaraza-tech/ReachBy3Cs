import type { SupabaseClient } from '@supabase/supabase-js';
import type { QueueItem, QueueFilters, PaginatedResponse, ApiResult } from 'shared-types';

export class QueueApi {
  constructor(private supabase: SupabaseClient) {}

  async getQueue(
    organizationId: string,
    filters?: QueueFilters,
    page = 1,
    pageSize = 20
  ): Promise<ApiResult<PaginatedResponse<QueueItem>>> {
    let query = this.supabase
      .from('engagement_queue')
      .select(
        `
        id,
        priority,
        created_at,
        response:responses!inner(
          id,
          selected_response,
          selected_type,
          value_first_response,
          soft_cta_response,
          contextual_response,
          cta_level,
          cts_score,
          can_auto_post,
          status,
          signal:signals!inner(
            problem_category:problem_categories(name),
            emotional_intensity,
            keywords,
            risk_score:risk_scores!inner(
              risk_level,
              risk_score,
              context_flags
            ),
            post:posts!inner(
              id,
              content,
              external_url,
              author_handle,
              detected_at,
              platform:platforms!inner(
                id,
                name,
                slug
              )
            )
          ),
          cluster:clusters(
            id,
            name,
            member_count
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', organizationId)
      .eq('status', 'queued');

    // Apply filters
    if (filters?.status) {
      query = query.eq('response.status', filters.status);
    }
    if (filters?.riskLevel) {
      query = query.eq('response.signal.risk_score.risk_level', filters.riskLevel);
    }
    if (filters?.minCtsScore) {
      query = query.gte('response.cts_score', filters.minCtsScore);
    }
    if (filters?.maxCtsScore) {
      query = query.lte('response.cts_score', filters.maxCtsScore);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('priority', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return {
        data: null,
        error: {
          code: 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    // Transform data to QueueItem format
    const items: QueueItem[] = (data || []).map((item) => {
      const response = item.response as unknown as Record<string, unknown>;
      const signal = response.signal as Record<string, unknown>;
      const post = signal.post as Record<string, unknown>;
      const platform = post.platform as Record<string, unknown>;
      const riskScore = signal.risk_score as Record<string, unknown>;
      const cluster = response.cluster as Record<string, unknown> | null;
      const problemCategory = signal.problem_category as Record<string, unknown> | null;

      return {
        id: item.id as string,
        responseId: response.id as string,
        post: {
          id: post.id as string,
          platform: platform.name as string,
          platformSlug: platform.slug as string,
          externalUrl: post.external_url as string,
          content: post.content as string,
          authorHandle: post.author_handle as string | null,
          detectedAt: post.detected_at as string,
        },
        signal: {
          problemCategory: problemCategory?.name as string | null,
          emotionalIntensity: signal.emotional_intensity as number,
          keywords: signal.keywords as string[],
        },
        riskScore: {
          riskLevel: riskScore.risk_level as QueueItem['riskScore']['riskLevel'],
          riskScore: riskScore.risk_score as number,
          contextFlags: riskScore.context_flags as string[],
        },
        response: {
          selectedResponse: response.selected_response as string,
          selectedType: response.selected_type as QueueItem['response']['selectedType'],
          valueFirstResponse: response.value_first_response as string | null,
          softCtaResponse: response.soft_cta_response as string | null,
          contextualResponse: response.contextual_response as string | null,
          ctaLevel: response.cta_level as QueueItem['response']['ctaLevel'],
          ctsScore: response.cts_score as number,
          canAutoPost: response.can_auto_post as boolean,
          status: response.status as QueueItem['response']['status'],
        },
        cluster: cluster
          ? {
              id: cluster.id as string,
              name: cluster.name as string,
            }
          : null,
        createdAt: item.created_at as string,
        priority: item.priority as number,
      };
    });

    return {
      data: {
        data: items,
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      },
      error: null,
    };
  }

  async getQueueCount(organizationId: string): Promise<ApiResult<number>> {
    const { count, error } = await this.supabase
      .from('engagement_queue')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'queued');

    if (error) {
      return {
        data: null,
        error: {
          code: 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    return { data: count || 0, error: null };
  }
}
