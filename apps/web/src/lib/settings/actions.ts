'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { RiskLevel, CTALevel, UserRole } from 'shared-types';

export interface OrganizationProfileData {
  name: string;
  slug: string;
  website: string;
  industry: string;
  description: string;
  logoUrl: string;
}

export interface AutomationSettings {
  enabled: boolean;
  ctsThreshold: number;
  maxDailyAutoPost: number;
  allowedRiskLevels: RiskLevel[];
  maxCtaLevel: CTALevel;
  requireReviewForHighIntensity: boolean;
  intensityThreshold: number;
}

export interface NotificationPreferences {
  push: {
    enabled: boolean;
    newPendingItems: boolean;
    highRiskFlags: boolean;
    autoPostConfirmations: boolean;
    dailySummary: boolean;
    summaryTime: string;
  };
  email: {
    enabled: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
}

/**
 * Update organization profile
 */
export async function updateOrganizationProfile(
  orgId: string,
  data: OrganizationProfileData
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Get current settings
  const { data: org, error: fetchError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  if (fetchError) {
    return { error: new Error(fetchError.message) };
  }

  const currentSettings = (org.settings as Record<string, unknown>) || {};

  const { error } = await supabase
    .from('organizations')
    .update({
      name: data.name,
      slug: data.slug,
      settings: {
        ...currentSettings,
        website: data.website,
        industry: data.industry,
        description: data.description,
        logo_url: data.logoUrl,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/profile');
  return { error: null };
}

/**
 * Update automation settings
 */
export async function updateAutomationSettings(
  orgId: string,
  settings: AutomationSettings
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Get current org settings
  const { data: org, error: fetchError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  if (fetchError) {
    return { error: new Error(fetchError.message) };
  }

  const currentSettings = (org.settings as Record<string, unknown>) || {};

  const { error } = await supabase
    .from('organizations')
    .update({
      settings: {
        ...currentSettings,
        auto_post_enabled: settings.enabled,
        cts_threshold: settings.ctsThreshold,
        daily_post_limit: settings.maxDailyAutoPost,
        allowed_risk_levels: settings.allowedRiskLevels,
        max_cta_level: settings.maxCtaLevel,
        require_review_high_intensity: settings.requireReviewForHighIntensity,
        intensity_threshold: settings.intensityThreshold,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/automation');
  return { error: null };
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('users')
    .update({
      notification_preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/notifications');
  return { error: null };
}

/**
 * Get team members for organization
 */
export async function getTeamMembers(
  orgId: string
): Promise<{
  error: Error | null;
  members?: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    role: UserRole;
    lastActiveAt: string | null;
    createdAt: string;
  }[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, avatar_url, role, last_active_at, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) {
    return { error: new Error(error.message) };
  }

  return {
    error: null,
    members: data.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role as UserRole,
      lastActiveAt: user.last_active_at,
      createdAt: user.created_at,
    })),
  };
}

/**
 * Update team member role
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: UserRole
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Verify user belongs to organization
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { error: new Error('User not found') };
  }

  if (user.organization_id !== orgId) {
    return { error: new Error('User does not belong to this organization') };
  }

  // Cannot change owner role
  if (user.role === 'owner') {
    return { error: new Error('Cannot change owner role') };
  }

  const { error } = await supabase
    .from('users')
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/team');
  return { error: null };
}

/**
 * Remove team member from organization
 */
export async function removeTeamMember(
  orgId: string,
  userId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Verify user belongs to organization and is not owner
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return { error: new Error('User not found') };
  }

  if (user.organization_id !== orgId) {
    return { error: new Error('User does not belong to this organization') };
  }

  if (user.role === 'owner') {
    return { error: new Error('Cannot remove owner from organization') };
  }

  // Remove user from organization (set organization_id to null or delete)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/team');
  return { error: null };
}

/**
 * Invite team member
 */
export async function inviteTeamMember(
  orgId: string,
  email: string,
  role: UserRole
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Check if user already exists in organization
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    return { error: new Error('User is already a member of this organization') };
  }

  // Check for existing pending invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    return { error: new Error('An invitation has already been sent to this email') };
  }

  // Create invitation
  const { error } = await supabase.from('invitations').insert({
    organization_id: orgId,
    email: email.toLowerCase(),
    role,
    status: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  // TODO: Send invitation email

  revalidatePath('/dashboard/settings/team');
  return { error: null };
}

/**
 * Toggle platform connection enabled state
 */
export async function togglePlatformEnabled(
  orgId: string,
  connectionId: string,
  enabled: boolean
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('organization_platforms')
    .update({
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .eq('organization_id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/platforms');
  return { error: null };
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(
  orgId: string,
  connectionId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('organization_platforms')
    .delete()
    .eq('id', connectionId)
    .eq('organization_id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard/settings/platforms');
  return { error: null };
}

/**
 * Get connected platforms for organization
 */
export async function getConnectedPlatforms(
  orgId: string
): Promise<{
  error: Error | null;
  platforms?: {
    id: string;
    platformId: string;
    name: string;
    slug: string;
    isEnabled: boolean;
    lastCrawlAt: string | null;
    crawlStatus: string | null;
    username?: string;
    searchConfig: Record<string, unknown>;
  }[];
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('organization_platforms')
    .select(`
      id,
      platform_id,
      is_enabled,
      last_crawl_at,
      crawl_status,
      credentials,
      search_config,
      platforms:platform_id (
        name,
        slug
      )
    `)
    .eq('organization_id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return {
    error: null,
    platforms: data.map((conn) => ({
      id: conn.id,
      platformId: conn.platform_id,
      name: (conn.platforms as any)?.name || 'Unknown',
      slug: (conn.platforms as any)?.slug || 'unknown',
      isEnabled: conn.is_enabled,
      lastCrawlAt: conn.last_crawl_at,
      crawlStatus: conn.crawl_status,
      username: (conn.credentials as any)?.username,
      searchConfig: conn.search_config as Record<string, unknown>,
    })),
  };
}
