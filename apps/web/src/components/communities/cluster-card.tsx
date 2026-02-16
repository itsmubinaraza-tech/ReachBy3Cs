'use client';

import Link from 'next/link';
import { cn, formatRelativeTime } from '@/lib/utils';
import { ThemeTags, SentimentBadge } from './theme-tags';
import { ClusterStats, TrendingIndicator } from './cluster-stats';
import type { ClusterSummary, TrendingCluster } from '@/hooks/use-clusters';

interface ClusterCardProps {
  cluster: ClusterSummary;
  onSeedCommunity?: (clusterId: string) => void;
  className?: string;
}

/**
 * Card displaying cluster/community information
 *
 * Layout:
 * +-----------------------------------------------------+
 * | [Chat Icon] Financial Communication Struggles       |
 * | --------------------------------------------------- |
 * | Theme: relationship, money, communication           |
 * | Posts: 142  |  Active: 2 hours ago  |  [Trending]   |
 * | --------------------------------------------------- |
 * | "People struggling to discuss finances with         |
 * | their partners, often leading to arguments..."      |
 * | --------------------------------------------------- |
 * | [View Posts]  [Seed Community]                      |
 * +-----------------------------------------------------+
 */
export function ClusterCard({
  cluster,
  onSeedCommunity,
  className,
}: ClusterCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {cluster.name}
            </h3>
            {cluster.is_trending && (
              <TrendingIndicator growthRate={0} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* Theme Tags */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Themes
        </div>
        <ThemeTags keywords={cluster.keywords} maxTags={5} />
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <ClusterStats
          memberCount={cluster.member_count}
          engagementCount={cluster.engagement_count}
          lastActivityAt={cluster.last_activity_at}
          avgEmotionalIntensity={cluster.avg_emotional_intensity}
          isTrending={cluster.is_trending}
          compact
        />
      </div>

      {/* Description */}
      {cluster.description && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 italic">
            "{cluster.description}"
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2">
        <Link
          href={`/dashboard/communities/${cluster.id}`}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2',
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View Posts
        </Link>
        {onSeedCommunity && (
          <button
            onClick={() => onSeedCommunity(cluster.id)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2',
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Seed Community
          </button>
        )}
      </div>
    </div>
  );
}

interface TrendingClusterCardProps {
  cluster: TrendingCluster;
  onClick?: (clusterId: string) => void;
  className?: string;
}

/**
 * Compact card for trending clusters
 */
export function TrendingClusterCard({
  cluster,
  onClick,
  className,
}: TrendingClusterCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700',
        'hover:shadow-md transition-shadow duration-200 cursor-pointer',
        className
      )}
      onClick={() => onClick?.(cluster.id)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">
          {cluster.name}
        </h4>
        <TrendingIndicator
          growthRate={cluster.growth_rate}
          recentAdditions={cluster.recent_additions}
          size="sm"
        />
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{cluster.member_count.toLocaleString()} posts</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <SentimentBadge sentiment={cluster.themes.sentiment} size="sm" />
      </div>

      <div className="mt-2">
        <ThemeTags keywords={cluster.themes.keywords} maxTags={3} size="sm" />
      </div>
    </div>
  );
}
