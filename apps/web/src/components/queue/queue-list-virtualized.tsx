'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { ResponseCard } from './response-card';
import { ResponseCardCompact } from './response-card-compact';
import type { QueueItemDisplay, ResponseType } from 'shared-types';

interface QueueListVirtualizedProps {
  items: QueueItemDisplay[];
  selectedIds: Set<string>;
  focusedIndex: number;
  viewMode: 'full' | 'compact';
  showCheckboxes: boolean;
  onItemSelect: (id: string) => void;
  onItemFocus: (index: number) => void;
  onApprove: (id: string, selectedType?: ResponseType) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onItemClick?: (id: string) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  isLoading?: boolean;
  className?: string;
}

const ITEM_HEIGHT_FULL = 500; // Approximate height for full cards
const ITEM_HEIGHT_COMPACT = 150; // Approximate height for compact cards
const OVERSCAN = 3; // Number of items to render outside viewport

export function QueueListVirtualized({
  items,
  selectedIds,
  focusedIndex,
  viewMode,
  showCheckboxes,
  onItemSelect,
  onItemFocus,
  onApprove,
  onReject,
  onEdit,
  onItemClick,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  className,
}: QueueListVirtualizedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const itemHeight = viewMode === 'full' ? ITEM_HEIGHT_FULL : ITEM_HEIGHT_COMPACT;
  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - OVERSCAN);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + OVERSCAN
  );

  const visibleItems = items.slice(startIndex, endIndex);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);

      // Check for infinite scroll trigger
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (
        hasMore &&
        !isLoading &&
        onLoadMore &&
        scrollHeight - scrollTop - clientHeight < 200
      ) {
        onLoadMore();
      }
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Setup resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    setContainerHeight(container.clientHeight);

    return () => observer.disconnect();
  }, []);

  // Scroll to focused item
  useEffect(() => {
    if (containerRef.current && focusedIndex >= 0) {
      const targetTop = focusedIndex * itemHeight;
      const containerScrollTop = containerRef.current.scrollTop;
      const containerClientHeight = containerRef.current.clientHeight;

      // Check if item is outside visible area
      if (targetTop < containerScrollTop) {
        containerRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
      } else if (targetTop + itemHeight > containerScrollTop + containerClientHeight) {
        containerRef.current.scrollTo({
          top: targetTop - containerClientHeight + itemHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [focusedIndex, itemHeight]);

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No items in queue
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          All pending responses have been reviewed. New items will appear here as they are detected.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      onScroll={handleScroll}
      style={{ height: '100%' }}
    >
      {/* Virtual container with total height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items */}
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const isSelected = selectedIds.has(item.id);
          const isFocused = actualIndex === focusedIndex;

          return (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
                padding: '0.5rem 1rem',
              }}
            >
              {viewMode === 'full' ? (
                <ResponseCard
                  item={item}
                  isSelected={isSelected}
                  isFocused={isFocused}
                  showCheckbox={showCheckboxes}
                  onSelect={() => onItemSelect(item.id)}
                  onApprove={onApprove}
                  onReject={onReject}
                  onEdit={onEdit}
                  onClick={onItemClick ? () => onItemClick(item.id) : undefined}
                />
              ) : (
                <ResponseCardCompact
                  item={item}
                  isSelected={isSelected}
                  isFocused={isFocused}
                  showCheckbox={showCheckboxes}
                  onSelect={() => onItemSelect(item.id)}
                  onApprove={(id) => onApprove(id)}
                  onReject={onReject}
                  onClick={onItemClick ? () => onItemClick(item.id) : undefined}
                />
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '2rem',
            }}
            className="flex justify-center"
          >
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
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
              <span>Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Non-virtualized version for smaller lists (< 50 items)
 * Better for accessibility and simpler DOM
 */
export function QueueListSimple({
  items,
  selectedIds,
  focusedIndex,
  viewMode,
  showCheckboxes,
  onItemSelect,
  onApprove,
  onReject,
  onEdit,
  onItemClick,
  isLoading = false,
  className,
}: Omit<QueueListVirtualizedProps, 'onItemFocus' | 'onLoadMore' | 'hasMore'>) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll focused item into view
  useEffect(() => {
    if (listRef.current && focusedIndex >= 0) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      focusedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No items in queue
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          All pending responses have been reviewed. New items will appear here as they are detected.
        </p>
      </div>
    );
  }

  return (
    <div ref={listRef} className={cn('p-4 space-y-4', className)}>
      {items.map((item, index) => {
        const isSelected = selectedIds.has(item.id);
        const isFocused = index === focusedIndex;

        return viewMode === 'full' ? (
          <ResponseCard
            key={item.id}
            item={item}
            isSelected={isSelected}
            isFocused={isFocused}
            showCheckbox={showCheckboxes}
            onSelect={() => onItemSelect(item.id)}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            onClick={onItemClick ? () => onItemClick(item.id) : undefined}
          />
        ) : (
          <ResponseCardCompact
            key={item.id}
            item={item}
            isSelected={isSelected}
            isFocused={isFocused}
            showCheckbox={showCheckboxes}
            onSelect={() => onItemSelect(item.id)}
            onApprove={(id) => onApprove(id)}
            onReject={onReject}
            onClick={onItemClick ? () => onItemClick(item.id) : undefined}
          />
        );
      })}

      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
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
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}
