'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ProjectWithConfigs, ProjectStatus, ProjectTone } from 'shared-types';

interface ProjectCardProps {
  project: ProjectWithConfigs;
  className?: string;
}

const statusColors: Record<ProjectStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
  paused: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  archived: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

const toneLabels: Record<ProjectTone, string> = {
  professional: 'Professional',
  casual: 'Casual',
  friendly: 'Friendly',
  technical: 'Technical',
  empathetic: 'Empathetic',
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  const statusStyle = statusColors[project.status];
  const configCount = project.config_count || 0;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
          'hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md',
          'transition-all cursor-pointer p-4',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate pr-2">
            {project.name}
          </h3>
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
              statusStyle.bg,
              statusStyle.text
            )}
          >
            {project.status}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Value Proposition */}
        {project.value_proposition && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-3 line-clamp-2 italic">
            &quot;{project.value_proposition}&quot;
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {/* Config Count */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>{configCount} config{configCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Tone */}
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{toneLabels[project.tone]}</span>
            </div>
          </div>

          {/* Arrow */}
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

/**
 * Empty state component for when no projects exist
 */
export function ProjectsEmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No projects yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Projects help you organize your search configurations and track engagement for different campaigns or products.
      </p>
      <Link href="/dashboard/projects/new">
        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Create your first project
        </button>
      </Link>
    </div>
  );
}

/**
 * Skeleton loader for project cards
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-5" />
      </div>
    </div>
  );
}
