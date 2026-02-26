'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useDeviceType } from '@/hooks';
import { useKeyboardQueue, useKeyboardHints } from '@/hooks/use-keyboard-queue';
import { useRealtimeQueue } from '@/hooks/use-realtime-queue';
import { useQueue } from '@/hooks/use-queue';
import { cn } from '@/lib/utils';
import {
  QueueFilters,
  QueueFiltersAdvanced,
  QueueListSimple,
  ResponseCard,
  ResponseEditor,
  BulkActions,
  type FilterType,
} from '@/components/queue';
import { approveResponse, rejectResponse, editResponse, bulkApprove, bulkReject } from '@/lib/queue/actions';
import { mockQueueItems } from '@/lib/mock-data';
import type { QueueItemDisplay, ResponseType, RiskLevel, DeviceType as DeviceTypeEnum } from 'shared-types';

// Use real Supabase data - set to true for demo mode with mock data
const USE_MOCK_DATA = false;

// Map device type hook output to database enum
function mapDeviceType(type: 'mobile' | 'tablet' | 'desktop'): DeviceTypeEnum {
  switch (type) {
    case 'mobile':
      return 'mobile_ios';
    case 'tablet':
      return 'tablet';
    default:
      return 'web';
  }
}

export default function QueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const deviceInfo = useDeviceType();

  // View state
  const [viewMode, setViewMode] = useState<'full' | 'compact'>('full');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced filters
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | null>(null);
  const [minCtsScore, setMinCtsScore] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });

  // Queue data - use real data from Supabase or mock data for demo
  const {
    items: supabaseItems,
    isLoading: supabaseLoading,
    error: supabaseError,
    refresh: refreshQueue,
    counts: supabaseCounts,
  } = useQueue();

  // State for local queue management (for optimistic updates)
  const [localQueueItems, setLocalQueueItems] = useState<QueueItemDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we should use mock data (either flag is set or user is not authenticated)
  const shouldUseMockData = USE_MOCK_DATA || (!user && supabaseError);

  // Sync supabase items to local state
  useEffect(() => {
    if (shouldUseMockData) {
      setLocalQueueItems(mockQueueItems);
    } else if (supabaseItems.length > 0 || !supabaseLoading) {
      setLocalQueueItems(supabaseItems);
    }
  }, [supabaseItems, supabaseLoading, shouldUseMockData]);

  // Use appropriate data source
  const queueItems = shouldUseMockData ? mockQueueItems : localQueueItems;
  const setQueueItems = setLocalQueueItems;

  // Selection and focus state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Editor state
  const [editingItem, setEditingItem] = useState<QueueItemDisplay | null>(null);

  // Action state
  const [isActioning, setIsActioning] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Filter counts
  const counts = useMemo(() => {
    const pending = queueItems.filter((item) => item.status === 'pending');
    return {
      all: pending.length,
      lowRisk: pending.filter((item) => item.analysis.riskLevel === 'low').length,
      highCts: pending.filter((item) => item.metrics.ctsScore >= 0.8).length,
      needsReview: pending.filter(
        (item) =>
          !item.metrics.canAutoPost ||
          item.analysis.riskLevel === 'high' ||
          item.analysis.riskLevel === 'blocked'
      ).length,
    };
  }, [queueItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = queueItems.filter((item) => item.status === 'pending');

    // Apply tab filter
    switch (activeFilter) {
      case 'low-risk':
        items = items.filter((item) => item.analysis.riskLevel === 'low');
        break;
      case 'high-cts':
        items = items.filter((item) => item.metrics.ctsScore >= 0.8);
        break;
      case 'needs-review':
        items = items.filter(
          (item) =>
            !item.metrics.canAutoPost ||
            item.analysis.riskLevel === 'high' ||
            item.analysis.riskLevel === 'blocked'
        );
        break;
    }

    // Apply advanced filters
    if (selectedPlatform) {
      items = items.filter((item) => item.original.platform.id === selectedPlatform);
    }
    if (selectedRiskLevel) {
      items = items.filter((item) => item.analysis.riskLevel === selectedRiskLevel);
    }
    if (minCtsScore !== null) {
      items = items.filter((item) => item.metrics.ctsScore >= minCtsScore);
    }
    if (dateRange.from) {
      items = items.filter((item) => new Date(item.createdAt) >= new Date(dateRange.from!));
    }
    if (dateRange.to) {
      items = items.filter((item) => new Date(item.createdAt) <= new Date(dateRange.to!));
    }

    return items;
  }, [queueItems, activeFilter, selectedPlatform, selectedRiskLevel, minCtsScore, dateRange]);

  // Current focused item
  const focusedItem = filteredItems[focusedIndex];

  // Handle item selection
  const handleItemSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all visible items
  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  }, [filteredItems]);

  // Deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle selection of focused item
  const handleToggleSelect = useCallback(() => {
    if (focusedItem) {
      handleItemSelect(focusedItem.id);
    }
  }, [focusedItem, handleItemSelect]);

  // Navigate to next item
  const handleNavigateNext = useCallback(() => {
    setFocusedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
  }, [filteredItems.length]);

  // Navigate to previous item
  const handleNavigatePrevious = useCallback(() => {
    setFocusedIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Handle approve
  const handleApprove = useCallback(
    async (id: string, selectedType?: ResponseType) => {
      if (isActioning) return;

      setIsActioning(true);
      try {
        if (shouldUseMockData) {
          // Optimistic update for mock data
          setQueueItems((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: 'approved' as const } : item
            )
          );
          showNotification('success', 'Response approved successfully!');
        } else {
          const result = await approveResponse(
            id,
            mapDeviceType(deviceInfo.type),
            selectedType
          );

          if (result.success) {
            setQueueItems((items) =>
              items.map((item) =>
                item.id === id ? { ...item, status: 'approved' as const } : item
              )
            );
            showNotification('success', 'Response approved successfully!');
          } else {
            showNotification('error', result.error || 'Failed to approve');
          }
        }
      } finally {
        setIsActioning(false);
      }
    },
    [deviceInfo.type, showNotification, isActioning]
  );

  // Handle reject
  const handleReject = useCallback(
    async (id: string) => {
      if (isActioning) return;

      setIsActioning(true);
      try {
        if (shouldUseMockData) {
          setQueueItems((items) =>
            items.map((item) =>
              item.id === id ? { ...item, status: 'rejected' as const } : item
            )
          );
          showNotification('success', 'Response rejected.');
        } else {
          const result = await rejectResponse(id, null, mapDeviceType(deviceInfo.type));

          if (result.success) {
            setQueueItems((items) =>
              items.map((item) =>
                item.id === id ? { ...item, status: 'rejected' as const } : item
              )
            );
            showNotification('success', 'Response rejected.');
          } else {
            showNotification('error', result.error || 'Failed to reject');
          }
        }
      } finally {
        setIsActioning(false);
      }
    },
    [deviceInfo.type, showNotification, isActioning]
  );

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    const item = queueItems.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
    }
  }, [queueItems]);

  // Handle edit save
  const handleEditSave = useCallback(
    async (newText: string) => {
      if (!editingItem) return;

      if (shouldUseMockData) {
        setQueueItems((items) =>
          items.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  status: 'edited' as const,
                  responses: { ...item.responses, selected: newText },
                }
              : item
          )
        );
        showNotification('success', 'Response edited and approved!');
      } else {
        const result = await editResponse(
          editingItem.id,
          newText,
          mapDeviceType(deviceInfo.type)
        );

        if (result.success) {
          setQueueItems((items) =>
            items.map((item) =>
              item.id === editingItem.id
                ? {
                    ...item,
                    status: 'edited' as const,
                    responses: { ...item.responses, selected: newText },
                  }
                : item
            )
          );
          showNotification('success', 'Response edited and approved!');
        } else {
          throw new Error(result.error || 'Failed to save edit');
        }
      }
    },
    [editingItem, deviceInfo.type, showNotification]
  );

  // Handle bulk approve
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0 || isActioning) return;

    setIsActioning(true);
    try {
      const ids = Array.from(selectedIds);

      if (shouldUseMockData) {
        setQueueItems((items) =>
          items.map((item) =>
            selectedIds.has(item.id) ? { ...item, status: 'approved' as const } : item
          )
        );
        setSelectedIds(new Set());
        showNotification('success', `${ids.length} responses approved!`);
      } else {
        const result = await bulkApprove(ids, mapDeviceType(deviceInfo.type));

        if (result.success) {
          setQueueItems((items) =>
            items.map((item) =>
              selectedIds.has(item.id) ? { ...item, status: 'approved' as const } : item
            )
          );
          setSelectedIds(new Set());
          showNotification('success', `${result.successCount} responses approved!`);
        } else {
          showNotification('error', result.error || 'Failed to bulk approve');
        }
      }
    } finally {
      setIsActioning(false);
    }
  }, [selectedIds, deviceInfo.type, showNotification, isActioning]);

  // Handle bulk reject
  const handleBulkReject = useCallback(
    async (reason?: string) => {
      if (selectedIds.size === 0 || isActioning) return;

      setIsActioning(true);
      try {
        const ids = Array.from(selectedIds);

        if (shouldUseMockData) {
          setQueueItems((items) =>
            items.map((item) =>
              selectedIds.has(item.id) ? { ...item, status: 'rejected' as const } : item
            )
          );
          setSelectedIds(new Set());
          showNotification('success', `${ids.length} responses rejected.`);
        } else {
          const result = await bulkReject(ids, reason || null, mapDeviceType(deviceInfo.type));

          if (result.success) {
            setQueueItems((items) =>
              items.map((item) =>
                selectedIds.has(item.id) ? { ...item, status: 'rejected' as const } : item
              )
            );
            setSelectedIds(new Set());
            showNotification('success', `${result.successCount} responses rejected.`);
          } else {
            showNotification('error', result.error || 'Failed to bulk reject');
          }
        }
      } finally {
        setIsActioning(false);
      }
    },
    [selectedIds, deviceInfo.type, showNotification, isActioning]
  );

  // Handle item click to open detail
  const handleItemClick = useCallback(
    (id: string) => {
      router.push(`/dashboard/queue/${id}`);
    },
    [router]
  );

  // Handle approve current (keyboard)
  const handleApproveCurrent = useCallback(() => {
    if (focusedItem) {
      handleApprove(focusedItem.id);
    }
  }, [focusedItem, handleApprove]);

  // Handle reject current (keyboard)
  const handleRejectCurrent = useCallback(() => {
    if (focusedItem) {
      handleReject(focusedItem.id);
    }
  }, [focusedItem, handleReject]);

  // Handle edit current (keyboard)
  const handleEditCurrent = useCallback(() => {
    if (focusedItem) {
      handleEdit(focusedItem.id);
    }
  }, [focusedItem, handleEdit]);

  // Handle open detail (keyboard)
  const handleOpenDetail = useCallback(() => {
    if (focusedItem) {
      handleItemClick(focusedItem.id);
    }
  }, [focusedItem, handleItemClick]);

  // Handle close modal (keyboard)
  const handleCloseModal = useCallback(() => {
    if (editingItem) {
      setEditingItem(null);
    }
  }, [editingItem]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (shouldUseMockData) {
      showNotification('success', 'Queue refreshed');
    } else {
      await refreshQueue();
      showNotification('success', 'Queue refreshed');
    }
  }, [showNotification, refreshQueue]);

  // Keyboard shortcuts
  useKeyboardQueue({
    onNavigateNext: handleNavigateNext,
    onNavigatePrevious: handleNavigatePrevious,
    onApprove: handleApproveCurrent,
    onReject: handleRejectCurrent,
    onEdit: handleEditCurrent,
    onOpenDetail: handleOpenDetail,
    onCloseModal: handleCloseModal,
    onBulkApprove: selectedIds.size > 0 ? handleBulkApprove : undefined,
    onToggleSelect: handleToggleSelect,
    onSelectAll: handleSelectAll,
    enabled: !editingItem,
  });

  // Realtime updates
  useRealtimeQueue({
    onInsert: (change) => {
      // Handle new queue items
      showNotification('success', 'New item added to queue');
    },
    onUpdate: (change) => {
      // Handle item updates
      setQueueItems((items) =>
        items.map((item) =>
          item.id === change.id ? { ...item, ...(change.data as Partial<QueueItemDisplay>) } : item
        )
      );
    },
    enabled: !shouldUseMockData,
  });

  // Reset focused index when filter changes
  useEffect(() => {
    setFocusedIndex(0);
  }, [activeFilter, selectedPlatform, selectedRiskLevel, minCtsScore, dateRange]);

  // Get keyboard hints
  const keyboardHints = useKeyboardHints();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Review Queue
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {counts.all} pending {counts.all === 1 ? 'response' : 'responses'} to review
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View mode toggle */}
              <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('full')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    viewMode === 'full'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  Full
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    viewMode === 'compact'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  Compact
                </button>
              </div>

              <button
                onClick={handleRefresh}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  showAdvancedFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showAdvancedFilters ? (
          <QueueFiltersAdvanced
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
            selectedRiskLevel={selectedRiskLevel}
            onRiskLevelChange={setSelectedRiskLevel}
            minCtsScore={minCtsScore}
            onMinCtsScoreChange={setMinCtsScore}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        ) : (
          <QueueFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <BulkActions
            selectedCount={selectedIds.size}
            totalCount={filteredItems.length}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            isLoading={isActioning}
          />
        </div>
      )}

      {/* Error Banner */}
      {!shouldUseMockData && supabaseError && (
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-400">
              Error loading queue: {supabaseError}. Showing cached data.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {!shouldUseMockData && supabaseLoading && queueItems.length === 0 && (
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading queue...</p>
        </div>
      )}

      {/* Queue List */}
      <div className="max-w-4xl mx-auto">
        <QueueListSimple
          items={filteredItems}
          selectedIds={selectedIds}
          focusedIndex={focusedIndex}
          viewMode={viewMode}
          showCheckboxes={true}
          onItemSelect={handleItemSelect}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
          onItemClick={handleItemClick}
          isLoading={supabaseLoading}
        />
      </div>

      {/* Keyboard shortcuts legend (desktop only) */}
      <div className="hidden lg:block fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Keyboard Shortcuts
        </p>
        <div className="space-y-1">
          {keyboardHints.navigation.map((hint) => (
            <div key={hint.key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                {hint.key}
              </kbd>
              <span>{hint.description}</span>
            </div>
          ))}
          {keyboardHints.actions.map((hint) => (
            <div key={hint.key} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                {hint.key}
              </kbd>
              <span>{hint.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Response Editor Modal */}
      {editingItem && (
        <ResponseEditor
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditSave}
          originalResponse={editingItem.responses.selected}
          selectedType={editingItem.responses.selectedType}
          originalPost={{
            content: editingItem.original.content,
            platform: editingItem.original.platform.name,
            authorHandle: editingItem.original.authorHandle,
          }}
        />
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'fixed bottom-20 lg:bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all transform z-50',
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
