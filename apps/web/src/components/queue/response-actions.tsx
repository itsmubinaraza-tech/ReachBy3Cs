'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MarkPostedModal } from './mark-posted-modal';

interface ResponseActionsProps {
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  onCopy?: () => void;
  onOpenOriginal?: () => void;
  onMarkPosted?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  showPostActions?: boolean;
}

/**
 * Basic approve/reject/edit actions for queue items
 */
export function ResponseActions({
  onApprove,
  onReject,
  onEdit,
  onCopy,
  onOpenOriginal,
  onMarkPosted,
  isLoading = false,
  disabled = false,
  className,
  compact = false,
  showPostActions = true,
}: ResponseActionsProps) {
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | 'edit' | 'posted' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleAction = (action: 'approve' | 'reject' | 'edit' | 'posted', handler: () => void) => {
    if (disabled || isLoading) return;
    setActiveAction(action);
    handler();
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
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

      {/* Divider */}
      {showPostActions && (onCopy || onOpenOriginal || onMarkPosted) && (
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 hidden sm:block" />
      )}

      {/* Copy Button */}
      {showPostActions && onCopy && (
        <button
          onClick={handleCopy}
          disabled={disabled || isLoading}
          className={cn(
            buttonBaseClass,
            'border border-gray-300 dark:border-gray-600',
            'text-gray-700 dark:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
            copySuccess && 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          )}
        >
          <span className="flex items-center gap-1.5">
            {copySuccess ? (
              <>
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 dark:text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </span>
        </button>
      )}

      {/* Open Original Button */}
      {showPostActions && onOpenOriginal && (
        <button
          onClick={onOpenOriginal}
          disabled={disabled || isLoading}
          className={cn(
            buttonBaseClass,
            'border border-gray-300 dark:border-gray-600',
            'text-gray-700 dark:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500'
          )}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {compact ? 'Open' : 'Open Original'}
          </span>
        </button>
      )}

      {/* Mark as Posted Button */}
      {showPostActions && onMarkPosted && (
        <button
          onClick={() => handleAction('posted', onMarkPosted)}
          disabled={disabled || isLoading}
          className={cn(
            buttonBaseClass,
            'bg-blue-600 text-white',
            'hover:bg-blue-700 focus:ring-blue-500',
            activeAction === 'posted' && isLoading && 'opacity-70'
          )}
        >
          {activeAction === 'posted' && isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Posting...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {compact ? 'Posted' : 'Mark Posted'}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Post-approval actions: Copy, Open Original, Mark Posted
 */
interface PostApprovalActionsProps {
  responseText: string;
  originalUrl: string;
  responseId: string;
  onMarkPosted: (externalUrl?: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function PostApprovalActions({
  responseText,
  originalUrl,
  responseId,
  onMarkPosted,
  isLoading = false,
  className,
}: PostApprovalActionsProps) {
  const [showMarkPosted, setShowMarkPosted] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(responseText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenOriginal = () => {
    window.open(originalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConfirmPosted = async (externalUrl?: string) => {
    await onMarkPosted(externalUrl);
    setShowMarkPosted(false);
  };

  const buttonClass = cn(
    'px-3 py-2 text-sm font-medium rounded-lg transition-all',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  return (
    <>
      <div className={cn('flex flex-wrap gap-2', className)}>
        {/* Copy Response */}
        <button
          onClick={handleCopy}
          className={cn(
            buttonClass,
            'border border-gray-300 dark:border-gray-600',
            'text-gray-700 dark:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus:ring-gray-500',
            copySuccess && 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          )}
        >
          <span className="flex items-center gap-1.5">
            {copySuccess ? (
              <>
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-600 dark:text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </span>
        </button>

        {/* Open Original */}
        <button
          onClick={handleOpenOriginal}
          className={cn(
            buttonClass,
            'border border-gray-300 dark:border-gray-600',
            'text-gray-700 dark:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus:ring-gray-500'
          )}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Original
          </span>
        </button>

        {/* Mark as Posted */}
        <button
          onClick={() => setShowMarkPosted(true)}
          disabled={isLoading}
          className={cn(
            buttonClass,
            'bg-green-600 text-white',
            'hover:bg-green-700',
            'focus:ring-green-500'
          )}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark Posted
          </span>
        </button>
      </div>

      <MarkPostedModal
        open={showMarkPosted}
        onClose={() => setShowMarkPosted(false)}
        onConfirm={handleConfirmPosted}
        isLoading={isLoading}
      />
    </>
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
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">c</kbd>
        Copy
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">o</kbd>
        Open
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">p</kbd>
        Posted
      </span>
    </div>
  );
}
