'use client';

import { useEffect, useCallback, useRef } from 'react';

type KeyModifiers = {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

type KeyboardShortcut = {
  key: string;
  modifiers?: KeyModifiers;
  callback: () => void;
  description?: string;
  preventDefault?: boolean;
};

/**
 * Hook to handle keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input, textarea, or contenteditable
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.modifiers?.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const altMatch = shortcut.modifiers?.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.modifiers?.shift ? event.shiftKey : !event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.callback();
        break;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Common queue navigation shortcuts
 */
export function useQueueShortcuts(handlers: {
  onNext?: () => void;
  onPrevious?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onExpand?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onNext) {
    shortcuts.push({
      key: 'j',
      callback: handlers.onNext,
      description: 'Next item',
    });
    shortcuts.push({
      key: 'ArrowDown',
      callback: handlers.onNext,
      description: 'Next item',
    });
  }

  if (handlers.onPrevious) {
    shortcuts.push({
      key: 'k',
      callback: handlers.onPrevious,
      description: 'Previous item',
    });
    shortcuts.push({
      key: 'ArrowUp',
      callback: handlers.onPrevious,
      description: 'Previous item',
    });
  }

  if (handlers.onApprove) {
    shortcuts.push({
      key: 'a',
      callback: handlers.onApprove,
      description: 'Approve',
    });
  }

  if (handlers.onReject) {
    shortcuts.push({
      key: 'r',
      callback: handlers.onReject,
      description: 'Reject',
    });
  }

  if (handlers.onEdit) {
    shortcuts.push({
      key: 'e',
      callback: handlers.onEdit,
      description: 'Edit',
    });
  }

  if (handlers.onExpand) {
    shortcuts.push({
      key: 'Enter',
      callback: handlers.onExpand,
      description: 'Expand/collapse',
    });
  }

  useKeyboardShortcuts(shortcuts);
}

/**
 * Navigation shortcuts
 */
export function useNavigationShortcuts(handlers: {
  onGoToDashboard?: () => void;
  onGoToQueue?: () => void;
  onGoToAnalytics?: () => void;
  onGoToCommunities?: () => void;
  onGoToSettings?: () => void;
  onToggleSidebar?: () => void;
  onSearch?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  if (handlers.onGoToDashboard) {
    shortcuts.push({
      key: 'h',
      modifiers: { shift: true },
      callback: handlers.onGoToDashboard,
      description: 'Go to dashboard',
    });
  }

  if (handlers.onGoToQueue) {
    shortcuts.push({
      key: 'q',
      modifiers: { shift: true },
      callback: handlers.onGoToQueue,
      description: 'Go to queue',
    });
  }

  if (handlers.onGoToAnalytics) {
    shortcuts.push({
      key: 'a',
      modifiers: { shift: true },
      callback: handlers.onGoToAnalytics,
      description: 'Go to analytics',
    });
  }

  if (handlers.onGoToCommunities) {
    shortcuts.push({
      key: 'c',
      modifiers: { shift: true },
      callback: handlers.onGoToCommunities,
      description: 'Go to communities',
    });
  }

  if (handlers.onGoToSettings) {
    shortcuts.push({
      key: 's',
      modifiers: { shift: true },
      callback: handlers.onGoToSettings,
      description: 'Go to settings',
    });
  }

  if (handlers.onToggleSidebar) {
    shortcuts.push({
      key: 'b',
      modifiers: { ctrl: true },
      callback: handlers.onToggleSidebar,
      description: 'Toggle sidebar',
    });
  }

  if (handlers.onSearch) {
    shortcuts.push({
      key: 'k',
      modifiers: { ctrl: true },
      callback: handlers.onSearch,
      description: 'Search',
    });
    shortcuts.push({
      key: '/',
      callback: handlers.onSearch,
      description: 'Search',
    });
  }

  useKeyboardShortcuts(shortcuts);
}
