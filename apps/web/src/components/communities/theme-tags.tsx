'use client';

import { cn } from '@/lib/utils';

interface ThemeTagsProps {
  keywords: string[];
  maxTags?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Display cluster keywords/themes as tags
 */
export function ThemeTags({
  keywords,
  maxTags = 5,
  size = 'sm',
  className,
}: ThemeTagsProps) {
  const displayTags = keywords.slice(0, maxTags);
  const remainingCount = keywords.length - maxTags;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTags.map((keyword, index) => (
        <span
          key={`${keyword}-${index}`}
          className={cn(
            'inline-flex items-center rounded-full font-medium',
            'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors',
            sizeClasses[size]
          )}
        >
          {keyword}
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={cn(
            'inline-flex items-center rounded-full font-medium',
            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
            sizeClasses[size]
          )}
        >
          +{remainingCount} more
        </span>
      )}
    </div>
  );
}

interface SentimentBadgeProps {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

/**
 * Display sentiment indicator badge
 */
export function SentimentBadge({
  sentiment,
  size = 'sm',
  showIcon = true,
}: SentimentBadgeProps) {
  const sentimentConfig = {
    positive: {
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Positive',
    },
    negative: {
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Negative',
    },
    neutral: {
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Neutral',
    },
    mixed: {
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: 'Mixed',
    },
  };

  const config = sentimentConfig[sentiment];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.color,
        sizeClasses
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
}
