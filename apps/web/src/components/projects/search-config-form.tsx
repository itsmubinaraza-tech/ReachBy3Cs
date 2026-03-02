'use client';

import { useState } from 'react';
import { KeywordManager } from './keyword-manager';
import type { ProjectSearchConfig, MatchingMode, CrawlFrequency } from 'shared-types';

interface SearchConfigFormProps {
  projectId: string;
  config?: ProjectSearchConfig;
  existingConfigCount: number;
  onSave: (data: SearchConfigFormData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
}

export interface SearchConfigFormData {
  name: string;
  keywords: string[];
  excluded_keywords: string[];
  matching_mode: MatchingMode;
  max_post_age_days: number;
  platforms: string[];
  reddit_subreddits: string[];
  min_engagement: number;
  crawl_frequency: CrawlFrequency;
  is_active: boolean;
}

const POST_AGE_OPTIONS = [
  { value: 7, label: 'Last week' },
  { value: 30, label: 'Last month' },
  { value: 60, label: 'Last 2 months' },
  { value: 90, label: 'Last 3 months' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last year' },
];

const PLATFORM_OPTIONS = [
  { value: 'reddit', label: 'Reddit', icon: 'R' },
  { value: 'twitter', label: 'Twitter/X', icon: 'X' },
  { value: 'quora', label: 'Quora', icon: 'Q' },
];

const CRAWL_FREQUENCY_OPTIONS: { value: CrawlFrequency; label: string }[] = [
  { value: 'manual', label: 'Manual only' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const MAX_CONFIGS_PER_PROJECT = 10;

export function SearchConfigForm({
  projectId,
  config,
  existingConfigCount,
  onSave,
  onCancel,
}: SearchConfigFormProps) {
  const isEditing = !!config;
  const isAtLimit = !isEditing && existingConfigCount >= MAX_CONFIGS_PER_PROJECT;

  const [formData, setFormData] = useState<SearchConfigFormData>({
    name: config?.name || '',
    keywords: config?.keywords || [],
    excluded_keywords: config?.excluded_keywords || [],
    matching_mode: config?.matching_mode || 'semantic',
    max_post_age_days: config?.max_post_age_days || 90,
    platforms: config?.platforms || ['reddit'],
    reddit_subreddits: config?.reddit_subreddits || [],
    min_engagement: config?.min_engagement || 0,
    crawl_frequency: config?.crawl_frequency || 'daily',
    is_active: config?.is_active ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handlePlatformToggle = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (formData.keywords.length === 0) {
      setError('At least one keyword is required');
      return;
    }
    if (formData.platforms.length === 0) {
      setError('At least one platform is required');
      return;
    }

    setIsSubmitting(true);
    const result = await onSave(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Failed to save configuration');
    }
  };

  if (isAtLimit) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-amber-700 dark:text-amber-400 text-sm">
          Maximum {MAX_CONFIGS_PER_PROJECT} configurations per project reached. Please delete an existing configuration to add a new one.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Configuration Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={100}
          placeholder="e.g., Reddit Relationship Advice"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Keywords <span className="text-red-500">*</span>
        </label>
        <KeywordManager
          keywords={formData.keywords}
          onChange={(keywords) => setFormData((prev) => ({ ...prev, keywords }))}
          placeholder="Add search keyword..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Enter keywords to search for. Press Enter to add.
        </p>
      </div>

      {/* Excluded Keywords */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Excluded Keywords
        </label>
        <KeywordManager
          keywords={formData.excluded_keywords}
          onChange={(excluded_keywords) => setFormData((prev) => ({ ...prev, excluded_keywords }))}
          placeholder="Add keyword to exclude..."
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Posts containing these keywords will be skipped.
        </p>
      </div>

      {/* Matching Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Matching Mode
        </label>
        <div className="flex gap-4">
          {(['exact', 'semantic', 'both'] as MatchingMode[]).map((mode) => (
            <label key={mode} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="matching_mode"
                value={mode}
                checked={formData.matching_mode === mode}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{mode}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Exact: keyword must appear. Semantic: AI understands intent. Both: combines approaches.
        </p>
      </div>

      {/* Post Age */}
      <div>
        <label htmlFor="max_post_age_days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Post Age Filter
        </label>
        <select
          id="max_post_age_days"
          name="max_post_age_days"
          value={formData.max_post_age_days}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {POST_AGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Platforms */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Platforms <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {PLATFORM_OPTIONS.map((platform) => (
            <label
              key={platform.value}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-all ${
                formData.platforms.includes(platform.value)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform.value)}
                onChange={() => handlePlatformToggle(platform.value)}
                className="sr-only"
              />
              <span className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-xs font-bold">
                {platform.icon}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{platform.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reddit Subreddits (conditional) */}
      {formData.platforms.includes('reddit') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reddit Subreddits (Optional)
          </label>
          <KeywordManager
            keywords={formData.reddit_subreddits}
            onChange={(reddit_subreddits) => setFormData((prev) => ({ ...prev, reddit_subreddits }))}
            placeholder="e.g., relationships"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty to search all subreddits. Enter without r/ prefix.
          </p>
        </div>
      )}

      {/* Min Engagement */}
      <div>
        <label htmlFor="min_engagement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Minimum Engagement
        </label>
        <input
          id="min_engagement"
          name="min_engagement"
          type="number"
          min={0}
          value={formData.min_engagement}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Minimum upvotes/likes required (0 = no minimum)
        </p>
      </div>

      {/* Crawl Frequency */}
      <div>
        <label htmlFor="crawl_frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Crawl Frequency
        </label>
        <select
          id="crawl_frequency"
          name="crawl_frequency"
          value={formData.crawl_frequency}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {CRAWL_FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData((prev) => ({ ...prev, is_active: e.target.checked }))}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formData.is_active ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            isEditing ? 'Update Configuration' : 'Create Configuration'
          )}
        </button>
      </div>
    </form>
  );
}
