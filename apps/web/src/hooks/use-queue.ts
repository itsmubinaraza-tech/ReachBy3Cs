'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
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
    if (!user) return;

    try {
      // Get all pending items to calculate counts
      const { data, error: countError } = await supabase
        .from('responses')
        .select(`
          id,
          cts_score,
          can_auto_post,
          signal:signals!inner(
            id,
            risk_score:risk_scores!inner(
              risk_level
            )
          )
        `)
        .eq('status', 'pending');

      if (countError) {
        console.error('Error fetching counts:', countError);
        return;
      }

      const pending = data || [];
      setCounts({
        all: pending.length,
        lowRisk: pending.filter((item: any) =>
          item.signal?.risk_score?.risk_level === 'low'
        ).length,
        highCts: pending.filter((item: any) => item.cts_score >= 0.8).length,
        needsReview: pending.filter((item: any) =>
          !item.can_auto_post ||
          item.signal?.risk_score?.risk_level === 'high' ||
          item.signal?.risk_score?.risk_level === 'blocked'
        ).length,
      });
    } catch (err) {
      console.error('Error in fetchCounts:', err);
    }
  }, [user, supabase]);

  // Build and execute the main query
  const fetchItems = useCallback(async (reset = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      // Build query with joins
      let query = supabase
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
          status,
          created_at,
          cluster:clusters(
            id,
            name,
            member_count
          ),
          signal:signals!inner(
            id,
            problem_category_id,
            emotional_intensity,
            keywords,
            post:posts!inner(
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
            risk_score:risk_scores!inner(
              risk_level,
              risk_score,
              context_flags
            )
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.riskLevel) {
        query = query.eq('signal.risk_score.risk_level', filters.riskLevel);
      }

      if (filters.platformId) {
        query = query.eq('signal.post.platform_id', filters.platformId);
      }

      if (filters.minCtsScore !== undefined) {
        query = query.gte('cts_score', filters.minCtsScore);
      }

      if (filters.maxCtsScore !== undefined) {
        query = query.lte('cts_score', filters.maxCtsScore);
      }

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

      // Transform data to QueueItemDisplay format
      const transformedItems: QueueItemDisplay[] = (data || []).map((item: any) => ({
        id: item.id,
        original: {
          platform: {
            id: item.signal.post.platform.id,
            name: item.signal.post.platform.name,
            slug: item.signal.post.platform.slug,
            iconUrl: item.signal.post.platform.icon_url,
          },
          content: item.signal.post.content,
          authorHandle: item.signal.post.author_handle,
          url: item.signal.post.external_url,
          detectedAt: item.signal.post.detected_at,
        },
        analysis: {
          problemCategory: item.signal.problem_category_id,
          emotionalIntensity: item.signal.emotional_intensity,
          keywords: item.signal.keywords || [],
          riskLevel: item.signal.risk_score.risk_level,
          riskScore: item.signal.risk_score.risk_score,
          riskFactors: item.signal.risk_score.context_flags || [],
        },
        responses: {
          valueFirst: item.value_first_response,
          softCta: item.soft_cta_response,
          contextual: item.contextual_response,
          selected: item.selected_response,
          selectedType: item.selected_type,
        },
        metrics: {
          ctaLevel: item.cta_level,
          ctsScore: item.cts_score,
          canAutoPost: item.can_auto_post,
        },
        cluster: item.cluster ? {
          id: item.cluster.id,
          name: item.cluster.name,
          memberCount: item.cluster.member_count,
        } : null,
        status: item.status,
        priority: 50, // Default priority
        createdAt: item.created_at,
      }));

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
  }, [user, supabase, filters, page, pageSize]);

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

  // Initial fetch and refetch on filter change
  useEffect(() => {
    fetchItems(true);
    fetchCounts();
  }, [filters.status, filters.riskLevel, filters.platformId, filters.minCtsScore, filters.maxCtsScore, filters.dateFrom, filters.dateTo, user]);

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
