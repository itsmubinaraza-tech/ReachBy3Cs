'use client';

import Link from 'next/link';
import { cn, formatRelativeTime } from '@/lib/utils';
import { ThemeTags, SentimentBadge } from './theme-tags';
import { ClusterStats } from './cluster-stats';
import type { ClusterDetail, ClusterPost, SimilarCluster } from '@/hooks/use-clusters';

interface ClusterDetailViewProps {
  cluster: ClusterDetail;
  posts?: ClusterPost[];
  postsLoading?: boolean;
  onViewAllPosts?: () => void;
  onSeedCommunity?: () => void;
  className?: string;
}

/**
 * Full cluster detail view with posts and related clusters
 */
export function ClusterDetailView({
  cluster,
  posts = [],
  postsLoading = false,
  onViewAllPosts,
  onSeedCommunity,
  className,
}: ClusterDetailViewProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-blue-600 dark:text-blue-400"
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {cluster.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <SentimentBadge sentiment={cluster.themes.sentiment} />
                {cluster.is_trending && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Trending
                  </span>
                )}
              </div>
            </div>
          </div>

          {onSeedCommunity && (
            <button
              onClick={onSeedCommunity}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2',
                'text-sm font-medium rounded-lg transition-colors',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Seed Community
            </button>
          )}
        </div>

        {cluster.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {cluster.description}
          </p>
        )}

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Themes & Keywords
          </h3>
          <ThemeTags keywords={cluster.themes.keywords} maxTags={10} size="md" />
        </div>

        <ClusterStats
          memberCount={cluster.member_count}
          engagementCount={cluster.engagement_count}
          lastActivityAt={cluster.last_activity_at}
          avgEmotionalIntensity={cluster.avg_emotional_intensity}
          avgRiskScore={cluster.avg_risk_score}
          isTrending={cluster.is_trending}
        />

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span>First detected: {formatRelativeTime(cluster.first_detected_at)}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span>Last activity: {formatRelativeTime(cluster.last_activity_at)}</span>
        </div>
      </div>

      {/* Sample Posts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sample Posts
          </h2>
          {onViewAllPosts && (
            <button
              onClick={onViewAllPosts}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all {cluster.member_count} posts
            </button>
          )}
        </div>

        {postsLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No posts to display
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.slice(0, 5).map((post) => (
              <ClusterPostItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Similar Clusters */}
      {cluster.similar_clusters.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Related Communities
            </h2>
          </div>

          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cluster.similar_clusters.map((similar) => (
              <SimilarClusterCard key={similar.id} cluster={similar} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ClusterPostItemProps {
  post: ClusterPost;
  className?: string;
}

/**
 * Individual post item within a cluster
 */
export function ClusterPostItem({ post, className }: ClusterPostItemProps) {
  return (
    <div className={cn('p-4', className)}>
      <p className="text-gray-800 dark:text-gray-200 mb-2 line-clamp-3">
        {post.content}
      </p>
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {post.author && <span>@{post.author}</span>}
        <span>{formatRelativeTime(post.detected_at)}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {Math.round(post.similarity_score * 100)}% match
        </span>
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View original
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

interface SimilarClusterCardProps {
  cluster: SimilarCluster;
  className?: string;
}

/**
 * Card for related/similar clusters
 */
export function SimilarClusterCard({ cluster, className }: SimilarClusterCardProps) {
  return (
    <Link
      href={`/dashboard/communities/${cluster.id}`}
      className={cn(
        'block p-4 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
        className
      )}
    >
      <h4 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
        {cluster.name}
      </h4>
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>{cluster.member_count} posts</span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>{Math.round(cluster.similarity_score * 100)}% similar</span>
      </div>
    </Link>
  );
}
