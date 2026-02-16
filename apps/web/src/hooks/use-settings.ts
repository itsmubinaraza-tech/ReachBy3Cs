'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrg } from '@/contexts/org-context';
import { useAuth } from '@/contexts/auth-context';
import {
  getTeamMembers,
  getConnectedPlatforms,
  updateMemberRole,
  removeTeamMember,
  inviteTeamMember,
  togglePlatformEnabled,
  disconnectPlatform as disconnectPlatformAction,
  updateAutomationSettings,
  updateNotificationPreferences,
  updateOrganizationProfile,
} from '@/lib/settings/actions';
import type { UserRole, RiskLevel, CTALevel } from 'shared-types';
import type { TeamMember } from '@/components/settings/team-list';
import type { ConnectedPlatform } from '@/components/settings/platform-card';
import type { AutomationSettingsData } from '@/components/settings/automation-controls';
import type { NotificationPreferencesData } from '@/components/settings/notification-toggles';
import type { OrganizationProfileData } from '@/components/settings/profile-form';

/**
 * Hook to manage organization settings
 */
export function useOrganizationSettings() {
  const { organization, settings, refreshOrganization, updateSettings } = useOrg();

  const getProfileData = useCallback((): OrganizationProfileData | null => {
    if (!organization || !settings) return null;

    const settingsObj = settings as Record<string, unknown>;

    return {
      name: organization.name,
      slug: organization.slug,
      website: (settingsObj.website as string) || '',
      industry: (settingsObj.industry as string) || '',
      description: (settingsObj.description as string) || '',
      logoUrl: (settingsObj.logo_url as string) || '',
    };
  }, [organization, settings]);

  const getAutomationSettings = useCallback((): AutomationSettingsData | null => {
    if (!settings) return null;

    const settingsObj = settings as Record<string, unknown>;

    return {
      enabled: (settingsObj.auto_post_enabled as boolean) || false,
      ctsThreshold: (settingsObj.cts_threshold as number) || 0.85,
      maxDailyAutoPost: (settingsObj.daily_post_limit as number) || 20,
      allowedRiskLevels: (settingsObj.allowed_risk_levels as RiskLevel[]) || ['low'],
      maxCtaLevel: (settingsObj.max_cta_level as CTALevel) || 1,
      requireReviewForHighIntensity: (settingsObj.require_review_high_intensity as boolean) ?? true,
      intensityThreshold: (settingsObj.intensity_threshold as number) || 0.7,
    };
  }, [settings]);

  const saveProfile = useCallback(
    async (data: OrganizationProfileData) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      return updateOrganizationProfile(organization.id, data);
    },
    [organization]
  );

  const saveAutomationSettings = useCallback(
    async (data: AutomationSettingsData) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      const result = await updateAutomationSettings(organization.id, data);
      if (!result.error) {
        await refreshOrganization();
      }
      return result;
    },
    [organization, refreshOrganization]
  );

  return {
    organization,
    settings,
    getProfileData,
    getAutomationSettings,
    saveProfile,
    saveAutomationSettings,
    refresh: refreshOrganization,
  };
}

/**
 * Hook to manage team members
 */
export function useTeamMembers() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getTeamMembers(organization.id);

    if (result.error) {
      setError(result.error);
    } else if (result.members) {
      setMembers(result.members);
    }

    setIsLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateRole = useCallback(
    async (userId: string, role: UserRole) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      const result = await updateMemberRole(organization.id, userId, role);
      if (!result.error) {
        await fetchMembers();
      }
      return result;
    },
    [organization, fetchMembers]
  );

  const removeMember = useCallback(
    async (userId: string) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      const result = await removeTeamMember(organization.id, userId);
      if (!result.error) {
        await fetchMembers();
      }
      return result;
    },
    [organization, fetchMembers]
  );

  const inviteMember = useCallback(
    async (email: string, role: UserRole) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      return inviteTeamMember(organization.id, email, role);
    },
    [organization]
  );

  return {
    members,
    isLoading,
    error,
    currentUserId: user?.id || '',
    currentUserRole: user?.role || 'member',
    refresh: fetchMembers,
    updateRole,
    removeMember,
    inviteMember,
  };
}

/**
 * Hook to manage connected platforms
 */
export function useConnectedPlatforms() {
  const { organization } = useOrg();
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlatforms = useCallback(async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const result = await getConnectedPlatforms(organization.id);

    if (result.error) {
      setError(result.error);
    } else if (result.platforms) {
      setPlatforms(
        result.platforms.map((p) => ({
          ...p,
          crawlStatus: p.crawlStatus as ConnectedPlatform['crawlStatus'],
        }))
      );
    }

    setIsLoading(false);
  }, [organization?.id]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const toggleEnabled = useCallback(
    async (connectionId: string, enabled: boolean) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      const result = await togglePlatformEnabled(organization.id, connectionId, enabled);
      if (!result.error) {
        await fetchPlatforms();
      }
      return result;
    },
    [organization, fetchPlatforms]
  );

  const disconnectPlatform = useCallback(
    async (connectionId: string) => {
      if (!organization) {
        return { error: new Error('No organization loaded') };
      }
      const result = await disconnectPlatformAction(organization.id, connectionId);
      if (!result.error) {
        await fetchPlatforms();
      }
      return result;
    },
    [organization, fetchPlatforms]
  );

  return {
    platforms,
    isLoading,
    error,
    refresh: fetchPlatforms,
    toggleEnabled,
    disconnectPlatform,
  };
}

/**
 * Hook to manage notification preferences
 */
export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferencesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Get preferences from user data
      const userPrefs = user as unknown as {
        notification_preferences?: NotificationPreferencesData;
      };

      setPreferences(
        userPrefs.notification_preferences || {
          push: {
            enabled: true,
            newPendingItems: true,
            highRiskFlags: true,
            autoPostConfirmations: true,
            dailySummary: false,
            summaryTime: '09:00',
          },
          email: {
            enabled: true,
            dailyDigest: false,
            weeklyReport: true,
          },
        }
      );
      setIsLoading(false);
    }
  }, [user]);

  const savePreferences = useCallback(
    async (data: NotificationPreferencesData) => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }
      const result = await updateNotificationPreferences(user.id, data);
      if (!result.error) {
        setPreferences(data);
      }
      return result;
    },
    [user]
  );

  return {
    preferences,
    isLoading,
    savePreferences,
  };
}
