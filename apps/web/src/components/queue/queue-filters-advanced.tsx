'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from 'shared-types';

export type FilterType = 'all' | 'low-risk' | 'high-cts' | 'needs-review';

interface QueueFiltersAdvancedProps {
  // Tab filters
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  counts: {
    all: number;
    lowRisk: number;
    highCts: number;
    needsReview: number;
  };
  // Advanced filters
  selectedPlatform: string | null;
  onPlatformChange: (platform: string | null) => void;
  selectedRiskLevel: RiskLevel | null;
  onRiskLevelChange: (level: RiskLevel | null) => void;
  minCtsScore: number | null;
  onMinCtsScoreChange: (score: number | null) => void;
  dateRange: { from: string | null; to: string | null };
  onDateRangeChange: (range: { from: string | null; to: string | null }) => void;
  // Available options
  platforms?: Array<{ id: string; name: string; slug: string }>;
  className?: string;
}

const tabFilters: Array<{ id: FilterType; label: string; countKey: keyof QueueFiltersAdvancedProps['counts'] }> = [
  { id: 'all', label: 'All', countKey: 'all' },
  { id: 'low-risk', label: 'Low Risk', countKey: 'lowRisk' },
  { id: 'high-cts', label: 'High CTS', countKey: 'highCts' },
  { id: 'needs-review', label: 'Needs Review', countKey: 'needsReview' },
];

const riskLevels: Array<{ value: RiskLevel; label: string; color: string }> = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
  { value: 'blocked', label: 'Blocked', color: 'text-red-600 bg-red-100' },
];

const defaultPlatforms = [
  { id: 'reddit', name: 'Reddit', slug: 'reddit' },
  { id: 'twitter', name: 'Twitter/X', slug: 'twitter' },
  { id: 'quora', name: 'Quora', slug: 'quora' },
  { id: 'linkedin', name: 'LinkedIn', slug: 'linkedin' },
];

export function QueueFiltersAdvanced({
  activeFilter,
  onFilterChange,
  counts,
  selectedPlatform,
  onPlatformChange,
  selectedRiskLevel,
  onRiskLevelChange,
  minCtsScore,
  onMinCtsScoreChange,
  dateRange,
  onDateRangeChange,
  platforms = defaultPlatforms,
  className,
}: QueueFiltersAdvancedProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    selectedPlatform !== null ||
    selectedRiskLevel !== null ||
    minCtsScore !== null ||
    dateRange.from !== null ||
    dateRange.to !== null;

  const clearAllFilters = () => {
    onPlatformChange(null);
    onRiskLevelChange(null);
    onMinCtsScoreChange(null);
    onDateRangeChange({ from: null, to: null });
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700', className)}>
      {/* Tab filters */}
      <div className="flex flex-wrap items-center gap-2 p-4">
        {tabFilters.map((filter) => (
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
              {counts[filter.countKey]}
            </span>
          </button>
        ))}

        {/* Toggle advanced filters */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            showAdvanced || hasActiveFilters
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            {/* Platform filter */}
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Platform
              </label>
              <select
                value={selectedPlatform || ''}
                onChange={(e) => onPlatformChange(e.target.value || null)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  'border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-900',
                  'text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              >
                <option value="">All platforms</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk level filter */}
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Risk Level
              </label>
              <div className="flex flex-wrap gap-2">
                {riskLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() =>
                      onRiskLevelChange(selectedRiskLevel === level.value ? null : level.value)
                    }
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      selectedRiskLevel === level.value
                        ? level.color
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min CTS Score */}
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Min CTS Score
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={minCtsScore ?? ''}
                onChange={(e) =>
                  onMinCtsScoreChange(e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0.0"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  'border-gray-300 dark:border-gray-600',
                  'bg-white dark:bg-gray-900',
                  'text-gray-900 dark:text-gray-100',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>

            {/* Date range */}
            <div className="flex-1 min-w-64">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.from || ''}
                  onChange={(e) =>
                    onDateRangeChange({ ...dateRange, from: e.target.value || null })
                  }
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-sm',
                    'border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-900',
                    'text-gray-900 dark:text-gray-100',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.to || ''}
                  onChange={(e) =>
                    onDateRangeChange({ ...dateRange, to: e.target.value || null })
                  }
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg border text-sm',
                    'border-gray-300 dark:border-gray-600',
                    'bg-white dark:bg-gray-900',
                    'text-gray-900 dark:text-gray-100',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
