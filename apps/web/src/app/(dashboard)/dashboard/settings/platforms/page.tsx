'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsSection, PlatformCard } from '@/components/settings';
import { useConnectedPlatforms } from '@/hooks/use-settings';
import { hasPermission } from '@/lib/auth/rbac';
import { useRole } from '@/hooks/use-role';

const availablePlatforms = [
  {
    id: 'reddit',
    name: 'Reddit',
    slug: 'reddit',
    description: 'Monitor subreddits for relevant conversations',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    slug: 'twitter',
    description: 'Track tweets and replies',
  },
  {
    id: 'quora',
    name: 'Quora',
    slug: 'quora',
    description: 'Find questions to answer',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    slug: 'linkedin',
    description: 'Engage with professional discussions',
  },
  {
    id: 'google',
    name: 'Google Alerts',
    slug: 'google',
    description: 'Monitor web mentions',
  },
];

export default function PlatformsSettingsPage() {
  const router = useRouter();
  const { role } = useRole();
  const {
    platforms,
    isLoading,
    error,
    toggleEnabled,
    disconnectPlatform,
  } = useConnectedPlatforms();

  const canManage = hasPermission(role, 'platforms:manage');

  const handleConnect = (platformSlug: string) => {
    // In a real app, this would initiate OAuth flow
    // For now, redirect to a mock connect page or show modal
    alert(`Connect to ${platformSlug} - OAuth flow would start here`);
  };

  const handleConfigure = (platformId: string) => {
    // Navigate to platform configuration page
    router.push(`/dashboard/settings/platforms/${platformId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading platforms...</p>
        </div>
      </div>
    );
  }

  // Get list of unconnected platforms
  const connectedSlugs = new Set(platforms.map((p) => p.slug));
  const unconnectedPlatforms = availablePlatforms.filter(
    (p) => !connectedSlugs.has(p.slug)
  );

  return (
    <div className="space-y-6">
      {/* Connected Platforms */}
      <SettingsSection
        title="Connected Platforms"
        description="Manage your platform connections and monitoring settings"
      >
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
          </div>
        )}

        {platforms.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <GlobeIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No platforms connected yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Connect your first platform below to start monitoring conversations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                onToggleEnabled={toggleEnabled}
                onDisconnect={disconnectPlatform}
                onConfigure={handleConfigure}
              />
            ))}
          </div>
        )}
      </SettingsSection>

      {/* Available Platforms */}
      {unconnectedPlatforms.length > 0 && canManage && (
        <SettingsSection
          title="Available Platforms"
          description="Connect additional platforms to expand your monitoring reach"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unconnectedPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${getPlatformBgColor(platform.slug)}`}
                  >
                    <PlatformIcon platform={platform.slug} className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {platform.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {platform.description}
                </p>
                <button
                  onClick={() => handleConnect(platform.slug)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}
    </div>
  );
}

function getPlatformBgColor(slug: string): string {
  const colors: Record<string, string> = {
    reddit: 'bg-orange-500',
    twitter: 'bg-sky-500',
    quora: 'bg-red-600',
    linkedin: 'bg-blue-700',
    google: 'bg-green-500',
  };
  return colors[slug] || 'bg-gray-500';
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    reddit: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    quora: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.738 20.929c-.949-1.656-1.962-3.236-3.592-3.236-.522 0-1.042.166-1.457.491l-.772-1.49c.711-.618 1.71-.959 2.798-.959 2.178 0 3.462 1.266 4.525 2.842.344-.682.566-1.509.566-2.55 0-3.268-1.792-5.943-5.061-5.943-3.199 0-5.135 2.704-5.135 5.859 0 3.193 1.795 6.03 5.119 6.03.605 0 1.157-.102 1.672-.271l.034-.052c.369-.566.815-1.186 1.303-1.721z"/>
      </svg>
    ),
    linkedin: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
      </svg>
    ),
    google: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
      </svg>
    ),
  };
  return <>{icons[platform] || null}</>;
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}
