'use client';

import { useState, useMemo, useCallback } from 'react';
import { QueueFilters, QueueList, type FilterType } from '@/components/queue';
import { mockQueueItems } from '@/lib/mock-data';
import type { QueueItemDisplay } from 'shared-types';

export default function QueuePage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [queueItems, setQueueItems] = useState<QueueItemDisplay[]>(mockQueueItems);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Filter counts
  const counts = useMemo(() => {
    const pending = queueItems.filter((item) => item.status === 'pending');
    return {
      all: pending.length,
      lowRisk: pending.filter((item) => item.analysis.riskLevel === 'low').length,
      highCts: pending.filter((item) => item.metrics.ctsScore >= 0.8).length,
      needsReview: pending.filter(
        (item) => !item.metrics.canAutoPost || item.analysis.riskLevel === 'high' || item.analysis.riskLevel === 'blocked'
      ).length,
    };
  }, [queueItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    const pending = queueItems.filter((item) => item.status === 'pending');

    switch (activeFilter) {
      case 'low-risk':
        return pending.filter((item) => item.analysis.riskLevel === 'low');
      case 'high-cts':
        return pending.filter((item) => item.metrics.ctsScore >= 0.8);
      case 'needs-review':
        return pending.filter(
          (item) => !item.metrics.canAutoPost || item.analysis.riskLevel === 'high' || item.analysis.riskLevel === 'blocked'
        );
      default:
        return pending;
    }
  }, [queueItems, activeFilter]);

  // Show notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // Handle approve
  const handleApprove = useCallback(
    (id: string) => {
      setQueueItems((items) =>
        items.map((item) => (item.id === id ? { ...item, status: 'approved' as const } : item))
      );
      showNotification('success', 'Response approved successfully!');
    },
    [showNotification]
  );

  // Handle reject
  const handleReject = useCallback(
    (id: string) => {
      setQueueItems((items) =>
        items.map((item) => (item.id === id ? { ...item, status: 'rejected' as const } : item))
      );
      showNotification('success', 'Response rejected.');
    },
    [showNotification]
  );

  // Handle edit (placeholder)
  const handleEdit = useCallback(
    (id: string) => {
      showNotification('success', `Opening editor for item ${id}...`);
      // In a real app, this would open an edit modal
    },
    [showNotification]
  );

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
              <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Refresh
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Bulk Actions
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <QueueFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />
      </div>

      {/* Queue List */}
      <div className="max-w-4xl mx-auto">
        <QueueList
          items={filteredItems}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
        />
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-20 lg:bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all transform z-50 ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
