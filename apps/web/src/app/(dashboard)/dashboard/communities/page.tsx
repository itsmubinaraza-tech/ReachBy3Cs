'use client';

import { useState, useCallback } from 'react';
import { useOrg } from '@/contexts/org-context';
import {
  ClusterList,
  ClusterPagination,
  TrendingClustersWidget,
} from '@/components/communities';
import {
  useClusters,
  useTrendingClusters,
  useRunClustering,
} from '@/hooks/use-clusters';

type SortBy = 'member_count' | 'last_activity' | 'name';
type SortOrder = 'asc' | 'desc';

export default function CommunitiesPage() {
  const { organization } = useOrg();
  const orgId = organization?.id || '';

  // State for pagination and sorting
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('last_activity');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Fetch clusters
  const {
    clusters,
    total,
    loading,
    error,
    refetch,
    totalPages,
  } = useClusters(orgId, {
    page,
    pageSize: 10,
    sortBy,
    sortOrder,
  });

  // Fetch trending clusters
  const {
    trending,
    loading: trendingLoading,
  } = useTrendingClusters(orgId, {
    timeWindowHours: 24,
    topK: 5,
  });

  // Run clustering hook
  const {
    runClustering,
    loading: clusteringLoading,
    result: clusteringResult,
  } = useRunClustering(orgId);

  // Handle run clustering
  const handleRunClustering = useCallback(async () => {
    try {
      await runClustering({ minClusterSize: 5 });
      refetch();
    } catch (err) {
      console.error('Clustering failed:', err);
    }
  }, [runClustering, refetch]);

  // Handle seed community
  const handleSeedCommunity = useCallback((clusterId: string) => {
    // TODO: Implement seed community functionality
    console.log('Seed community:', clusterId);
  }, []);

  // Handle sort change
  const handleSortChange = (newSortBy: SortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Community Clusters
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {total} {total === 1 ? 'community' : 'communities'} detected from your posts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={handleRunClustering}
                disabled={clusteringLoading || !orgId}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {clusteringLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Run Clustering
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clustering Result Toast */}
          {clusteringResult && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Clustering complete: Found {clusteringResult.clusters} clusters from {clusteringResult.total_posts} posts
                ({clusteringResult.unclustered} unclustered) in {(clusteringResult.processing_time_ms / 1000).toFixed(1)}s
              </p>
            </div>
          )}

          {/* Sort Controls */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Sort by:</span>
            <div className="flex gap-2">
              {[
                { key: 'last_activity', label: 'Recent' },
                { key: 'member_count', label: 'Size' },
                { key: 'name', label: 'Name' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key as SortBy)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sortBy === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                  {sortBy === key && (
                    <span className="ml-1">
                      {sortOrder === 'desc' ? '\u2193' : '\u2191'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Cluster List */}
          <div className="lg:col-span-2">
            <ClusterList
              clusters={clusters}
              loading={loading}
              error={error}
              onSeedCommunity={handleSeedCommunity}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <ClusterPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>

          {/* Sidebar - Trending */}
          <div className="lg:col-span-1">
            <TrendingClustersWidget
              clusters={trending}
              loading={trendingLoading}
              title="Trending Communities"
              maxItems={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
