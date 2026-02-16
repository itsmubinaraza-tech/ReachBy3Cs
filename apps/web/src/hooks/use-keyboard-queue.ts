'use client';

import { useCallback } from 'react';
import { useKeyboardShortcuts } from './use-keyboard-shortcuts';

export interface UseKeyboardQueueOptions {
  // Navigation
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  // Actions
  onApprove: () => void;
  onReject: () => void;
  onEdit: () => void;
  // Modals / Views
  onOpenDetail: () => void;
  onCloseModal: () => void;
  // Bulk actions
  onBulkApprove?: () => void;
  onToggleSelect?: () => void;
  onSelectAll?: () => void;
  // State
  enabled?: boolean;
}

/**
 * Keyboard shortcuts specifically for the queue interface
 *
 * Shortcuts:
 * - j / ArrowDown: Navigate to next item
 * - k / ArrowUp: Navigate to previous item
 * - a: Approve current item
 * - r: Reject current item
 * - e: Edit current item
 * - Enter: Open detail view
 * - Escape: Close modal / go back
 * - Shift+A: Bulk approve selected items
 * - Space: Toggle selection of current item
 * - Ctrl/Cmd+A: Select all items
 */
export function useKeyboardQueue(options: UseKeyboardQueueOptions) {
  const {
    onNavigateNext,
    onNavigatePrevious,
    onApprove,
    onReject,
    onEdit,
    onOpenDetail,
    onCloseModal,
    onBulkApprove,
    onToggleSelect,
    onSelectAll,
    enabled = true,
  } = options;

  // Wrap handlers to check enabled state
  const wrapHandler = useCallback(
    (handler: () => void) => () => {
      if (enabled) {
        handler();
      }
    },
    [enabled]
  );

  useKeyboardShortcuts([
    // Navigation - j/k and arrow keys
    {
      key: 'j',
      callback: wrapHandler(onNavigateNext),
      description: 'Navigate to next item',
    },
    {
      key: 'ArrowDown',
      callback: wrapHandler(onNavigateNext),
      description: 'Navigate to next item',
    },
    {
      key: 'k',
      callback: wrapHandler(onNavigatePrevious),
      description: 'Navigate to previous item',
    },
    {
      key: 'ArrowUp',
      callback: wrapHandler(onNavigatePrevious),
      description: 'Navigate to previous item',
    },

    // Actions
    {
      key: 'a',
      callback: wrapHandler(onApprove),
      description: 'Approve current item',
    },
    {
      key: 'r',
      callback: wrapHandler(onReject),
      description: 'Reject current item',
    },
    {
      key: 'e',
      callback: wrapHandler(onEdit),
      description: 'Edit current item',
    },

    // Modal / View controls
    {
      key: 'Enter',
      callback: wrapHandler(onOpenDetail),
      description: 'Open detail view',
    },
    {
      key: 'Escape',
      callback: wrapHandler(onCloseModal),
      description: 'Close modal / go back',
    },

    // Bulk actions
    ...(onBulkApprove
      ? [
          {
            key: 'a',
            modifiers: { shift: true } as const,
            callback: wrapHandler(onBulkApprove),
            description: 'Bulk approve selected items',
          },
        ]
      : []),

    // Selection
    ...(onToggleSelect
      ? [
          {
            key: ' ',
            callback: wrapHandler(onToggleSelect),
            description: 'Toggle selection of current item',
            preventDefault: true,
          },
        ]
      : []),
    ...(onSelectAll
      ? [
          {
            key: 'a',
            modifiers: { ctrl: true } as const,
            callback: wrapHandler(onSelectAll),
            description: 'Select all items',
          },
        ]
      : []),
  ]);
}

/**
 * Helper hook for getting keyboard shortcut hints
 */
export function useKeyboardHints() {
  return {
    navigation: [
      { key: 'j', description: 'Next item' },
      { key: 'k', description: 'Previous item' },
    ],
    actions: [
      { key: 'a', description: 'Approve' },
      { key: 'r', description: 'Reject' },
      { key: 'e', description: 'Edit' },
    ],
    views: [
      { key: 'Enter', description: 'Open details' },
      { key: 'Esc', description: 'Close / Back' },
    ],
    bulk: [
      { key: 'Space', description: 'Toggle select' },
      { key: 'Shift+A', description: 'Bulk approve' },
    ],
  };
}
