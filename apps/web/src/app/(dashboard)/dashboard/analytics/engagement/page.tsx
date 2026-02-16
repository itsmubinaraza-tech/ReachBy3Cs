'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useOrg } from '@/contexts/org-context';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  EngagementChart,
  MetricCard,
  DateRangePicker,
  ExportButton,
  getInitialDateRange,
} from '@/components/analytics';
import type { DateRange } from '@/components/analytics/date-range-picker';
import { generateReport } from '@/lib/analytics/export';

export default function EngagementAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { organization, isLoading: orgLoading } = useOrg();
  const [dateRange, setDateRange] = useState<DateRange>(getInitialDateRange);

  const { data, isLoading, error, refresh } = useAnalytics(dateRange);

  const isDemoMode = !user && !authLoading;

  const handleExport = async (format: 'csv' | 'json') => {
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
  };

  if (authLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  // Calculate additional metrics
  const kpis = data.kpis;
  const approvalRate = kpis
    ? kpis.responsesApproved / (kpis.responsesGenerated || 1)
    : 0;
  const postRate = kpis
    ? kpis.responsesPosted / (kpis.responsesApproved || 1)
    : 0;
  const generationRate = kpis
    ? kpis.responsesGenerated / (kpis.postsDetected || 1)
    : 0;
  const overallConversion = kpis
    ? kpis.responsesPosted / (kpis.postsDetected || 1)
    : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link href="/dashboard/analytics" className="hover:text-gray-700 dark:hover:text-gray-200">
            Analytics
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">Engagement</span>
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
                Demo Mode - Displaying sample engagement data
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Engagement Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Detailed breakdown of engagement metrics over time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButton onExport={handleExport} disabled={isLoading} />
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Approval Rate"
            value={`${(approvalRate * 100).toFixed(1)}%`}
            description="Approved / Generated"
            loading={isLoading}
          />
          <MetricCard
            title="Post Rate"
            value={`${(postRate * 100).toFixed(1)}%`}
            description="Posted / Approved"
            loading={isLoading}
          />
          <MetricCard
            title="Generation Rate"
            value={`${(generationRate * 100).toFixed(1)}%`}
            description="Generated / Detected"
            loading={isLoading}
          />
          <MetricCard
            title="Overall Conversion"
            value={`${(overallConversion * 100).toFixed(1)}%`}
            description="Posted / Detected"
            loading={isLoading}
          />
        </div>

        {/* Main Chart */}
        <div className="mb-6">
          <EngagementChart
            data={data.timeline || []}
            loading={isLoading}
            className="min-h-[400px]"
          />
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Daily Breakdown
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Generated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Posted
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  [...Array(7)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  (data.timeline || []).map((day, index) => {
                    const conversion = day.postsDetected > 0
                      ? ((day.responsesPosted / day.postsDetected) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {day.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {day.postsDetected.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {day.responsesGenerated.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {day.responsesApproved.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-300">
                          {day.responsesPosted.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-blue-600 dark:text-blue-400">
                          {conversion}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
