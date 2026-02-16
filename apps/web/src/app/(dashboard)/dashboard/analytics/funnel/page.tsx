'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  FunnelChart,
  MetricCard,
  DateRangePicker,
  getInitialDateRange,
} from '@/components/analytics';
import type { DateRange } from '@/components/analytics/date-range-picker';

export default function FunnelAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrg();
  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange);

  const { data, isLoading, error, refresh } = useAnalytics(dateRange);

  const isDemoMode = !user && !authLoading;

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  const funnel = data.funnel || [];

  // Calculate stage-by-stage conversion rates
  const stageConversions = funnel.map((stage, index) => {
    if (index === 0) return { ...stage, conversionFromPrevious: 100 };
    const previousCount = funnel[index - 1]?.count || 1;
    const conversionFromPrevious = (stage.count / previousCount) * 100;
    return { ...stage, conversionFromPrevious };
  });

  // Find the biggest dropoff stage
  const biggestDropoff = [...funnel]
    .filter((s) => s.dropoff > 0)
    .sort((a, b) => b.dropoff - a.dropoff)[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link href="/dashboard/analytics" className="hover:text-gray-700 dark:hover:text-gray-200">
            Analytics
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Conversion Funnel</span>
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
                Demo Mode - Displaying sample funnel data
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Conversion Funnel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Analyze the journey from detection to posting
            </p>
          </div>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Overall Conversion"
            value={(() => {
              const lastStage = funnel[funnel.length - 1];
              const firstStage = funnel[0];
              if (funnel.length > 0 && lastStage && firstStage) {
                return `${((lastStage.count / firstStage.count) * 100).toFixed(1)}%`;
              }
              return '0%';
            })()}
            description="Detected to Posted"
            loading={isLoading}
          />
          <MetricCard
            title="Total Processed"
            value={funnel[0]?.count ?? 0}
            description="Posts detected"
            loading={isLoading}
          />
          <MetricCard
            title="Successfully Posted"
            value={funnel.length > 0 ? (funnel[funnel.length - 1]?.count ?? 0) : 0}
            description="Final stage count"
            loading={isLoading}
          />
          <MetricCard
            title="Biggest Dropoff"
            value={biggestDropoff ? `${biggestDropoff.dropoff.toFixed(1)}%` : '0%'}
            description={biggestDropoff ? `At ${biggestDropoff.name} stage` : 'N/A'}
            loading={isLoading}
          />
        </div>

        {/* Main Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FunnelChart data={funnel} loading={isLoading} />

          {/* Stage Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Stage Analysis
            </h3>

            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {stageConversions.map((stage, index) => (
                  <div
                    key={stage.name}
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stage.name}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {index === 0 ? 'Starting point' : `${stage.conversionFromPrevious.toFixed(1)}% from previous`}
                      </span>
                      {stage.dropoff > 0 && (
                        <span className="text-red-500 dark:text-red-400">
                          -{stage.dropoff.toFixed(1)}% dropoff
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stage.percentage}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Insights Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Optimization Insights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Insight Card 1 */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium text-green-800 dark:text-green-200">Strong Area</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Signal detection is performing well with {funnel[1]?.percentage.toFixed(0) || 0}% signal rate
              </p>
            </div>

            {/* Insight Card 2 */}
            {biggestDropoff && biggestDropoff.dropoff > 10 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
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
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">Opportunity</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {biggestDropoff.name} stage has {biggestDropoff.dropoff.toFixed(0)}% dropoff - consider optimizing
                </p>
              </div>
            )}

            {/* Insight Card 3 */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
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
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <span className="font-medium text-blue-800 dark:text-blue-200">Recommendation</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Enable auto-posting for low-risk responses to improve Posted conversion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
