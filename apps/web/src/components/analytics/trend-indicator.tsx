'use client';

import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  value: number;
  format?: 'percentage' | 'decimal';
  showIcon?: boolean;
  className?: string;
}

export function TrendIndicator({
  value,
  format = 'percentage',
  showIcon = true,
  className,
}: TrendIndicatorProps) {
  const isPositive = value >= 0;
  const isNeutral = value === 0;

  const displayValue =
    format === 'percentage'
      ? `${isPositive ? '+' : ''}${Math.round(value * 100)}%`
      : `${isPositive ? '+' : ''}${value.toFixed(2)}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isNeutral
          ? 'text-gray-500'
          : isPositive
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400',
        className
      )}
    >
      {showIcon && !isNeutral && (
        <svg
          className={cn('w-3 h-3', !isPositive && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )}
      {displayValue}
    </span>
  );
}
