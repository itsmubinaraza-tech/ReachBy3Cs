'use client';

import { cn, formatRelativeTime, formatPlatformName } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'detected' | 'generated' | 'approved' | 'rejected' | 'posted' | 'edited' | 'flagged';
  platform?: string;
  description: string;
  timestamp: string;
  user?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
  className?: string;
}

const activityIcons: Record<ActivityItem['type'], React.ReactNode> = {
  detected: (
    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-blue-600 dark:text-blue-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
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
    </div>
  ),
  generated: (
    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-purple-600 dark:text-purple-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    </div>
  ),
  approved: (
    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-green-600 dark:text-green-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ),
  rejected: (
    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-red-600 dark:text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  ),
  posted: (
    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-emerald-600 dark:text-emerald-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 11l5-5m0 0l5 5m-5-5v12"
        />
      </svg>
    </div>
  ),
  edited: (
    <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-yellow-600 dark:text-yellow-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </div>
  ),
  flagged: (
    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
      <svg
        className="w-3 h-3 text-orange-600 dark:text-orange-400"
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
    </div>
  ),
};

export function ActivityFeed({
  activities,
  loading = false,
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  className,
}: ActivityFeedProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
          className
        )}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayActivities = activities.slice(0, maxItems);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden',
        className
      )}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
      </div>

      {displayActivities.length === 0 ? (
        <div className="p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {displayActivities.map((activity) => (
            <li
              key={activity.id}
              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {activityIcons[activity.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {activity.platform && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatPlatformName(activity.platform)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                    {activity.user && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        by {activity.user}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showViewAll && activities.length > maxItems && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  );
}
