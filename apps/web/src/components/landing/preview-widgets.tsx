'use client';

import { TrendingUp, Clock, CheckCircle, AlertCircle, Zap, Users } from 'lucide-react';
import {
  PreviewActivity,
  PreviewCluster,
  ChartDataPoint,
} from '@/lib/landing/mock-preview-data';

interface PreviewStatsWidgetProps {
  pendingCount: number;
  approvedToday: number;
}

export function PreviewStatsWidget({
  pendingCount,
  approvedToday,
}: PreviewStatsWidgetProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-gray-500">Pending Reviews</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-500">Approved Today</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{approvedToday}</p>
      </div>
    </div>
  );
}

interface PreviewActivityWidgetProps {
  activities: PreviewActivity[];
}

const activityIcons = {
  approved: { icon: CheckCircle, color: 'text-green-500' },
  posted: { icon: Zap, color: 'text-blue-500' },
  rejected: { icon: AlertCircle, color: 'text-red-500' },
  detected: { icon: TrendingUp, color: 'text-purple-500' },
};

export function PreviewActivityWidget({ activities }: PreviewActivityWidgetProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
      <div className="space-y-3">
        {activities.slice(0, 4).map((activity) => {
          const { icon: Icon, color } = activityIcons[activity.type];
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <Icon className={`w-4 h-4 ${color} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 line-clamp-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400">{activity.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PreviewAnalyticsWidgetProps {
  data: ChartDataPoint[];
}

export function PreviewAnalyticsWidget({ data }: PreviewAnalyticsWidgetProps) {
  // Simple SVG line chart for the preview
  const maxValue = Math.max(...data.map((d) => d.responses));
  const width = 280;
  const height = 80;
  const padding = 10;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.responses / maxValue) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  const approvedPoints = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.approved / maxValue) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Weekly Analytics</h4>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
            Responses
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Approved
          </span>
        </div>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Responses line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Approved line */}
        <polyline
          points={approvedPoints}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - (d.responses / maxValue) * (height - 2 * padding);
          return <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />;
        })}
      </svg>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-2">
        {data.map((d) => (
          <span key={d.date}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}

interface PreviewCommunitiesWidgetProps {
  clusters: PreviewCluster[];
}

export function PreviewCommunitiesWidget({ clusters }: PreviewCommunitiesWidgetProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-indigo-500" />
        <h4 className="text-sm font-medium text-gray-900">Trending Communities</h4>
      </div>
      <div className="space-y-3">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {cluster.name}
              </p>
              <p className="text-xs text-gray-500">{cluster.postCount} posts</p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {cluster.trending && (
                <TrendingUp className="w-3 h-3 text-green-500" />
              )}
              <span className="text-green-600">+{cluster.growth}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
