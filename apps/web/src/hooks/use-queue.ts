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
  // Memoize supabase client to prevent re-renders from creating new instances
  const supabase = useMemo(() => createClient(), []);

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

      // Simple query - just get queue items, fetch details separately
      const { data: queueData, error: queryError, count } = await supabase
        .from('engagement_queue')
        .select('id, response_id, organization_id, status, priority, created_at', { count: 'exact' })
        .eq('organization_id', organization.id)
        .eq('status', 'queued')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Fetch response details for each queue item
      const responseIds = (queueData || []).map((q: any) => q.response_id).filter(Boolean);

      let responsesMap: Record<string, any> = {};
      if (responseIds.length > 0) {
        const { data: responsesData } = await supabase
          .from('responses')
          .select(`
            id,
            selected_response,
            selected_type,
            value_first_response,
            soft_cta_response,
            contextual_response,
            cta_level,
            cts_score,
            can_auto_post,
            signal_id
          `)
          .in('id', responseIds);

        responsesMap = (responsesData || []).reduce((acc: any, r: any) => {
          acc[r.id] = r;
          return acc;
        }, {});
      }

      // Fetch signal and post details
      const signalIds = Object.values(responsesMap).map((r: any) => r.signal_id).filter(Boolean);
      let signalsMap: Record<string, any> = {};
      let postsMap: Record<string, any> = {};

      if (signalIds.length > 0) {
        const { data: signalsData } = await supabase
          .from('signals')
          .select('id, post_id, emotional_intensity, keywords')
          .in('id', signalIds);

        signalsMap = (signalsData || []).reduce((acc: any, s: any) => {
          acc[s.id] = s;
          return acc;
        }, {});

        const postIds = (signalsData || []).map((s: any) => s.post_id).filter(Boolean);
        if (postIds.length > 0) {
          const { data: postsData } = await supabase
            .from('posts')
            .select('id, external_url, content, author_handle, detected_at, platform_id')
            .in('id', postIds);

          postsMap = (postsData || []).reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // Transform data using the maps we built
      const transformedItems: QueueItemDisplay[] = (queueData || []).map((item: any) => {
        const response = responsesMap[item.response_id];
        const signal = response ? signalsMap[response.signal_id] : null;
        const post = signal ? postsMap[signal.post_id] : null;

        return {
          id: item.id,
          responseId: item.response_id,
          original: {
            platform: {
              id: 'reddit',
              name: 'Reddit',
              slug: 'reddit',
              iconUrl: '/icons/reddit.svg',
            },
            content: post?.content || 'Content loading...',
            authorHandle: post?.author_handle || 'anonymous',
            url: post?.external_url || '',
            detectedAt: post?.detected_at || item.created_at,
          },
          analysis: {
            problemCategory: undefined,
            emotionalIntensity: signal?.emotional_intensity || 0.5,
            keywords: signal?.keywords || [],
            riskLevel: 'medium' as const,
            riskScore: 0.5,
            riskFactors: [],
          },
          responses: {
            valueFirst: response?.value_first_response || '',
            softCta: response?.soft_cta_response || '',
            contextual: response?.contextual_response || '',
            selected: response?.selected_response || '',
            selectedType: response?.selected_type || 'value_first',
          },
          metrics: {
            ctaLevel: response?.cta_level || 1,
            ctsScore: response?.cts_score || 0.8,
            canAutoPost: response?.can_auto_post || false,
          },
          cluster: null,
          status: item.status === 'queued' ? 'pending' : item.status as any,
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
