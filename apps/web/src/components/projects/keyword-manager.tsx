'use client';

import { useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface KeywordManagerProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
  maxKeywords?: number;
  className?: string;
  disabled?: boolean;
}

export function KeywordManager({
  keywords,
  onChange,
  placeholder = 'Add keyword...',
  maxKeywords = 20,
  className,
  disabled = false,
}: KeywordManagerProps) {
  const [input, setInput] = useState('');

  const addKeyword = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < maxKeywords) {
      onChange([...keywords, trimmed]);
      setInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange(keywords.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    } else if (e.key === 'Backspace' && input === '' && keywords.length > 0) {
      const lastKeyword = keywords[keywords.length - 1];
      if (lastKeyword) {
        removeKeyword(lastKeyword);
      }
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tags Display */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span
              key={keyword}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-full"
            >
              {keyword}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="ml-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300"
                  aria-label={`Remove ${keyword}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      {!disabled && keywords.length < maxKeywords && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            type="button"
            onClick={addKeyword}
            disabled={!input.trim()}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {/* Limit indicator */}
      {keywords.length >= maxKeywords && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Maximum {maxKeywords} keywords reached
        </p>
      )}
    </div>
  );
}
