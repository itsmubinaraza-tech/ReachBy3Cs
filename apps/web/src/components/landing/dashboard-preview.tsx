'use client';

import { PreviewQueueItemCard } from './preview-queue-item';
import { PreviewQueueItem } from '@/lib/landing/mock-preview-data';
import { useTheme } from '@/contexts/theme-context';

interface DashboardPreviewProps {
  items: PreviewQueueItem[];
  isLiveMode?: boolean;
  isLoading?: boolean;
}

export function DashboardPreview({
  items,
  isLiveMode = false,
  isLoading = false,
}: DashboardPreviewProps) {
  const { theme, colors } = useTheme();
  const pendingCount = items.length;

  const isNeon = theme === 'neon';
  const isDark = theme === 'dark' || isNeon;

  // Fluid glass frame class based on theme
  const fluidFrameClass = isNeon
    ? 'fluid-glass-frame-neon'
    : theme === 'dark'
    ? 'fluid-glass-frame-dark'
    : theme === 'earthy'
    ? 'fluid-glass-frame-earthy'
    : theme === 'calm'
    ? 'fluid-glass-frame-calm'
    : 'fluid-glass-frame';

  const liveGlowClass = isLiveMode ? (isNeon ? 'shadow-[0_0_30px_rgba(217,70,239,0.3)]' : 'shadow-[0_0_30px_rgba(0,191,255,0.3)]') : '';

  const spinnerColor = isNeon ? 'border-fuchsia-500' : theme === 'dark' ? 'border-cyan-500' : theme === 'earthy' ? 'border-amber-500' : theme === 'calm' ? 'border-teal-500' : 'border-cyan-500';

  const badgeBg = isNeon
    ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300'
    : theme === 'dark'
    ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
    : theme === 'earthy'
    ? 'bg-amber-500/20 border-amber-500/30 text-amber-700'
    : theme === 'calm'
    ? 'bg-teal-500/20 border-teal-500/30 text-teal-700'
    : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-700';

  const liveDotColor = isNeon ? 'bg-fuchsia-400' : theme === 'dark' ? 'bg-cyan-400' : theme === 'earthy' ? 'bg-amber-500' : theme === 'calm' ? 'bg-teal-500' : 'bg-cyan-500';

  const accentColor = isNeon ? 'text-fuchsia-400' : theme === 'dark' ? 'text-cyan-400' : theme === 'earthy' ? 'text-amber-600' : theme === 'calm' ? 'text-teal-600' : 'text-cyan-600';

  return (
    <div className={`${fluidFrameClass} ${liveGlowClass} p-5 h-full flex flex-col`}>
      {/* Section Header - matches form header */}
      <div className="mb-4">
        <h2 className={`text-xl font-bold ${colors.text}`}>
          Issues &amp; AI-Generated Responses
        </h2>
        <p className={`text-sm ${colors.textMuted} mt-1`}>
          Connect, communicate, and build community
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className={`inline-block w-10 h-10 border-4 ${spinnerColor} border-t-transparent rounded-full animate-spin mb-4`} />
          <p className={`${colors.text} font-medium`}>Searching for conversations...</p>
          <p className={`${colors.textMuted} text-sm mt-1`}>This may take a few moments</p>
        </div>
      )}

      {!isLoading && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Queue Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-semibold ${colors.text}`}>Review Queue</h3>
            <div className="flex items-center gap-2">
              {isLiveMode && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${badgeBg} backdrop-blur-sm rounded-full text-xs font-medium border`}>
                  <span className={`w-1.5 h-1.5 ${liveDotColor} rounded-full animate-pulse`} />
                  Live
                </span>
              )}
              <span className={`${badgeBg} backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium border`}>
                {pendingCount} pending
              </span>
            </div>
          </div>

          {/* Scrollable Queue Items */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide min-h-0">
            <div className="space-y-3">
              {items.map((item) => (
                <PreviewQueueItemCard
                  key={item.id}
                  item={item}
                  onCopy={() => {}}
                  onEdit={() => {}}
                  onMarkPosted={() => {}}
                />
              ))}
              {items.length === 0 && (
                <div className={`text-center py-8 ${colors.textMuted} text-sm flex flex-col items-center justify-center`}>
                  <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-100'} flex items-center justify-center mb-3`}>
                    <svg className={`w-6 h-6 ${colors.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className={`font-medium ${colors.text}`}>No conversations found</p>
                  <p className={`${colors.textMuted} text-xs mt-1`}>Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA for non-live mode */}
          {!isLiveMode && items.length > 0 && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-white/20'}`}>
              <p className={`${colors.textMuted} text-sm text-center`}>
                <span className={`${accentColor} font-medium`}>Sample data</span> — Search to see real conversations
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
