'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface PlatformConnection {
  id: string;
  name: string;
  slug: string;
  icon: 'reddit' | 'twitter' | 'quora' | 'linkedin' | 'google';
  description: string;
  connected: boolean;
  username?: string;
}

const availablePlatforms: PlatformConnection[] = [
  {
    id: 'reddit',
    name: 'Reddit',
    slug: 'reddit',
    icon: 'reddit',
    description: 'Monitor subreddits for relevant conversations',
    connected: false,
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    slug: 'twitter',
    icon: 'twitter',
    description: 'Track tweets and replies mentioning problems you solve',
    connected: false,
  },
  {
    id: 'quora',
    name: 'Quora',
    slug: 'quora',
    icon: 'quora',
    description: 'Find questions where your expertise can help',
    connected: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    slug: 'linkedin',
    icon: 'linkedin',
    description: 'Engage with professional discussions',
    connected: false,
  },
  {
    id: 'google',
    name: 'Google Alerts',
    slug: 'google',
    icon: 'google',
    description: 'Monitor web mentions and forum discussions',
    connected: false,
  },
];

interface PlatformConnectProps {
  connectedPlatforms: PlatformConnection[];
  onConnect: (platformId: string) => Promise<void>;
  onDisconnect: (platformId: string) => Promise<void>;
}

export function PlatformConnect({
  connectedPlatforms,
  onConnect,
  onDisconnect,
}: PlatformConnectProps) {
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (platformId: string) => {
    setConnectingId(platformId);
    try {
      await onConnect(platformId);
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setConnectingId(platformId);
    try {
      await onDisconnect(platformId);
    } finally {
      setConnectingId(null);
    }
  };

  const getPlatformStatus = (platformId: string) => {
    return connectedPlatforms.find((p) => p.id === platformId);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Connect your platforms to start monitoring for engagement opportunities.
        You can add more platforms later in settings.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availablePlatforms.map((platform) => {
          const connectedPlatform = getPlatformStatus(platform.id);
          const isConnected = !!connectedPlatform?.connected;
          const isConnecting = connectingId === platform.id;

          return (
            <div
              key={platform.id}
              className={cn(
                'p-4 rounded-xl border transition-all',
                isConnected
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    getPlatformBgColor(platform.icon)
                  )}
                >
                  <PlatformIcon platform={platform.icon} className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {platform.name}
                  </h3>
                  {isConnected && connectedPlatform?.username && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      @{connectedPlatform.username}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {platform.description}
              </p>

              {isConnected ? (
                <button
                  type="button"
                  onClick={() => handleDisconnect(platform.id)}
                  disabled={isConnecting}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                    isConnecting
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                  )}
                >
                  {isConnecting ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <DisconnectIcon className="w-4 h-4" />
                  )}
                  <span>{isConnecting ? 'Disconnecting...' : 'Disconnect'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnecting}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
                    isConnecting
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  {isConnecting ? (
                    <LoadingSpinner className="w-4 h-4" />
                  ) : (
                    <ConnectIcon className="w-4 h-4" />
                  )}
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Connection Summary */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {connectedPlatforms.filter((p) => p.connected).length === 0 ? (
            'No platforms connected yet'
          ) : (
            <>
              <span className="font-medium text-gray-900 dark:text-white">
                {connectedPlatforms.filter((p) => p.connected).length}
              </span>{' '}
              {connectedPlatforms.filter((p) => p.connected).length === 1
                ? 'platform'
                : 'platforms'}{' '}
              connected
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function getPlatformBgColor(platform: string): string {
  const colors: Record<string, string> = {
    reddit: 'bg-orange-500',
    twitter: 'bg-sky-500',
    quora: 'bg-red-600',
    linkedin: 'bg-blue-700',
    google: 'bg-green-500',
  };
  return colors[platform] || 'bg-gray-500';
}

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    reddit: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    ),
    twitter: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    quora: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.738 20.929c-.949-1.656-1.962-3.236-3.592-3.236-.522 0-1.042.166-1.457.491l-.772-1.49c.711-.618 1.71-.959 2.798-.959 2.178 0 3.462 1.266 4.525 2.842.344-.682.566-1.509.566-2.55 0-3.268-1.792-5.943-5.061-5.943-3.199 0-5.135 2.704-5.135 5.859 0 3.193 1.795 6.03 5.119 6.03.605 0 1.157-.102 1.672-.271l.034-.052c.369-.566.815-1.186 1.303-1.721zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c1.316 0 2.594-.212 3.785-.61l-1.328-2.326c-.795.211-1.617.335-2.457.335-5.052 0-8.467-3.932-8.467-9.267 0-5.232 3.293-9.431 8.467-9.431 4.844 0 8.393 3.881 8.393 9.4 0 2.089-.547 3.902-1.481 5.339l.053.096c.583.869 1.301 1.622 2.157 2.077 1.565-2.079 2.457-4.654 2.457-7.443C24 5.373 18.627 0 12 0z"/>
      </svg>
    ),
    linkedin: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
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

function ConnectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function DisconnectIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
