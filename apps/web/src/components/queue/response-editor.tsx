'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ResponseType } from 'shared-types';

interface ResponseEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newText: string) => Promise<void>;
  originalResponse: string;
  selectedType: ResponseType;
  originalPost: {
    content: string;
    platform: string;
    authorHandle: string | null;
  };
}

const typeLabels: Record<ResponseType, string> = {
  value_first: 'Value-First',
  soft_cta: 'Soft CTA',
  contextual: 'Contextual',
};

export function ResponseEditor({
  isOpen,
  onClose,
  onSave,
  originalResponse,
  selectedType,
  originalPost,
}: ResponseEditorProps) {
  const [editedText, setEditedText] = useState(originalResponse);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedText(originalResponse);
      setError(null);
      // Focus textarea after a brief delay for animation
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 100);
    }
  }, [isOpen, originalResponse]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!editedText.trim()) {
      setError('Response cannot be empty');
      return;
    }

    if (editedText === originalResponse) {
      setError('No changes made');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedText.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Ctrl/Cmd + Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen) {
    return null;
  }

  const hasChanges = editedText !== originalResponse;
  const charCount = editedText.length;
  const maxChars = 2000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Response
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Editing {typeLabels[selectedType]} response
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Original post reference */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Original Post
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {originalPost.content}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{originalPost.platform}</span>
              {originalPost.authorHandle && (
                <>
                  <span>|</span>
                  <span>{originalPost.authorHandle}</span>
                </>
              )}
            </div>
          </div>

          {/* Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Response
              </label>
              <span
                className={cn(
                  'text-xs',
                  charCount > maxChars
                    ? 'text-red-500'
                    : charCount > maxChars * 0.9
                    ? 'text-yellow-500'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              >
                {charCount} / {maxChars}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full h-48 px-4 py-3 border rounded-lg resize-none',
                'bg-white dark:bg-gray-900',
                'text-gray-900 dark:text-gray-100',
                'placeholder:text-gray-500 dark:placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error
                  ? 'border-red-500'
                  : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder="Write your response..."
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          {/* Original response (for reference) */}
          {hasChanges && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wider">
                  Original Response
                </h3>
                <button
                  onClick={() => setEditedText(originalResponse)}
                  className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                >
                  Restore original
                </button>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {originalResponse}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">Ctrl+Enter</kbd> to save
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-300 dark:hover:bg-gray-600',
                'transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges || charCount > maxChars}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg',
                'bg-blue-600 text-white hover:bg-blue-700',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors'
              )}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save & Approve'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
