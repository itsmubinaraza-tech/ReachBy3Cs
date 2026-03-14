'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { SearchFormData } from '@/hooks/use-landing-search';
import { useTheme } from '@/contexts/theme-context';

interface SearchFormProps {
  onSearch: (data: SearchFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  remainingSearches: number;
  isRateLimited: boolean;
}

const timeFilterOptions = [
  { value: 1095, label: '3 years' },
  { value: 365, label: '1 year' },
  { value: 180, label: '6 months' },
  { value: 90, label: '3 months' },
  { value: 7, label: '1 week' },
];

export function SearchForm({ onSearch, isLoading, error, remainingSearches, isRateLimited }: SearchFormProps) {
  const { theme, colors } = useTheme();
  const [targetAudience, setTargetAudience] = useState('');
  const [timeFilter, setTimeFilter] = useState(365);
  const [solution, setSolution] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSearch({ targetAudience, timeFilter, solution });
  };

  const isNeon = theme === 'neon';
  const isDark = theme === 'dark' || isNeon;

  // Theme-aware styling
  const labelClass = `block text-sm font-medium ${colors.textMuted} mb-2`;
  const inputClass = `w-full ml-2 px-5 py-3 rounded-xl ${colors.inputBg} backdrop-blur-sm border-2 ${colors.inputBorder} ${colors.inputFocus} focus:ring-2 resize-none ${isDark ? 'placeholder-gray-500 text-white' : 'placeholder-gray-400 text-gray-800'}`;

  // Radio button styling
  const getRadioClass = (selected: boolean) => {
    if (selected) {
      if (isNeon) return 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-300 shadow-lg shadow-fuchsia-500/20';
      if (theme === 'dark') return 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md';
      if (theme === 'earthy') return 'bg-amber-500/20 border-amber-400 text-amber-700 shadow-md';
      if (theme === 'calm') return 'bg-teal-500/20 border-teal-400 text-teal-700 shadow-md';
      return 'bg-cyan-500/20 border-cyan-400 text-cyan-700 shadow-md';
    }
    return isDark
      ? 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
      : 'bg-white/30 border-white/40 text-gray-600 hover:bg-white/50';
  };

  const getRadioDotClass = (selected: boolean) => {
    if (selected) {
      if (isNeon) return 'border-fuchsia-400 bg-fuchsia-500';
      if (theme === 'dark') return 'border-cyan-400 bg-cyan-500';
      if (theme === 'earthy') return 'border-amber-500 bg-amber-500';
      if (theme === 'calm') return 'border-teal-500 bg-teal-500';
      return 'border-cyan-500 bg-cyan-500';
    }
    return isDark ? 'border-gray-500 bg-white/20' : 'border-gray-400 bg-white/50';
  };

  const buttonClass = isNeon
    ? 'neon-button w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-500 text-white px-6 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/40'
    : `w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${colors.buttonGradient} text-white px-6 py-3 rounded-xl font-semibold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${colors.buttonShadow}`;

  // Fluid glass frame class based on theme (outer container)
  const fluidFrameClass = isNeon
    ? 'fluid-glass-frame-neon'
    : theme === 'dark'
    ? 'fluid-glass-frame-dark'
    : theme === 'earthy'
    ? 'fluid-glass-frame-earthy'
    : theme === 'calm'
    ? 'fluid-glass-frame-calm'
    : 'fluid-glass-frame';

  // Liquid glass field class based on theme (individual fields with full box effect)
  const liquidFieldClass = isNeon
    ? 'liquid-glass-field-neon'
    : theme === 'dark'
    ? 'liquid-glass-field-dark'
    : theme === 'earthy'
    ? 'liquid-glass-field-earthy'
    : theme === 'calm'
    ? 'liquid-glass-field-calm'
    : 'liquid-glass-field';

