'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn, formatPlatformName } from '@/lib/utils';

export interface PlatformData {
  platform: string;
  count: number;
  percentage: number;
}

export interface PlatformBreakdownProps {
  data: PlatformData[];
  loading?: boolean;
  className?: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#00C49F', '#FFBB28'];

export function PlatformBreakdown({ data, loading = false, className }: PlatformBreakdownProps) {
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
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto w-48" />
        </div>
      </div>
    );
  }

  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; payload: PlatformData }>;
  }) => {
    if (active && payload && payload.length && payload[0]) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatPlatformName(item.platform)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {item.count.toLocaleString()} posts ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Platform Breakdown
      </h3>

      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="count"
              nameKey="platform"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Platform list */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={item.platform} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formatPlatformName(item.platform)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.count.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {totalCount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
