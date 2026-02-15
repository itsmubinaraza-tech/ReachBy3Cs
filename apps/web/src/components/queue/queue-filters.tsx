'use client';

import { cn } from '@/lib/utils';

export type FilterType = 'all' | 'low-risk' | 'high-cts' | 'needs-review';

interface QueueFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    lowRisk: number;
    highCts: number;
    needsReview: number;
  };
}

export function QueueFilters({ activeFilter, onFilterChange, counts }: QueueFiltersProps) {
  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'low-risk', label: 'Low Risk', count: counts.lowRisk },
    { id: 'high-cts', label: 'High CTS', count: counts.highCts },
    { id: 'needs-review', label: 'Needs Review', count: counts.needsReview },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeFilter === filter.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          {filter.label}
          <span
            className={cn(
              'px-1.5 py-0.5 rounded-full text-xs',
              activeFilter === filter.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            )}
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}
