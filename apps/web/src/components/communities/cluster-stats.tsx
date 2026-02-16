'use client';

import { cn, formatRelativeTime } from '@/lib/utils';

interface ClusterStatsProps {
  memberCount: number;
  engagementCount: number;
  lastActivityAt: string;
  avgEmotionalIntensity?: number | null;
  avgRiskScore?: number | null;
  isTrending?: boolean;
  growthRate?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Display cluster statistics
 */
export function ClusterStats({
  memberCount,
  engagementCount,
  lastActivityAt,
  avgEmotionalIntensity,
  avgRiskScore,
  isTrending,
  growthRate,
  compact = false,
  className,
}: ClusterStatsProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400', className)}>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {memberCount.toLocaleString()}
        </span>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <span>Active {formatRelativeTime(lastActivityAt)}</span>
        {isTrending && (
          <>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Trending
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-4', className)}>
      {/* Member Count */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Posts
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {memberCount.toLocaleString()}
        </div>
        {growthRate !== undefined && growthRate > 0 && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +{growthRate.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Engagements */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Engagements
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {engagementCount.toLocaleString()}
        </div>
      </div>

      {/* Emotional Intensity */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Intensity
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {avgEmotionalIntensity !== null && avgEmotionalIntensity !== undefined
            ? `${Math.round(avgEmotionalIntensity * 100)}%`
            : '-'}
        </div>
      </div>

      {/* Last Activity */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last Active
        </div>
        <div className="text-lg font-semibold text-gray-900 dark:text-white">
          {formatRelativeTime(lastActivityAt)}
        </div>
        {isTrending && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending
          </div>
        )}
      </div>
    </div>
  );
}

interface TrendingIndicatorProps {
  growthRate: number;
  recentAdditions?: number;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Trending indicator badge
 */
export function TrendingIndicator({
  growthRate,
  recentAdditions,
  size = 'sm',
}: TrendingIndicatorProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-sm gap-1.5',
    lg: 'px-3 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        sizeClasses[size]
      )}
    >
      <svg className={iconSizes[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      {growthRate > 0 ? `+${growthRate.toFixed(0)}%` : 'Trending'}
      {recentAdditions !== undefined && recentAdditions > 0 && (
        <span className="text-green-500 dark:text-green-400">
          ({recentAdditions} new)
        </span>
      )}
    </span>
  );
}
