'use client';

import { cn, formatRelativeTime, formatPlatformName, getRiskColor, formatScore } from '@/lib/utils';
import { BulkSelectCheckbox } from './bulk-actions';
import { ClusterBadge } from './cluster-info';
import type { QueueItemDisplay } from 'shared-types';

interface ResponseCardCompactProps {
  item: QueueItemDisplay;
  isSelected?: boolean;
  isFocused?: boolean;
  showCheckbox?: boolean;
  onSelect?: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

const platformColors: Record<string, string> = {
  reddit: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  twitter: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  quora: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  linkedin: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30',
  google: 'text-green-600 bg-green-100 dark:bg-green-900/30',
};

export function ResponseCardCompact({
  item,
  isSelected = false,
  isFocused = false,
  showCheckbox = false,
  onSelect,
  onApprove,
  onReject,
  onClick,
  className,
}: ResponseCardCompactProps) {
  const platformColor = platformColors[item.original.platform.slug] || 'text-gray-600 bg-gray-100 dark:bg-gray-700';

  const getCTSColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border transition-all',
        isFocused
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-700',
        isSelected && 'bg-blue-50/50 dark:bg-blue-900/10',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600',
        className
      )}
      onClick={onClick}
    >
      {/* Checkbox */}
      {showCheckbox && onSelect && (
        <div className="pt-0.5">
          <BulkSelectCheckbox checked={isSelected} onChange={onSelect} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Platform badge */}
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              platformColor
            )}
          >
            {formatPlatformName(item.original.platform.slug)}
          </span>

          {/* Risk level */}
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              getRiskColor(item.analysis.riskLevel)
            )}
          >
            {item.analysis.riskLevel.charAt(0).toUpperCase() + item.analysis.riskLevel.slice(1)}
          </span>

          {/* CTS Score */}
          <span className={cn('text-xs font-medium', getCTSColor(item.metrics.ctsScore))}>
            CTS: {formatScore(item.metrics.ctsScore)}
          </span>

          {/* Auto-post indicator */}
          {item.metrics.canAutoPost && (
            <span className="px-2 py-0.5 rounded text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30">
              Auto
            </span>
          )}

          {/* Time */}
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeTime(item.original.detectedAt)}
          </span>
        </div>

        {/* Original post preview */}
        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
          {item.original.content}
        </p>

        {/* Selected response preview */}
        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 italic mb-2">
          {'"'}{item.responses.selected.substring(0, 100)}...{'"'}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Author */}
            {item.original.authorHandle && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24">
                {item.original.authorHandle}
              </span>
            )}

            {/* Cluster */}
            <ClusterBadge cluster={item.cluster} />
          </div>

          {/* Quick actions (visible on hover) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onApprove(item.id);
              }}
              className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
              title="Approve"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(item.id);
              }}
              className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Reject"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
