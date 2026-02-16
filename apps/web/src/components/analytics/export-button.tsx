'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface ExportButtonProps {
  onExport: (format: 'csv' | 'json') => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({ onExport, disabled = false, className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    setIsOpen(false);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
          'hover:bg-gray-200 dark:hover:bg-gray-600',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-1">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Export as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
