'use client';

import { cn, formatRelativeTime, formatPlatformName } from '@/lib/utils';

interface OriginalPostProps {
  platform: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
  };
  content: string;
  authorHandle: string | null;
  url: string;
  detectedAt: string;
  className?: string;
  compact?: boolean;
}

const platformColors: Record<string, string> = {
  reddit: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  twitter: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  quora: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  linkedin: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30',
  google: 'text-green-600 bg-green-100 dark:bg-green-900/30',
};

const platformIcons: Record<string, string> = {
  reddit: 'R',
  twitter: 'X',
  quora: 'Q',
  linkedin: 'in',
  google: 'G',
};

export function OriginalPost({
  platform,
  content,
  authorHandle,
  url,
  detectedAt,
  className,
  compact = false,
}: OriginalPostProps) {
  const platformColor = platformColors[platform.slug] || 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  const platformIcon = platformIcons[platform.slug] || platform.name.charAt(0);

  return (
    <div className={cn('bg-gray-50 dark:bg-gray-900/50', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {/* Platform badge with icon */}
        <span
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
            platformColor
          )}
        >
          {platformIcon}
        </span>
        <span className={cn('text-sm font-medium', platformColor.split(' ')[0])}>
          {formatPlatformName(platform.slug)}
        </span>

        {/* Separator */}
        <span className="text-gray-300 dark:text-gray-600">|</span>

        {/* Author handle */}
        {authorHandle && (
          <>
            <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-32">
              {authorHandle}
            </span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
          </>
        )}

        {/* Time */}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatRelativeTime(detectedAt)}
        </span>
      </div>

      {/* Content */}
      <p
        className={cn(
          'text-gray-800 dark:text-gray-200 leading-relaxed',
          compact ? 'text-sm line-clamp-3' : 'text-base'
        )}
      >
        {content}
      </p>

      {/* View original link */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        View original
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
}
