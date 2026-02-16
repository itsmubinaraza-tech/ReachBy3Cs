'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { OriginalPost } from './original-post';
import { AIAnalysis } from './ai-analysis';
import { ResponseVariants, SelectedResponse } from './response-variants';
import { ResponseActions } from './response-actions';
import { ClusterInfo } from './cluster-info';
import { BulkSelectCheckbox } from './bulk-actions';
import type { QueueItemDisplay, ResponseType } from 'shared-types';

interface ResponseCardProps {
  item: QueueItemDisplay;
  isSelected?: boolean;
  isFocused?: boolean;
  showCheckbox?: boolean;
  onSelect?: () => void;
  onApprove: (id: string, selectedType?: ResponseType) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
  onClick?: () => void;
  className?: string;
}

export function ResponseCard({
  item,
  isSelected = false,
  isFocused = false,
  showCheckbox = false,
  onSelect,
  onApprove,
  onReject,
  onEdit,
  onClick,
  className,
}: ResponseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(item.responses.selected);
  const [selectedType, setSelectedType] = useState(item.responses.selectedType);
  const [isLoading, setIsLoading] = useState(false);

  const handleResponseSelect = useCallback(
    (type: ResponseType, content: string) => {
      setSelectedType(type);
      setSelectedResponse(content);
    },
    []
  );

  const handleApprove = useCallback(async () => {
    setIsLoading(true);
    try {
      await onApprove(item.id, selectedType);
    } finally {
      setIsLoading(false);
    }
  }, [item.id, selectedType, onApprove]);

  const handleReject = useCallback(async () => {
    setIsLoading(true);
    try {
      await onReject(item.id);
    } finally {
      setIsLoading(false);
    }
  }, [item.id, onReject]);

  const handleEdit = useCallback(() => {
    onEdit(item.id);
  }, [item.id, onEdit]);

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden transition-all',
        isFocused
          ? 'border-blue-500 ring-2 ring-blue-500/20'
          : 'border-gray-200 dark:border-gray-700',
        isSelected && 'bg-blue-50/50 dark:bg-blue-900/10',
        onClick && 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600',
        className
      )}
      onClick={onClick}
    >
      {/* Section: Original Post */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3 p-4">
          {/* Checkbox for bulk selection */}
          {showCheckbox && onSelect && (
            <div className="pt-1">
              <BulkSelectCheckbox checked={isSelected} onChange={onSelect} />
            </div>
          )}

          <div className="flex-1">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Original Post
            </h4>
            <OriginalPost
              platform={item.original.platform}
              content={item.original.content}
              authorHandle={item.original.authorHandle}
              url={item.original.url}
              detectedAt={item.original.detectedAt}
            />
          </div>
        </div>
      </div>

      {/* Section: AI Analysis */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            AI Analysis
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        </div>
        <AIAnalysis
          analysis={item.analysis}
          metrics={item.metrics}
          expanded={isExpanded}
        />
      </div>

      {/* Section: Cluster Info (if available) */}
      {item.cluster && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <ClusterInfo cluster={item.cluster} />
        </div>
      )}

      {/* Section: Responses */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Responses
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Hide variants' : 'Show all variants'}
          </button>
        </div>

        {/* Response variants or selected response */}
        {isExpanded ? (
          <ResponseVariants
            responses={item.responses}
            selectedType={selectedType}
            onSelect={handleResponseSelect}
            className="mb-4"
          />
        ) : (
          <SelectedResponse
            content={selectedResponse}
            type={selectedType}
            className="mb-4"
          />
        )}

        {/* Action Buttons */}
        <ResponseActions
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
