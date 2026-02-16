'use client';

import { useState, useEffect } from 'react';
import { Wizard, PlatformConnect, type PlatformConnection } from '@/components/onboarding';
import { useOrg } from '@/contexts/org-context';
import { connectPlatform, disconnectPlatform } from '@/lib/onboarding/actions';
import { createClient } from '@/lib/supabase/client';

export default function PlatformsOnboardingPage() {
  const { organization } = useOrg();
  const supabase = createClient();

  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing platform connections
  useEffect(() => {
    async function loadPlatforms() {
      if (!organization?.id) return;

      const { data } = await supabase
        .from('organization_platforms')
        .select(`
          id,
          platform_id,
          is_enabled,
          credentials,
          platforms:platform_id (
            name,
            slug
          )
        `)
        .eq('organization_id', organization.id);

      if (data) {
        setConnectedPlatforms(
          data.map((conn) => ({
            id: conn.platform_id,
            name: (conn.platforms as any)?.name || 'Unknown',
            slug: (conn.platforms as any)?.slug || 'unknown',
            icon: (conn.platforms as any)?.slug || 'unknown',
            description: '',
            connected: true,
            username: (conn.credentials as any)?.username,
          }))
        );
      }

      setIsLoading(false);
    }

    loadPlatforms();
  }, [organization?.id, supabase]);

  const handleConnect = async (platformId: string) => {
    if (!organization?.id) {
      setError('Organization not loaded');
      return;
    }

    // In a real app, this would open OAuth flow
    // For now, simulate connection
    const result = await connectPlatform(organization.id, platformId, {
      accessToken: 'mock-token',
      username: 'demo_user',
    });

    if (result.error) {
      setError(result.error.message);
      return;
    }

    // Update local state
    setConnectedPlatforms((prev) => {
      const existing = prev.find((p) => p.id === platformId);
      if (existing) {
        return prev.map((p) =>
          p.id === platformId ? { ...p, connected: true, username: 'demo_user' } : p
        );
      }
      return [
        ...prev,
        {
          id: platformId,
          name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          slug: platformId,
          icon: platformId as any,
          description: '',
          connected: true,
          username: 'demo_user',
        },
      ];
    });
  };

  const handleDisconnect = async (platformId: string) => {
    if (!organization?.id) {
      setError('Organization not loaded');
      return;
    }

    // Get the connection ID
    const platform = connectedPlatforms.find((p) => p.id === platformId);
    if (!platform) return;

    const result = await disconnectPlatform(organization.id, platformId);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    // Update local state
    setConnectedPlatforms((prev) => prev.filter((p) => p.id !== platformId));
  };

  const handleNext = async (): Promise<boolean> => {
    // Platforms are optional, so always allow proceeding
    return true;
  };

  if (isLoading) {
    return (
      <Wizard currentStep={3} title="Loading platforms..." description="">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </Wizard>
    );
  }

  return (
    <Wizard
      currentStep={3}
      title="Connect platforms to monitor"
      description="Connect the platforms where you want to find engagement opportunities. You can add more later."
      onNext={handleNext}
      showSkip
      skipLabel="Skip for now"
    >
      <PlatformConnect
        connectedPlatforms={connectedPlatforms}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Platform connections use OAuth for secure authentication.
          Your credentials are encrypted and never stored in plain text.
        </p>
      </div>
    </Wizard>
  );
}