  return (
    <div className={`${fluidFrameClass} p-3 sm:p-5 h-full flex flex-col`}>
      {/* Form Header */}
      <div className="mb-3 sm:mb-4">
        <h2 className={`text-lg sm:text-xl font-bold ${colors.text}`}>
          Find People Talking About Issues You Solve
        </h2>
        <p className={`text-xs sm:text-sm ${colors.textMuted} mt-1`}>
          Discover conversations where your solution can help
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
        {/* Issue Field */}
        <div className={`${liquidFieldClass} p-3 sm:p-4`}>
          <label htmlFor="targetAudience" className={labelClass}>
            What problem does your product solve?
          </label>
          <textarea
            id="targetAudience"
            name="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Workplace communication and relationship building..."
            rows={2}
            className={`${inputClass} text-sm sm:text-base py-2 sm:py-3`}
            required
            aria-describedby="targetAudience-help"
          />
        </div>

        {/* Timeframe Field */}
        <fieldset className={`${liquidFieldClass} p-3 sm:p-4`}>
          <legend className={`block text-xs sm:text-sm font-medium ${colors.textMuted} mb-2 sm:mb-3`}>
            How recent should conversations be?
          </legend>
          <div className="flex flex-wrap gap-1.5 sm:gap-2" role="radiogroup" aria-label="Time filter options">
            {timeFilterOptions.map((option) => (
              <label
                key={option.value}
                htmlFor={`timeFilter-${option.value}`}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg cursor-pointer transition-all border backdrop-blur-sm ${getRadioClass(timeFilter === option.value)}`}
              >
                <input
                  type="radio"
                  id={`timeFilter-${option.value}`}
                  name="timeFilter"
                  value={option.value}
                  checked={timeFilter === option.value}
                  onChange={() => setTimeFilter(option.value)}
                  className="sr-only"
                  aria-checked={timeFilter === option.value}
                />
                <span className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 flex items-center justify-center ${getRadioDotClass(timeFilter === option.value)}`} aria-hidden="true">
                  {timeFilter === option.value && (
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="text-xs sm:text-sm font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Solution Field */}
        <div className={`${liquidFieldClass} p-3 sm:p-4`}>
          <label htmlFor="solution" className={labelClass}>
            How does your product solve it?
          </label>
          <textarea
            id="solution"
            name="solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="e.g., Our product coaches leaders in real time what to say and how to say it..."
            rows={2}
            className={`${inputClass} text-sm sm:text-base py-2 sm:py-3`}
            required
            aria-describedby="solution-help"
          />
        </div>

        {/* Rate Limit Warning */}
        {remainingSearches <= 3 && remainingSearches > 0 && !isRateLimited && (
          <div className={`p-3 flex items-start gap-2 ${isNeon ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' : isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30' : 'bg-yellow-50 text-yellow-700 border-yellow-300/50'} backdrop-blur-sm rounded-xl text-sm border`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {remainingSearches} {remainingSearches === 1 ? 'search' : 'searches'} remaining.{' '}
              <Link href="/signup" className="underline font-medium hover:opacity-80">
                Sign up for unlimited
              </Link>
            </span>
          </div>
        )}

        {/* Rate Limit Reached */}
        {isRateLimited && (
          <div className={`p-3 flex items-start gap-2 ${isNeon ? 'bg-red-500/30 text-red-300 border-red-500/40' : isDark ? 'bg-red-500/20 text-red-400 border-red-400/30' : 'bg-red-50 text-red-700 border-red-300/50'} backdrop-blur-sm rounded-xl text-sm border`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Search limit reached.{' '}
              <Link href="/signup" className="underline font-medium hover:opacity-80">
                Sign up for unlimited searches
              </Link>
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && !isRateLimited && (
          <div className={`p-3 ${isNeon ? 'bg-red-500/30 text-red-300 border-red-500/40' : 'bg-red-500/20 text-red-700 border-red-300/30'} backdrop-blur-sm rounded-xl text-sm border`}>
            {error}
          </div>
        )}

        {/* Submit Button Area */}
        <div className="mt-auto pt-3 sm:pt-4">
          <button type="submit" disabled={isLoading || isRateLimited} className={buttonClass}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                Go find conversations
              </>
            )}
          </button>
          <p className={`text-xs ${colors.textMuted} text-center mt-2 sm:mt-3`}>
            We&apos;ll search Reddit, StackOverflow & more
          </p>
        </div>
      </form>
    </div>
  );
}
