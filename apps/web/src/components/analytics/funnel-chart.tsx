'use client';

import { cn } from '@/lib/utils';

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
  color: string;
}

export interface FunnelChartProps {
  data: FunnelStage[];
  loading?: boolean;
  className?: string;
}

export function FunnelChart({ data, loading = false, className }: FunnelChartProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Conversion Funnel
      </h3>

      <div className="space-y-3">
        {data.map((stage, index) => {
          const widthPercentage = (stage.count / maxCount) * 100;
          const isLast = index === data.length - 1;

          return (
            <div key={stage.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stage.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Funnel bar */}
              <div className="relative">
                <div
                  className="h-8 rounded-md transition-all duration-500 flex items-center justify-center"
                  style={{
                    width: `${Math.max(widthPercentage, 10)}%`,
                    backgroundColor: stage.color,
                    marginLeft: `${(100 - widthPercentage) / 2}%`,
                  }}
                >
                  <span className="text-xs font-medium text-white drop-shadow">
                    {stage.count.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dropoff indicator */}
              {!isLast && stage.dropoff > 0 && (
                <div className="flex justify-center mt-1 mb-2">
                  <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                    <span>-{stage.dropoff.toFixed(1)}% dropoff</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(() => {
                const lastStage = data[data.length - 1];
                const firstStage = data[0];
                if (data.length > 0 && lastStage && firstStage) {
                  return ((lastStage.count / firstStage.count) * 100).toFixed(1);
                }
                return '0';
              })()}
              %
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Overall Conversion</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {(() => {
                const lastStage = data[data.length - 1];
                const firstStage = data[0];
                if (data.length > 1 && firstStage && lastStage) {
                  return firstStage.count - lastStage.count;
                }
                return 0;
              })()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Dropoff</p>
          </div>
        </div>
      </div>
    </div>
  );
}
