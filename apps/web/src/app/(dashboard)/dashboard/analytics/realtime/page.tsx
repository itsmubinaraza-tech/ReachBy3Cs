'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { useRealtimeActivity } from '@/hooks/use-realtime-activity';
import { ActivityFeed, MetricCard } from '@/components/analytics';
import { cn, formatPlatformName } from '@/lib/utils';

export default function RealtimeAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrg();
  const { activities, isConnected, error, clearActivities } = useRealtimeActivity(100);
  const [filter, setFilter] = useState<string>('all');

  const isDemoMode = !user && !authLoading;

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  // Calculate activity stats
  const activityCounts = activities.reduce(
    (acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const platformCounts = activities.reduce(
    (acc, activity) => {
      if (activity.platform) {
        acc[activity.platform] = (acc[activity.platform] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // Filter activities
  const filteredActivities =
    filter === 'all'
      ? activities
      : activities.filter(
          (a) => a.type === filter || a.platform === filter
        );

  const filterOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'detected', label: 'Detected' },
    { value: 'generated', label: 'Generated' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'posted', label: 'Posted' },
    { value: 'edited', label: 'Edited' },
    { value: 'flagged', label: 'Flagged' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link href="/dashboard/analytics" className="hover:text-gray-700 dark:hover:text-gray-200">
            Analytics
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Real-time Activity</span>
        </nav>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Demo Mode - Simulated real-time activity
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Real-time Activity
              </h1>
              {/* Connection Status */}
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                  isConnected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  )}
                />
                {isConnected ? 'Live' : 'Disconnected'}
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Live stream of platform activity
            </p>
          </div>
          <button
            onClick={clearActivities}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {error.message}
              </span>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <MetricCard
            title="Total Events"
            value={activities.length}
            description="In current session"
          />
          <MetricCard
            title="Detected"
            value={activityCounts['detected'] || 0}
            icon={
              <span className="w-3 h-3 rounded-full bg-blue-500" />
            }
          />
          <MetricCard
            title="Generated"
            value={activityCounts['generated'] || 0}
            icon={
              <span className="w-3 h-3 rounded-full bg-purple-500" />
            }
          />
          <MetricCard
            title="Approved"
            value={activityCounts['approved'] || 0}
            icon={
              <span className="w-3 h-3 rounded-full bg-green-500" />
            }
          />
          <MetricCard
            title="Posted"
            value={activityCounts['posted'] || 0}
            icon={
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            }
          />
          <MetricCard
            title="Flagged"
            value={activityCounts['flagged'] || 0}
            icon={
              <span className="w-3 h-3 rounded-full bg-orange-500" />
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>

              {/* Activity Type Filter */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Activity Type
                </p>
                <div className="space-y-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                        filter === option.value
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      {option.label}
                      {option.value !== 'all' && (
                        <span className="float-right text-gray-400">
                          {activityCounts[option.value] || 0}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Breakdown */}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  By Platform
                </p>
                <div className="space-y-2">
                  {Object.entries(platformCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([platform, count]) => (
                      <button
                        key={platform}
                        onClick={() => setFilter(platform)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                          filter === platform
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                      >
                        <span>{formatPlatformName(platform)}</span>
                        <span className="text-gray-400">{count}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-3">
            <ActivityFeed
              activities={filteredActivities}
              loading={false}
              maxItems={100}
              showViewAll={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
