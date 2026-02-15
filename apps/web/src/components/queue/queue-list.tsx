'use client';

import { QueueItemCard } from './queue-item-card';
import type { QueueItemDisplay } from 'shared-types';

interface QueueListProps {
  items: QueueItemDisplay[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
}

export function QueueList({ items, onApprove, onReject, onEdit }: QueueListProps) {
  if (items.length === 0) {
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No items in queue</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          All pending responses have been reviewed. New items will appear here as they are detected.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {items.map((item) => (
        <QueueItemCard
          key={item.id}
          item={item}
          onApprove={onApprove}
          onReject={onReject}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
