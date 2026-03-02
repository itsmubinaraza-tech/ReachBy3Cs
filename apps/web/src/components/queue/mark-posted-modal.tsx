'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MarkPostedModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (externalUrl?: string) => Promise<void>;
  isLoading?: boolean;
}

export function MarkPostedModal({
  open,
  onClose,
  onConfirm,
  isLoading = false,
}: MarkPostedModalProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    setError(null);

    // Validate URL if provided
    if (url.trim()) {
      try {
        new URL(url.trim());
      } catch {
        setError('Please enter a valid URL');
        return;
      }
    }

    await onConfirm(url.trim() || undefined);
    setUrl('');
  };

  const handleClose = () => {
    setUrl('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mark as Posted
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Confirm that you&apos;ve posted this response
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="mb-6">
          <label
            htmlFor="posted-url"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Posted URL (optional)
          </label>
          <input
            id="posted-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://reddit.com/r/relationships/comments/..."
            className={cn(
              'w-full px-3 py-2 border rounded-md shadow-sm',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'dark:bg-gray-700 dark:text-white',
              error
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600'
            )}
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Adding the URL helps track conversations for follow-ups
          </p>
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
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
                Confirming...
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
