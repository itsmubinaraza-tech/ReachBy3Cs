/**
 * React hooks for cluster/community data fetching
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface ClusterThemes {
  main_theme: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  description: string;
}

export interface ClusterSummary {
  id: string;
  name: string;
  description: string | null;
  member_count: number;
  engagement_count: number;
  is_trending: boolean;
  keywords: string[];
  avg_emotional_intensity: number | null;
  last_activity_at: string;
}

export interface ClusterDetail {
  id: string;
  name: string;
  description: string | null;
  themes: ClusterThemes;
  member_count: number;
  engagement_count: number;
  avg_emotional_intensity: number | null;
  avg_risk_score: number | null;
  is_trending: boolean;
  first_detected_at: string;
  last_activity_at: string;
  similar_clusters: SimilarCluster[];
}

export interface SimilarCluster {
  id: string;
  name: string;
  similarity_score: number;
  member_count: number;
}

export interface ClusterPost {
  id: string;
  content: string;
  url: string | null;
  author: string | null;
  detected_at: string;
  similarity_score: number;
  added_at: string;
}

export interface TrendingCluster {
  id: string;
  name: string;
  member_count: number;
  recent_additions: number;
  growth_rate: number;
  themes: ClusterThemes;
}

export interface ClusterListResponse {
  clusters: ClusterSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface ClusterPostsResponse {
  cluster_id: string;
  cluster_name: string;
  posts: ClusterPost[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================
// Configuration
// ============================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================
// Hooks
// ============================================

/**
 * Hook for fetching and managing clusters
 */
export function useClusters(
  orgId: string,
  options?: {
    page?: number;
    pageSize?: number;
    sortBy?: 'member_count' | 'last_activity' | 'name';
    sortOrder?: 'asc' | 'desc';
  }
) {
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const sortBy = options?.sortBy || 'last_activity';
  const sortOrder = options?.sortOrder || 'desc';

  const fetchClusters = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organization_id: orgId,
        page: page.toString(),
        page_size: pageSize.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      const response = await fetch(
        `${API_BASE_URL}/clustering/clusters?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch clusters: ${response.statusText}`);
      }

      const data: ClusterListResponse = await response.json();
      setClusters(data.clusters);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clusters');
    } finally {
      setLoading(false);
    }
  }, [orgId, page, pageSize, sortBy, sortOrder]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  return {
    clusters,
    total,
    loading,
    error,
    refetch: fetchClusters,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Hook for fetching a single cluster's details
 */
export function useClusterDetail(clusterId: string | null) {
  const [cluster, setCluster] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCluster = useCallback(async () => {
    if (!clusterId) {
      setCluster(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/clustering/clusters/${clusterId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Cluster not found');
        }
        throw new Error(`Failed to fetch cluster: ${response.statusText}`);
      }

      const data: ClusterDetail = await response.json();
      setCluster(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cluster');
    } finally {
      setLoading(false);
    }
  }, [clusterId]);

  useEffect(() => {
    fetchCluster();
  }, [fetchCluster]);

  return {
    cluster,
    loading,
    error,
    refetch: fetchCluster,
  };
}

/**
 * Hook for fetching posts in a cluster
 */
export function useClusterPosts(
  clusterId: string | null,
  options?: {
    page?: number;
    pageSize?: number;
  }
) {
  const [posts, setPosts] = useState<ClusterPost[]>([]);
  const [clusterName, setClusterName] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;

  const fetchPosts = useCallback(async () => {
    if (!clusterId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/clustering/clusters/${clusterId}/posts?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.statusText}`);
      }

      const data: ClusterPostsResponse = await response.json();
      setPosts(data.posts);
      setClusterName(data.cluster_name);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [clusterId, page, pageSize]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    clusterName,
    total,
    loading,
    error,
    refetch: fetchPosts,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Hook for fetching trending clusters
 */
export function useTrendingClusters(
  orgId: string,
  options?: {
    timeWindowHours?: number;
    topK?: number;
  }
) {
  const [trending, setTrending] = useState<TrendingCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeWindowHours = options?.timeWindowHours || 24;
  const topK = options?.topK || 10;

  const fetchTrending = useCallback(async () => {
    if (!orgId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        organization_id: orgId,
        time_window_hours: timeWindowHours.toString(),
        top_k: topK.toString(),
      });

      const response = await fetch(
        `${API_BASE_URL}/clustering/trending?${params}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trending: ${response.statusText}`);
      }

      const data = await response.json();
      setTrending(data.trending);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending');
    } finally {
      setLoading(false);
    }
  }, [orgId, timeWindowHours, topK]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  return {
    trending,
    loading,
    error,
    refetch: fetchTrending,
  };
}

/**
 * Hook for running a clustering job
 */
export function useRunClustering(orgId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    clusters: number;
    total_posts: number;
    unclustered: number;
    processing_time_ms: number;
  } | null>(null);

  const runClustering = useCallback(
    async (options?: { since?: Date; minClusterSize?: number }) => {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const body: Record<string, unknown> = {
          organization_id: orgId,
        };

        if (options?.since) {
          body.since = options.since.toISOString();
        }
        if (options?.minClusterSize) {
          body.min_cluster_size = options.minClusterSize;
        }

        const response = await fetch(`${API_BASE_URL}/clustering/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`Clustering failed: ${response.statusText}`);
        }

        const data = await response.json();
        setResult({
          clusters: data.clusters.length,
          total_posts: data.total_posts,
          unclustered: data.unclustered_count,
          processing_time_ms: data.processing_time_ms,
        });

        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Clustering failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [orgId]
  );

  return {
    runClustering,
    loading,
    error,
    result,
  };
}
