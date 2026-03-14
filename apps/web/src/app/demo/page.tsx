'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SearchForm } from '@/components/landing/search-form';
import { DashboardPreview } from '@/components/landing/dashboard-preview';
import { ThemeSwitcher } from '@/components/landing/theme-switcher';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { useDemoSearch, DemoSearchFormData } from '@/hooks/use-demo-search';
import { mockPreviewQueueItems } from '@/lib/landing/mock-preview-data';
import { Logo } from '@/components/ui/logo';
import { SearchFormData } from '@/hooks/use-landing-search';

function DemoContent() {
  const { theme, colors } = useTheme();
  const {
    search,
    results,
    isSearching,
    isAnalyzing,
    analyzingCount,
    totalCount,
    hasSearched,
    error,
    remainingSearches,
    isRateLimited,
  } = useDemoSearch();

  // Convert DemoSearchFormData to SearchFormData for SearchForm compatibility
  const handleSearch = async (data: SearchFormData) => {
    const demoData: DemoSearchFormData = {
      targetAudience: data.targetAudience,
      timeFilter: data.timeFilter,
      solution: data.solution,
    };
    await search(demoData);
  };

  const previewItems = hasSearched ? results : mockPreviewQueueItems;

  // Theme-aware classes
  const isNeon = theme === 'neon';
  const isDark = theme === 'dark' || isNeon;

  const navGlass = isNeon
    ? 'bg-gray-950/90 backdrop-blur-xl border-fuchsia-500/30'
    : isDark
    ? 'bg-gray-900/80 backdrop-blur-xl border-white/10'
    : 'bg-white/25 backdrop-blur-xl border-white/30';

  const textSecondary = isNeon
    ? 'text-purple-200'
    : isDark
    ? 'text-gray-400'
    : theme === 'earthy'
    ? 'text-amber-700'
    : theme === 'calm'
    ? 'text-teal-700'
    : 'text-gray-600';

  // Progress indicator styling
  const progressBg = isNeon
    ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300'
    : theme === 'dark'
    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
    : theme === 'earthy'
    ? 'bg-amber-500/20 border-amber-500/30 text-amber-700'
    : theme === 'calm'
    ? 'bg-teal-500/20 border-teal-500/30 text-teal-700'
    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700';

  return (
    <div className={`min-h-screen ${colors.gradient}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full ${navGlass} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={`inline-flex items-center gap-2 ${textSecondary} hover:opacity-80 transition text-sm font-medium`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <div className="hidden sm:block">
                <Logo size="lg" href="/" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Link
                href="/signup"
                className={`${textSecondary} hover:opacity-80 font-medium transition hidden sm:block text-sm`}
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className={`${textSecondary} hover:opacity-80 font-medium transition text-sm`}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`text-2xl sm:text-3xl font-bold ${colors.text} mb-2`}>
              Try ReachBy3Cs Demo
            </h1>
            <p className={`${textSecondary} text-sm sm:text-base`}>
              See how AI finds conversations where your solution can help
            </p>
          </div>

          {/* Progress Indicator when analyzing */}
          {isAnalyzing && (
            <div className={`mb-4 p-3 ${progressBg} backdrop-blur-sm rounded-xl border text-center`}>
              <p className="text-sm font-medium">
                Generating AI responses: {analyzingCount} of {totalCount}
              </p>
              <div className={`mt-2 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isNeon ? 'bg-fuchsia-500' : 'bg-cyan-500'}`}
                  style={{ width: `${totalCount > 0 ? (analyzingCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Two-Column Search & Preview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Left Column - Search Form */}
            <div className="min-h-fit lg:h-[600px]">
              <SearchForm
                onSearch={handleSearch}
                isLoading={isSearching}
                error={error}
                remainingSearches={remainingSearches}
                isRateLimited={isRateLimited}
              />
            </div>
            {/* Right Column - Dashboard Preview */}
            <div className="h-[400px] lg:h-[600px]">
              <DashboardPreview
                items={previewItems}
                isLiveMode={hasSearched}
                isLoading={isSearching}
              />
            </div>
          </div>

          {/* Info Footer */}
          <div className={`mt-6 text-center ${textSecondary} text-xs sm:text-sm`}>
            <p>
              Posts appear instantly. AI responses generate progressively for each post.
            </p>
            <p className="mt-1">
              <Link href="/signup" className="underline hover:opacity-80">
                Sign up
              </Link>{' '}
              for unlimited searches and full access to all features.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <ThemeProvider>
      <DemoContent />
    </ThemeProvider>
  );
}
