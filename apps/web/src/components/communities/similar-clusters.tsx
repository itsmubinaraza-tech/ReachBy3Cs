'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeTags } from './theme-tags';
import { TrendingIndicator } from './cluster-stats';
import type { SimilarCluster, TrendingCluster } from '@/hooks/use-clusters';

interface SimilarClustersProps {
  clusters: SimilarCluster[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Display a list of similar/related clusters
 */
export function SimilarClusters({
  clusters,
  title = 'Related Communities',
  emptyMessage = 'No related communities found.',
  className,
}: SimilarClustersProps) {
  if (clusters.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500 dark:text-gray-400', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}

      <div className="space-y-3">
        {clusters.map((cluster) => (
          <Link
            key={cluster.id}
            href={`/dashboard/communities/${cluster.id}`}
            className={cn(
              'block p-4 rounded-lg border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800',
              'hover:border-blue-300 dark:hover:border-blue-700',
              'hover:shadow-sm transition-all'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                  {cluster.name}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {cluster.member_count.toLocaleString()} posts
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <SimilarityBadge score={cluster.similarity_score} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface SimilarityBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

/**
 * Badge showing similarity percentage
 */
export function SimilarityBadge({ score, size = 'sm' }: SimilarityBadgeProps) {
  const percentage = Math.round(score * 100);

  const getColor = () => {
    if (percentage >= 80) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span className={cn('rounded-full font-medium', getColor(), sizeClasses)}>
      {percentage}% similar
    </span>
  );
}

interface TrendingClustersWidgetProps {
  clusters: TrendingCluster[];
  loading?: boolean;
  title?: string;
  showAll?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}

/**
 * Widget displaying trending clusters
 */
export function TrendingClustersWidget({
  clusters,
  loading = false,
  title = 'Trending Communities',
  showAll = false,
  maxItems = 5,
  onViewAll,
  className,
}: TrendingClustersWidgetProps) {
  const displayClusters = showAll ? clusters : clusters.slice(0, maxItems);

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {title}
        </h3>
        {!showAll && clusters.length > maxItems && onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayClusters.length === 0 ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p>No trending communities yet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {displayClusters.map((cluster, index) => (
            <Link
              key={cluster.id}
              href={`/dashboard/communities/${cluster.id}`}
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {cluster.name}
                    </h4>
                    <TrendingIndicator
                      growthRate={cluster.growth_rate}
                      recentAdditions={cluster.recent_additions}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>{cluster.member_count.toLocaleString()} posts</span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>+{cluster.recent_additions} new</span>
                  </div>
                  <ThemeTags keywords={cluster.themes.keywords} maxTags={3} size="sm" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClusterComparisonProps {
  cluster1: SimilarCluster;
  cluster2: SimilarCluster;
  onMerge?: () => void;
  className?: string;
}

/**
 * Side-by-side comparison of two clusters
 */
export function ClusterComparison({
  cluster1,
  cluster2,
  onMerge,
  className,
}: ClusterComparisonProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Cluster Comparison
        </h3>
        {onMerge && (
          <button
            onClick={onMerge}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Merge Clusters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 truncate">
            {cluster1.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cluster1.member_count.toLocaleString()} posts
          </p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2 truncate">
            {cluster2.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cluster2.member_count.toLocaleString()} posts
          </p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {Math.round(Math.min(cluster1.similarity_score, cluster2.similarity_score) * 100)}% Similarity
          </span>
        </div>
      </div>
    </div>
  );
}
