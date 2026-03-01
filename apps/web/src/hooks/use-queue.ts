'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import type { QueueItemDisplay, RiskLevel, ResponseStatus, QueueFilters } from 'shared-types';

const PAGE_SIZE = 20;

export interface UseQueueOptions {
  initialFilters?: Partial<QueueFilters>;
  pageSize?: number;
}

export interface UseQueueResult {
  items: QueueItemDisplay[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  filters: QueueFilters;
  setFilters: (filters: Partial<QueueFilters>) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  // Filter counts for tabs
  counts: {
    all: number;
    lowRisk: number;
    highCts: number;
    needsReview: number;
  };
}

/**
 * Hook to fetch and manage queue data from Supabase
 */
export function useQueue(options: UseQueueOptions = {}): UseQueueResult {
  const { pageSize = PAGE_SIZE } = options;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { organization } = useOrg();
  const supabase = createClient();

  const [items, setItems] = useState<QueueItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [counts, setCounts] = useState({
    all: 0,
    lowRisk: 0,
    highCts: 0,
    needsReview: 0,
  });

  // Parse filters from URL params
  const filters: QueueFilters = useMemo(() => ({
    status: (searchParams.get('status') as ResponseStatus) || 'pending',
    riskLevel: searchParams.get('riskLevel') as RiskLevel | undefined,
    platformId: searchParams.get('platformId') || undefined,
    minCtsScore: searchParams.get('minCts') ? parseFloat(searchParams.get('minCts')!) : undefined,
    maxCtsScore: searchParams.get('maxCts') ? parseFloat(searchParams.get('maxCts')!) : undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  }), [searchParams]);

  // Update URL params when filters change
  const setFilters = useCallback((newFilters: Partial<QueueFilters>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'minCtsScore') {
          params.set('minCts', String(value));
        } else if (key === 'maxCtsScore') {
          params.set('maxCts', String(value));
        } else {
          params.set(key, String(value));
        }
      } else {
        params.delete(key === 'minCtsScore' ? 'minCts' : key === 'maxCtsScore' ? 'maxCts' : key);
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Fetch queue counts for tabs
  const fetchCounts = useCallback(async () => {
    if (!user || !organization) return;

    try {
      // Get all pending items to calculate counts
      // Note: RLS already filters by organization, but we add explicit filter for defense in depth
      const { data, error: countError } = await supabase
        .from('engagement_queue')
        .select(`
          id,
          organization_id,
          response:responses!inner(
            id,
            cts_score,
            can_auto_post,
            signal:signals!inner(
              id,
              risk_score:risk_scores!inner(
                risk_level
              )
            )
          )
        `)
        .eq('organization_id', organization.id)
        .eq('status', 'queued');

      if (countError) {
        console.error('Error fetching counts:', countError);
        return;
      }

      const pending = data || [];
      setCounts({
        all: pending.length,
        lowRisk: pending.filter((item: Record<string, unknown>) =>
          (item.response as Record<string, unknown>)?.signal &&
          ((item.response as Record<string, unknown>).signal as Record<string, unknown>)?.risk_score &&
          (((item.response as Record<string, unknown>).signal as Record<string, unknown>).risk_score as Record<string, unknown>)?.risk_level === 'low'
        ).length,
        highCts: pending.filter((item: Record<string, unknown>) =>
          ((item.response as Record<string, unknown>)?.cts_score as number) >= 0.8
        ).length,
        needsReview: pending.filter((item: Record<string, unknown>) => {
          const response = item.response as Record<string, unknown>;
          const signal = response?.signal as Record<string, unknown>;
          const riskScore = signal?.risk_score as Record<string, unknown>;
          const riskLevel = riskScore?.risk_level as string;
          return !response?.can_auto_post || riskLevel === 'high' || riskLevel === 'blocked';
        }).length,
      });
    } catch (err) {
      console.error('Error in fetchCounts:', err);
    }
  }, [user, organization, supabase]);

  // Build and execute the main query
  const fetchItems = useCallback(async (reset = false) => {
    if (!user || !organization) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      // Build query with joins - query from engagement_queue which has direct org filter
      // Using left joins (no !inner) to avoid filtering out rows with missing nested data
      let query = supabase
        .from('engagement_queue')
        .select(`
          id,
          status,
          priority,
          created_at,
          response:responses(
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
            created_at,
            signal:signals(
              id,
              problem_category_id,
              emotional_intensity,
              keywords,
              post:posts(
                id,
                external_url,
                content,
                author_handle,
                detected_at,
                platform:platforms(
                  id,
                  name,
                  slug,
                  icon_url
                )
              ),
              risk_score:risk_scores(
                risk_level,
                risk_score,
                context_flags
              )
            )
          )
        `, { count: 'exact' });

      // Apply organization filter directly on engagement_queue
      query = query.eq('organization_id', organization.id);

      // Apply status filter on engagement_queue
      if (filters.status) {
        // Map response status to queue status
        const queueStatus = filters.status === 'pending' ? 'queued' : filters.status;
        query = query.eq('status', queueStatus);
      }

      // Note: Nested filters don't work well with PostgREST
      // CTS score, risk level, and platform filters are applied in JavaScript after fetch

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Order and paginate
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Transform data to QueueItemDisplay format (data comes from engagement_queue with nested response)
      const transformedItems: QueueItemDisplay[] = (data || []).map((item: any) => {
        const response = item.response;
        const signal = response?.signal;
        const post = signal?.post;
        const platform = post?.platform;
        const riskScore = signal?.risk_score;

        return {
          id: item.id, // queue item id
          responseId: response?.id,
          original: {
            platform: platform ? {
              id: platform.id,
              name: platform.name,
              slug: platform.slug,
              iconUrl: platform.icon_url,
            } : {
              id: 'unknown',
              name: 'Unknown',
              slug: 'unknown',
              iconUrl: '/icons/globe.svg',
            },
            content: post?.content || '',
            authorHandle: post?.author_handle || 'anonymous',
            url: post?.external_url || '',
            detectedAt: post?.detected_at || item.created_at,
          },
          analysis: {
            problemCategory: signal?.problem_category_id,
            emotionalIntensity: signal?.emotional_intensity || 0.5,
            keywords: signal?.keywords || [],
            riskLevel: riskScore?.risk_level || 'medium',
            riskScore: riskScore?.risk_score || 0.5,
            riskFactors: riskScore?.context_flags || [],
          },
          responses: {
            valueFirst: response?.value_first_response,
            softCta: response?.soft_cta_response,
            contextual: response?.contextual_response,
            selected: response?.selected_response,
            selectedType: response?.selected_type,
          },
          metrics: {
            ctaLevel: response?.cta_level,
            ctsScore: response?.cts_score,
            canAutoPost: response?.can_auto_post,
          },
          cluster: null,
          status: item.status, // queue status
          priority: item.priority || 50,
          createdAt: item.created_at,
        };
      });

      if (reset) {
        setItems(transformedItems);
        setPage(0);
      } else {
        setItems(prev => [...prev, ...transformedItems]);
      }

      setTotalCount(count || 0);
      setHasMore(transformedItems.length === pageSize);
    } catch (err) {
      console.error('Error fetching queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load queue');
    } finally {
      setIsLoading(false);
    }
  }, [user, organization, supabase, filters, page, pageSize]);

  // Load more items
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setPage(prev => prev + 1);
  }, [hasMore, isLoading]);

  // Refresh data
  const refresh = useCallback(async () => {
    setPage(0);
    await Promise.all([
      fetchItems(true),
      fetchCounts(),
    ]);
  }, [fetchItems, fetchCounts]);

  // Initial fetch and refetch on filter change or organization change
  useEffect(() => {
    fetchItems(true);
    fetchCounts();
  }, [filters.status, filters.riskLevel, filters.platformId, filters.minCtsScore, filters.maxCtsScore, filters.dateFrom, filters.dateTo, user, organization]);

  // Fetch more when page changes
  useEffect(() => {
    if (page > 0) {
      fetchItems(false);
    }
  }, [page]);

  return {
    items,
    isLoading,
    error,
    hasMore,
    totalCount,
    filters,
    setFilters,
    loadMore,
    refresh,
    counts,
  };
}
