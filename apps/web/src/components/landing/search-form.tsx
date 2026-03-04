'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { SearchFormData } from '@/hooks/use-landing-search';

interface SearchFormProps {
  onSearch: (data: SearchFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const timeFilterOptions = [
  { value: 7, label: '1 week' },
  { value: 30, label: '1 month' },
  { value: 90, label: '3 months' },
  { value: 365, label: '1 year' },
];

export function SearchForm({ onSearch, isLoading, error }: SearchFormProps) {
  const [targetAudience, setTargetAudience] = useState('');
  const [timeFilter, setTimeFilter] = useState(7);
  const [solution, setSolution] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSearch({ targetAudience, timeFilter, solution });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Find Your Audience
        </h2>

        {/* Target Audience Field */}
        <div className="mb-6">
          <label
            htmlFor="targetAudience"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Describe your target audience and the problem you are trying to solve
          </label>
          <textarea
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Couples struggling with communication in their relationship..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
            required
          />
        </div>

        {/* Time Filter Field */}
        <div className="mb-6">
          <label
            htmlFor="timeFilter"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            How long ago should the conversation have happened?
          </label>
          <select
            id="timeFilter"
            value={timeFilter}
            onChange={(e) => setTimeFilter(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {timeFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Solution Field */}
        <div className="mb-6">
          <label
            htmlFor="solution"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            What is the solution you&apos;re providing to match that need?
          </label>
          <textarea
            id="solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="e.g., An emotional intelligence app that helps couples communicate better..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none placeholder-gray-400"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Go find conversations
            </>
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-sm text-gray-500 text-center">
        We&apos;ll search Reddit, Quora, and other platforms for people discussing this topic
      </p>
    </form>
  );
}
