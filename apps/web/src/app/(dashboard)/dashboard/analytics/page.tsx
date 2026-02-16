'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  KPICards,
  EngagementChart,
  PlatformBreakdown,
  RiskDistribution,
  FunnelChart,
  ActivityFeed,
  DateRangePicker,
  ExportButton,
  getInitialDateRange,
} from '@/components/analytics';
import type { DateRange } from '@/components/analytics/date-range-picker';
import { generateReport } from '@/lib/analytics/export';

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrg();
  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange);

  const { data, isLoading, error, refresh } = useAnalytics(dateRange);

  // For demo mode
  const isDemoMode = !user && !authLoading;

  const handleExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (!data.kpis || !data.timeline || !data.platformBreakdown || !data.riskDistribution || !data.funnel) {
        return;
      }

      await generateReport(
        {
          kpis: data.kpis,
          timeline: data.timeline,
          platformBreakdown: data.platformBreakdown,
          riskDistribution: data.riskDistribution,
          funnel: data.funnel,
          dateRange: {
            startDate: dateRange.startDate.toISOString().split('T')[0] || '',
            endDate: dateRange.endDate.toISOString().split('T')[0] || '',
          },
          exportedAt: new Date().toISOString(),
        },
        format
      );
    },
    [data, dateRange]
  );

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
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
                Demo Mode - Displaying sample analytics data
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track engagement metrics and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButton onExport={handleExport} disabled={isLoading} />
          </div>
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
                Failed to load analytics data. Showing demo data instead.
              </span>
              <button
                onClick={refresh}
                className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="mb-6">
          <KPICards
            data={
              data.kpis || {
                postsDetected: 0,
                responsesGenerated: 0,
                responsesApproved: 0,
                responsesPosted: 0,
              }
            }
            loading={isLoading}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <EngagementChart data={data.timeline || []} loading={isLoading} />
          </div>
          <div className="lg:col-span-1">
            <PlatformBreakdown data={data.platformBreakdown || []} loading={isLoading} />
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FunnelChart data={data.funnel || []} loading={isLoading} />
          <RiskDistribution data={data.riskDistribution || []} loading={isLoading} />
        </div>

        {/* Quick Links to Detail Pages */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Link
            href="/dashboard/analytics/engagement"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Detailed Engagement
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Deep dive into engagement metrics
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics/funnel"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Conversion Funnel</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Analyze conversion stages
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard/analytics/realtime"
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Real-time Feed</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Live activity stream</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <ActivityFeed
          activities={data.activities || []}
          loading={isLoading}
          maxItems={5}
          showViewAll
          onViewAll={() => (window.location.href = '/dashboard/analytics/realtime')}
        />
      </div>
    </div>
  );
}
