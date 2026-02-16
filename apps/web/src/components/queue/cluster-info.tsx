'use client';

import { cn } from '@/lib/utils';

interface ClusterInfoProps {
  cluster: {
    id: string;
    name: string;
    memberCount: number;
  } | null;
  className?: string;
  showLink?: boolean;
}

export function ClusterInfo({ cluster, className, showLink = false }: ClusterInfoProps) {
  if (!cluster) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400', className)}>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span>No cluster assigned</span>
      </div>
    );
  }

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30">
        <svg
          className="w-4 h-4 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {cluster.name}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {cluster.memberCount.toLocaleString()} members
        </span>
      </div>
    </div>
  );

  if (showLink) {
    return (
      <a
        href={`/dashboard/communities/${cluster.id}`}
        className="block hover:opacity-80 transition-opacity"
      >
        {content}
      </a>
    );
  }

  return content;
}

/**
 * Compact inline cluster badge
 */
export function ClusterBadge({
  cluster,
  className,
}: {
  cluster: { name: string; memberCount: number } | null;
  className?: string;
}) {
  if (!cluster) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
        className
      )}
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      {cluster.name}
      <span className="text-purple-500 dark:text-purple-400">
        ({cluster.memberCount.toLocaleString()})
      </span>
    </span>
  );
}
