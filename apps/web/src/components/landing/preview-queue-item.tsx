'use client';

import { Copy, Edit2, CheckCircle, ExternalLink } from 'lucide-react';
import { PreviewQueueItem } from '@/lib/landing/mock-preview-data';

interface PreviewQueueItemCardProps {
  item: PreviewQueueItem;
  onCopy?: () => void;
  onEdit?: () => void;
  onMarkPosted?: () => void;
}

const platformColors = {
  reddit: { bg: 'bg-orange-100', text: 'text-orange-600', letter: 'R' },
  quora: { bg: 'bg-red-100', text: 'text-red-600', letter: 'Q' },
  twitter: { bg: 'bg-blue-100', text: 'text-blue-600', letter: 'X' },
  linkedin: { bg: 'bg-blue-100', text: 'text-blue-700', letter: 'in' },
};

export function PreviewQueueItemCard({
  item,
  onCopy,
  onEdit,
  onMarkPosted,
}: PreviewQueueItemCardProps) {
  const platformStyle = platformColors[item.platform];

  const handleCopy = () => {
    if (item.response) {
      navigator.clipboard.writeText(item.response);
    }
    onCopy?.();
  };

  const handleOpenOriginal = () => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-8 h-8 ${platformStyle.bg} rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <span className={`${platformStyle.text} text-xs font-bold`}>
            {platformStyle.letter}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.subreddit && (
              <span className="text-xs text-gray-500">{item.subreddit}</span>
            )}
            <span className="text-xs text-gray-400">{item.createdAt}</span>
          </div>
          <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
            {item.title}
          </h4>
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{item.content}</p>

      {/* Response Preview (if available) */}
      {item.response && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-600 font-medium mb-1">AI Response:</p>
          <p className="text-xs text-gray-700 line-clamp-2">{item.response}</p>
        </div>
      )}

      {/* Engagement Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        {item.engagement.upvotes !== undefined && (
          <span>{item.engagement.upvotes} upvotes</span>
        )}
        {item.engagement.comments !== undefined && (
          <span>{item.engagement.comments} comments</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
        >
          <Edit2 className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={handleOpenOriginal}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </button>
        <button
          onClick={onMarkPosted}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition ml-auto"
        >
          <CheckCircle className="w-3 h-3" />
          Posted
        </button>
      </div>
    </div>
  );
}
