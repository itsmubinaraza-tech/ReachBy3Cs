'use client';

import { PreviewQueueItemCard } from './preview-queue-item';
import {
  PreviewStatsWidget,
  PreviewActivityWidget,
  PreviewAnalyticsWidget,
  PreviewCommunitiesWidget,
} from './preview-widgets';
import {
  PreviewQueueItem,
  PreviewActivity,
  PreviewCluster,
  ChartDataPoint,
} from '@/lib/landing/mock-preview-data';

interface DashboardPreviewProps {
  items: PreviewQueueItem[];
  activities: PreviewActivity[];
  clusters: PreviewCluster[];
  chartData: ChartDataPoint[];
  isLiveMode?: boolean;
  isLoading?: boolean;
}

export function DashboardPreview({
  items,
  activities,
  clusters,
  chartData,
  isLiveMode = false,
  isLoading = false,
}: DashboardPreviewProps) {
  const pendingCount = items.length;
  const approvedToday = 12; // Mock value for display

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard Preview</h2>
        {isLiveMode && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Results
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Searching for conversations...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Queue Items */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Review Queue</h3>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                {pendingCount} pending
              </span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {items.slice(0, 3).map((item) => (
                <PreviewQueueItemCard
                  key={item.id}
                  item={item}
                  onCopy={() => {}}
                  onEdit={() => {}}
                  onMarkPosted={() => {}}
                />
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No conversations found. Try adjusting your search criteria.
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <PreviewStatsWidget
            pendingCount={pendingCount}
            approvedToday={approvedToday}
          />

          {/* Activity Feed */}
          <PreviewActivityWidget activities={activities} />

          {/* Analytics Chart */}
          <PreviewAnalyticsWidget data={chartData} />

          {/* Communities */}
          <PreviewCommunitiesWidget clusters={clusters} />
        </>
      )}

      {/* CTA for non-live mode */}
      {!isLiveMode && !isLoading && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-center">
          <p className="text-white text-sm mb-2">
            This is sample data. Search to see real conversations!
          </p>
          <p className="text-blue-100 text-xs">
            Fill out the form on the left to find people discussing your topic
          </p>
        </div>
      )}
    </div>
  );
}
