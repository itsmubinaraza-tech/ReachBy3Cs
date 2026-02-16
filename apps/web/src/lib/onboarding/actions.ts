'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserRole } from 'shared-types';

export interface ProfileFormData {
  appName: string;
  website: string;
  industry: string;
  valueProposition: string;
}

export interface CategoryData {
  id?: string;
  name: string;
  keywords?: string[];
  isCustom?: boolean;
}

export interface PlatformCredentials {
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  [key: string]: unknown;
}

export interface TeamInviteData {
  email: string;
  role: UserRole;
}

/**
 * Update organization profile during onboarding
 */
export async function updateOrganizationProfile(
  orgId: string,
  data: ProfileFormData
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
      name: data.appName,
      settings: {
        ...currentSettings,
        website: data.website,
        industry: data.industry,
        value_proposition: data.valueProposition,
        onboarding_step: 2,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/onboarding');
  return { error: null };
}

/**
 * Save problem categories during onboarding
 */
export async function saveProblemCategories(
  orgId: string,
  categories: CategoryData[]
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Get existing categories for this org
  const { data: existing } = await supabase
    .from('problem_categories')
    .select('id, name')
    .eq('organization_id', orgId);

  const existingNames = new Set((existing || []).map((c) => c.name.toLowerCase()));

  // Filter to only new categories
  const newCategories = categories.filter(
    (cat) => !existingNames.has(cat.name.toLowerCase())
  );

  if (newCategories.length > 0) {
    const { error } = await supabase.from('problem_categories').insert(
      newCategories.map((cat) => ({
        organization_id: orgId,
        name: cat.name,
        keywords: cat.keywords || [],
        is_ai_generated: !cat.isCustom,
      }))
    );

    if (error) {
      return { error: new Error(error.message) };
    }
  }

  // Update onboarding step
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      settings: supabase.sql`settings || '{"onboarding_step": 3}'::jsonb`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (updateError) {
    // Non-critical error, continue
    console.error('Failed to update onboarding step:', updateError);
  }

  revalidatePath('/onboarding');
  return { error: null };
}

/**
 * Connect a platform during onboarding
 */
export async function connectPlatform(
  orgId: string,
  platformSlug: string,
  credentials: PlatformCredentials
): Promise<{ error: Error | null; platformId?: string }> {
  const supabase = createClient();

  // Get platform ID from slug
  const { data: platform, error: platformError } = await supabase
    .from('platforms')
    .select('id')
    .eq('slug', platformSlug)
    .single();

  if (platformError || !platform) {
    return { error: new Error('Platform not found') };
  }

  // Check if already connected
  const { data: existing } = await supabase
    .from('organization_platforms')
    .select('id')
    .eq('organization_id', orgId)
    .eq('platform_id', platform.id)
    .single();

  if (existing) {
    // Update existing connection
    const { error } = await supabase
      .from('organization_platforms')
      .update({
        credentials,
        is_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null, platformId: existing.id };
  }

  // Create new connection
  const { data: newConnection, error } = await supabase
    .from('organization_platforms')
    .insert({
      organization_id: orgId,
      platform_id: platform.id,
      credentials,
      is_enabled: true,
      search_config: {},
    })
    .select('id')
    .single();

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/onboarding');
  return { error: null, platformId: newConnection?.id };
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(
  orgId: string,
  platformConnectionId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('organization_platforms')
    .delete()
    .eq('id', platformConnectionId)
    .eq('organization_id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/onboarding');
  revalidatePath('/dashboard/settings/platforms');
  return { error: null };
}

/**
 * Invite team member during onboarding
 */
export async function inviteTeamMember(
  orgId: string,
  email: string,
  role: UserRole
): Promise<{ error: Error | null; inviteId?: string }> {
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
    .select('id, status')
    .eq('organization_id', orgId)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();

  if (existingInvite) {
    return { error: new Error('An invitation has already been sent to this email') };
  }

  // Create invitation
  const { data: invite, error } = await supabase
    .from('invitations')
    .insert({
      organization_id: orgId,
      email: email.toLowerCase(),
      role,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select('id')
    .single();

  if (error) {
    return { error: new Error(error.message) };
  }

  // TODO: Send invitation email via edge function or email service
  // await sendInvitationEmail(email, invite.id, orgId);

  revalidatePath('/onboarding');
  return { error: null, inviteId: invite?.id };
}

/**
 * Send multiple team invitations
 */
export async function inviteTeamMembers(
  orgId: string,
  invites: TeamInviteData[]
): Promise<{
  error: Error | null;
  results: { email: string; success: boolean; error?: string }[]
}> {
  const results: { email: string; success: boolean; error?: string }[] = [];

  for (const invite of invites) {
    const result = await inviteTeamMember(orgId, invite.email, invite.role);
    results.push({
      email: invite.email,
      success: !result.error,
      error: result.error?.message,
    });
  }

  const hasErrors = results.some((r) => !r.success);
  return {
    error: hasErrors ? new Error('Some invitations failed') : null,
    results,
  };
}

/**
 * Complete onboarding process
 */
export async function completeOnboarding(
  orgId: string
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  // Update organization settings
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
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        onboarding_step: 5,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) {
    return { error: new Error(error.message) };
  }

  revalidatePath('/dashboard');
  return { error: null };
}

/**
 * Get current onboarding status
 */
export async function getOnboardingStatus(
  orgId: string
): Promise<{
  error: Error | null;
  status?: {
    currentStep: number;
    completed: boolean;
    profile: boolean;
    categories: boolean;
    platforms: boolean;
    team: boolean;
  }
}> {
  const supabase = createClient();

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single();

  if (orgError) {
    return { error: new Error(orgError.message) };
  }

  const settings = org.settings as Record<string, unknown>;
  const currentStep = (settings.onboarding_step as number) || 1;
  const completed = (settings.onboarding_completed as boolean) || false;

  // Check what's been completed
  const { data: categories } = await supabase
    .from('problem_categories')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1);

  const { data: platforms } = await supabase
    .from('organization_platforms')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1);

  const { count: teamCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  return {
    error: null,
    status: {
      currentStep,
      completed,
      profile: !!settings.value_proposition,
      categories: (categories?.length || 0) > 0,
      platforms: (platforms?.length || 0) > 0,
      team: (teamCount || 0) > 1, // More than just the owner
    },
  };
}
