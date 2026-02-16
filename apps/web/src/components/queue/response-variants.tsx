'use client';

import { cn } from '@/lib/utils';
import type { ResponseType } from 'shared-types';

interface ResponseVariantsProps {
  responses: {
    valueFirst: string | null;
    softCta: string | null;
    contextual: string | null;
    selected: string;
    selectedType: ResponseType;
  };
  selectedType: ResponseType;
  onSelect: (type: ResponseType, content: string) => void;
  className?: string;
  compact?: boolean;
}

const responseLabels: Record<ResponseType, { label: string; description: string }> = {
  value_first: {
    label: 'Value-First',
    description: 'Provides value without any promotional content',
  },
  soft_cta: {
    label: 'Soft CTA',
    description: 'Subtly mentions potential solutions',
  },
  contextual: {
    label: 'Contextual',
    description: 'Asks clarifying questions to understand context',
  },
};

export function ResponseVariants({
  responses,
  selectedType,
  onSelect,
  className,
  compact = false,
}: ResponseVariantsProps) {
  const options: Array<{ type: ResponseType; content: string | null }> = [
    { type: 'value_first', content: responses.valueFirst },
    { type: 'soft_cta', content: responses.softCta },
    { type: 'contextual', content: responses.contextual },
  ].filter((opt) => opt.content);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {options.map((option) => {
        const isSelected = selectedType === option.type;
        const meta = responseLabels[option.type];

        return (
          <button
            key={option.type}
            onClick={() => onSelect(option.type, option.content!)}
            className={cn(
              'w-full text-left rounded-lg border transition-all',
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
              compact ? 'p-3' : 'p-4'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              {/* Selection indicator */}
              <span
                className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors',
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="3" />
                  </svg>
                )}
              </span>

              {/* Label badge */}
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                )}
              >
                {meta.label}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Selected
                </span>
              )}
            </div>

            {/* Response content */}
            <p
              className={cn(
                'text-gray-700 dark:text-gray-300 leading-relaxed ml-8',
                compact ? 'text-sm line-clamp-2' : 'text-sm'
              )}
            >
              {option.content}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact view showing only the selected response
 */
export function SelectedResponse({
  content,
  type,
  className,
}: {
  content: string;
  type: ResponseType;
  className?: string;
}) {
  const meta = responseLabels[type];

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
          {meta.label}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {meta.description}
        </span>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}
