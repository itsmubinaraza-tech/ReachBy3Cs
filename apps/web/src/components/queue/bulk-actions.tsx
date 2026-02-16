'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkApprove: () => Promise<void>;
  onBulkReject: (reason?: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkApprove,
  onBulkReject,
  isLoading = false,
  className,
}: BulkActionsProps) {
  const [activeAction, setActiveAction] = useState<'approve' | 'reject' | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const hasSelection = selectedCount > 0;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  const handleBulkApprove = async () => {
    if (!hasSelection || isLoading) return;
    setActiveAction('approve');
    try {
      await onBulkApprove();
    } finally {
      setActiveAction(null);
    }
  };

  const handleBulkReject = async () => {
    if (!hasSelection || isLoading) return;
    setActiveAction('reject');
    try {
      await onBulkReject(rejectReason || undefined);
      setShowRejectModal(false);
      setRejectReason('');
    } finally {
      setActiveAction(null);
    }
  };

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg',
          className
        )}
      >
        {/* Selection info */}
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
            {selectedCount}
          </span>
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {selectedCount === 1 ? 'item' : 'items'} selected
          </span>

          {/* Select/Deselect all */}
          {!allSelected ? (
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select all ({totalCount})
            </button>
          ) : (
            <button
              onClick={onDeselectAll}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Deselect all
            </button>
          )}
        </div>

        {/* Bulk action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkApprove}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-green-600 text-white hover:bg-green-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {activeAction === 'approve' && isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Approving...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve All
              </span>
            )}
          </button>

          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-red-600 text-white hover:bg-red-700',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject All
            </span>
          </button>

          <button
            onClick={onDeselectAll}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
              'hover:bg-gray-300 dark:hover:bg-gray-600'
            )}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Reject confirmation modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Reject {selectedCount} {selectedCount === 1 ? 'Response' : 'Responses'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone. Optionally provide a reason for rejection.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className={cn(
                'w-full px-3 py-2 border rounded-lg mb-4 resize-none',
                'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-red-500'
              )}
              rows={3}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                  'hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReject}
                disabled={isLoading}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg',
                  'bg-red-600 text-white hover:bg-red-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {activeAction === 'reject' && isLoading ? 'Rejecting...' : 'Reject All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Compact bulk selection checkbox
 */
export function BulkSelectCheckbox({
  checked,
  indeterminate,
  onChange,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'flex items-center justify-center w-5 h-5 rounded border-2 transition-colors',
        checked || indeterminate
          ? 'border-blue-500 bg-blue-500'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
        'hover:border-blue-400',
        className
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 10">
          <path
            fillRule="evenodd"
            d="M10.293.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L4 6.586l6.293-6.293z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {indeterminate && !checked && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 4">
          <rect width="12" height="4" rx="1" />
        </svg>
      )}
    </button>
  );
}
