'use client';

import { useState } from 'react';
import { cn, formatRelativeTime, getRiskColor, getCTAColor, formatScore, formatPlatformName } from '@/lib/utils';
import type { QueueItemDisplay } from 'shared-types';

interface QueueItemCardProps {
  item: QueueItemDisplay;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (id: string) => void;
}

export function QueueItemCard({ item, onApprove, onReject, onEdit }: QueueItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(item.responses.selected);
  const [selectedType, setSelectedType] = useState(item.responses.selectedType);

  const responseOptions = [
    { type: 'value_first' as const, label: 'Value First', content: item.responses.valueFirst },
    { type: 'soft_cta' as const, label: 'Soft CTA', content: item.responses.softCta },
    { type: 'contextual' as const, label: 'Contextual', content: item.responses.contextual },
  ].filter((opt) => opt.content);

  const handleResponseSelect = (type: typeof selectedType, content: string) => {
    setSelectedType(type);
    setSelectedResponse(content);
  };

  const getPlatformColor = (slug: string) => {
    const colors: Record<string, string> = {
      reddit: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
      twitter: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
      quora: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      linkedin: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30',
      google: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    };
    return colors[slug] || 'text-gray-600 bg-gray-100 dark:bg-gray-700';
  };

  const getCTSColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Platform Badge */}
          <span
            className={cn(
              'px-2 py-1 rounded-md text-xs font-medium',
              getPlatformColor(item.original.platform.slug)
            )}
          >
            {formatPlatformName(item.original.platform.slug)}
          </span>

          {/* Risk Level Badge */}
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', getRiskColor(item.analysis.riskLevel))}>
            {item.analysis.riskLevel.charAt(0).toUpperCase() + item.analysis.riskLevel.slice(1)} Risk
          </span>

          {/* CTA Level Badge */}
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', getCTAColor(item.metrics.ctaLevel))}>
            CTA Level {item.metrics.ctaLevel}
          </span>

          {/* CTS Score Badge */}
          <span className={cn('px-2 py-1 rounded-md text-xs font-medium', getCTSColor(item.metrics.ctsScore))}>
            CTS: {formatScore(item.metrics.ctsScore)}
          </span>

          {/* Auto-post Indicator */}
          {item.metrics.canAutoPost && (
            <span className="px-2 py-1 rounded-md text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30">
              Auto-post Ready
            </span>
          )}

          {/* Timestamp */}
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {formatRelativeTime(item.original.detectedAt)}
          </span>
        </div>

        {/* Author */}
        {item.original.authorHandle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            From: <span className="font-medium">{item.original.authorHandle}</span>
          </p>
        )}

        {/* Cluster */}
        {item.cluster && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Community: <span className="font-medium">{item.cluster.name}</span> ({item.cluster.memberCount.toLocaleString()} members)
          </p>
        )}
      </div>

      {/* Original Post */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Original Post
        </h4>
        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{item.original.content}</p>
        <a
          href={item.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View original
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* AI Response */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            AI Response
          </h4>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show response options'}
          </button>
        </div>

        {/* Response Options (expanded) */}
        {isExpanded && (
          <div className="mb-4 space-y-2">
            {responseOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleResponseSelect(option.type, option.content!)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedType === option.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}
              >
                <span
                  className={cn(
                    'inline-block px-2 py-0.5 rounded text-xs font-medium mb-2',
                    selectedType === option.type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {option.label}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{option.content}</p>
              </button>
            ))}
          </div>
        )}

        {/* Selected Response */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{selectedResponse}</p>
        </div>

        {/* Analysis Details (collapsed by default) */}
        {isExpanded && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Analysis Details
            </h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Category:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {item.analysis.problemCategory || 'Uncategorized'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Emotional Intensity:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {Math.round(item.analysis.emotionalIntensity * 100)}%
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Keywords:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">{item.analysis.keywords.join(', ')}</span>
              </div>
              {item.analysis.riskFactors.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">Risk Factors:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">{item.analysis.riskFactors.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onApprove(item.id)}
            className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(item.id)}
            className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => onEdit(item.id)}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
