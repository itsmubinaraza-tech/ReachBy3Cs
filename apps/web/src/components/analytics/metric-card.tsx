'use client';

import { cn } from '@/lib/utils';
import { TrendIndicator } from './trend-indicator';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  className,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </p>
        {icon && (
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2 mt-2">
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        {change !== undefined && <TrendIndicator value={change} />}
      </div>
      {(changeLabel || description) && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {changeLabel || description}
        </p>
      )}
    </div>
  );
}
