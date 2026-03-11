'use client';

import { useState } from 'react';
import { Copy, Edit2, CheckCircle, ExternalLink, Save } from 'lucide-react';
import { PreviewQueueItem } from '@/lib/landing/mock-preview-data';
import { useTheme } from '@/contexts/theme-context';

interface PreviewQueueItemCardProps {
  item: PreviewQueueItem;
  onCopy?: () => void;
  onEdit?: (newResponse: string) => void;
  onMarkPosted?: () => void;
}

const platformColors = {
  reddit: { bg: 'bg-orange-500/20', text: 'text-orange-500', letter: 'R' },
  quora: { bg: 'bg-pink-500/20', text: 'text-pink-500', letter: 'Q' },
  twitter: { bg: 'bg-cyan-500/20', text: 'text-cyan-500', letter: 'X' },
  linkedin: { bg: 'bg-blue-600/20', text: 'text-blue-500', letter: 'in' },
  stackoverflow: { bg: 'bg-orange-500/20', text: 'text-orange-500', letter: 'SO' },
  hackernews: { bg: 'bg-orange-400/20', text: 'text-orange-400', letter: 'HN' },
};

export function PreviewQueueItemCard({
  item,
  onCopy,
  onEdit,
  onMarkPosted,
}: PreviewQueueItemCardProps) {
  const { theme, colors } = useTheme();
  const platformStyle = platformColors[item.platform];

  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState(item.response || '');

  const isNeon = theme === 'neon';
  const isDark = theme === 'dark' || isNeon;

  const handleCopy = () => {
    const textToCopy = isEditing ? editedResponse : item.response;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
    }
    onCopy?.();
  };

  const handleEditClick = () => {
    if (isEditing) {
      // Save the edited response
      onEdit?.(editedResponse);
      setIsEditing(false);
    } else {
      // Start editing
      setEditedResponse(item.response || '');
      setIsEditing(true);
    }
  };

  const handleOpenOriginal = () => {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  // Theme-aware styling
  const cardBg = isDark ? 'bg-white/5' : 'bg-white/40';
  const cardBorder = isDark ? 'border-white/10' : 'border-white/30';
  const cardHover = isDark ? 'hover:bg-white/10' : 'hover:bg-white/60';

  const responseBg = isNeon
    ? 'bg-fuchsia-500/10 border-fuchsia-500/30'
    : theme === 'dark'
    ? 'bg-cyan-500/10 border-cyan-500/30'
    : theme === 'earthy'
    ? 'bg-amber-500/10 border-amber-500/30'
    : theme === 'calm'
    ? 'bg-teal-500/10 border-teal-500/30'
    : 'bg-cyan-500/10 border-cyan-500/30';

  const responseLabelColor = isNeon
    ? 'text-fuchsia-400'
    : theme === 'dark'
    ? 'text-cyan-400'
    : theme === 'earthy'
    ? 'text-amber-600'
    : theme === 'calm'
    ? 'text-teal-600'
    : 'text-cyan-700';

  const buttonClass = isDark
    ? 'text-gray-300 bg-white/10 hover:bg-white/20 border-white/10'
    : 'text-gray-700 bg-white/50 hover:bg-white/70 border-white/30';

  const editButtonClass = isEditing
    ? isNeon
      ? 'text-white bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 border-lime-500/50'
      : 'text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-green-500/50'
    : buttonClass;

  const primaryButtonClass = isNeon
    ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 shadow-fuchsia-500/30'
    : theme === 'earthy'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
    : theme === 'calm'
    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-teal-500/30'
    : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-cyan-500/30';

  const textareaClass = isNeon
    ? 'bg-purple-900/50 border-fuchsia-500/50 text-white placeholder-purple-300 focus:ring-fuchsia-400 focus:border-fuchsia-400'
    : isDark
    ? 'bg-gray-800/50 border-white/20 text-white placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-400'
    : 'bg-white/70 border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-cyan-400 focus:border-cyan-400';

  return (
    <div className={`${cardBg} backdrop-blur-sm rounded-xl p-3 ${cardHover} transition-all border ${cardBorder}`}>
      {/* Header */}
      <div className="flex items-start gap-2 mb-2">
        <div
          className={`w-7 h-7 ${platformStyle.bg} backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0`}
        >
          <span className={`${platformStyle.text} text-xs font-bold`}>
            {platformStyle.letter}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {item.subreddit && (
              <span className={`text-xs ${colors.textMuted}`}>{item.subreddit}</span>
            )}
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.createdAt}</span>
          </div>
          <h4 className={`text-sm font-medium ${colors.text} line-clamp-1`}>
            {item.title}
          </h4>
        </div>
      </div>

      {/* Content Preview */}
      <p className={`text-xs ${colors.textMuted} line-clamp-2 mb-2`}>{item.content}</p>

      {/* Response Preview (if available) - Editable */}
      {(item.response || isEditing) && (
        <div className={`${responseBg} border backdrop-blur-sm rounded-lg p-2.5 mb-2`}>
          <p className={`text-xs ${responseLabelColor} font-medium mb-1`}>
            AI Response:{isEditing && <span className="ml-1 text-green-400">(editing)</span>}
          </p>
          {isEditing ? (
            <textarea
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
              className={`w-full text-xs rounded-lg p-2 border resize-none focus:ring-2 focus:outline-none ${textareaClass}`}
              rows={3}
              autoFocus
            />
          ) : (
            <p className={`text-xs ${colors.text} line-clamp-2`}>{item.response}</p>
          )}
        </div>
      )}

      {/* Engagement Stats */}
      <div className={`flex items-center gap-3 text-xs ${colors.textMuted} mb-2`}>
        {item.engagement.upvotes !== undefined && (
          <span>{item.engagement.upvotes} upvotes</span>
        )}
        {item.engagement.comments !== undefined && (
          <span>{item.engagement.comments} comments</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${buttonClass} backdrop-blur-sm rounded-lg transition border`}
        >
          <Copy className="w-3 h-3" />
          Copy
        </button>
        <button
          onClick={handleEditClick}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${editButtonClass} backdrop-blur-sm rounded-lg transition border`}
        >
          {isEditing ? (
            <>
              <Save className="w-3 h-3" />
              Save
            </>
          ) : (
            <>
              <Edit2 className="w-3 h-3" />
              Edit
            </>
          )}
        </button>
        <button
          onClick={handleOpenOriginal}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium ${buttonClass} backdrop-blur-sm rounded-lg transition border`}
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </button>
        <button
          onClick={onMarkPosted}
          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white ${primaryButtonClass} rounded-lg transition ml-auto shadow-sm`}
        >
          <CheckCircle className="w-3 h-3" />
          Posted
        </button>
      </div>
    </div>
  );
}
