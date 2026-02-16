'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ResponseActionsProps {
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function ResponseActions({
  onApprove,
  onReject,
  onEdit,
  isLoading = false,
  disabled = false,
  className,
  compact = false,
}: ResponseActionsProps) {
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | 'edit' | null>(null);

  const handleAction = (action: 'approve' | 'reject' | 'edit', handler: () => void) => {
    if (disabled || isLoading) return;
    setActiveAction(action);
    handler();
  };

  const buttonBaseClass = cn(
    'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    compact ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  );

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {/* Approve Button */}
      <button
        onClick={() => handleAction('approve', onApprove)}
        disabled={disabled || isLoading}
        className={cn(
          buttonBaseClass,
          'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
          activeAction === 'approve' && isLoading && 'opacity-70'
        )}
      >
        {activeAction === 'approve' && isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Approving...
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            {compact ? 'Approve' : 'Approve'}
          </span>
        )}
      </button>

      {/* Reject Button */}
      <button
        onClick={() => handleAction('reject', onReject)}
        disabled={disabled || isLoading}
        className={cn(
          buttonBaseClass,
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
          activeAction === 'reject' && isLoading && 'opacity-70'
        )}
      >
        {activeAction === 'reject' && isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Rejecting...
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {compact ? 'Reject' : 'Reject'}
          </span>
        )}
      </button>

      {/* Edit Button */}
      <button
        onClick={() => handleAction('edit', onEdit)}
        disabled={disabled || isLoading}
        className={cn(
          buttonBaseClass,
          'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
          'hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500'
        )}
      >
        <span className="flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          {compact ? 'Edit' : 'Edit'}
        </span>
      </button>
    </div>
  );
}

/**
 * Keyboard hint overlay for actions
 */
export function ActionKeyboardHints({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400', className)}>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">a</kbd>
        Approve
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">r</kbd>
        Reject
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">e</kbd>
        Edit
      </span>
    </div>
  );
}
