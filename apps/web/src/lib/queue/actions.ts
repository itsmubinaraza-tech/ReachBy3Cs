'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { DeviceType, ResponseStatus, ResponseType } from 'shared-types';

/**
 * Result type for queue actions
 */
export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Approve a response and log to audit
 */
export async function approveResponse(
  id: string,
  deviceType: DeviceType,
  selectedType?: ResponseType,
  notes?: string
): Promise<ActionResult> {
  const supabase = createClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user profile for organization_id
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    // Get current response state for audit log
    const { data: currentResponse, error: fetchError } = await supabase
      .from('responses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentResponse) {
      return { success: false, error: 'Response not found' };
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status: 'approved' as ResponseStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_device: deviceType,
      review_notes: notes || null,
    };

    // If a different response type was selected, update selected_response
    if (selectedType && selectedType !== currentResponse.selected_type) {
      const responseMap: Record<string, string | null> = {
        value_first: currentResponse.value_first_response,
        soft_cta: currentResponse.soft_cta_response,
        contextual: currentResponse.contextual_response,
      };
      updateData.selected_type = selectedType;
      updateData.selected_response = responseMap[selectedType] || currentResponse.selected_response;
    }

    // Update response
    const { error: updateError } = await supabase
      .from('responses')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return { success: false, error: `Failed to approve: ${updateError.message}` };
    }

    // Create audit log entry
    const { error: auditError } = await supabase.from('audit_log').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action_type: 'response.approved',
      action_category: 'engagement',
      entity_type: 'response',
      entity_id: id,
      action_data: { selectedType, notes },
      previous_state: { status: currentResponse.status },
      new_state: { status: 'approved' },
      device_type: deviceType,
    });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the action for audit log errors
    }

    revalidatePath('/dashboard/queue');
    return { success: true };
  } catch (error) {
    console.error('Error approving response:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Reject a response with reason
 */
export async function rejectResponse(
  id: string,
  reason: string | null,
  deviceType: DeviceType
): Promise<ActionResult> {
  const supabase = createClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    // Get current response state
    const { data: currentResponse, error: fetchError } = await supabase
      .from('responses')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError || !currentResponse) {
      return { success: false, error: 'Response not found' };
    }

    // Update response
    const { error: updateError } = await supabase
      .from('responses')
      .update({
        status: 'rejected' as ResponseStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_device: deviceType,
        review_notes: reason,
      })
      .eq('id', id);

    if (updateError) {
      return { success: false, error: `Failed to reject: ${updateError.message}` };
    }

    // Create audit log
    const { error: auditError } = await supabase.from('audit_log').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action_type: 'response.rejected',
      action_category: 'engagement',
      entity_type: 'response',
      entity_id: id,
      action_data: { reason },
      previous_state: { status: currentResponse.status },
      new_state: { status: 'rejected' },
      device_type: deviceType,
    });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/queue');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting response:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Edit response before approving
 */
export async function editResponse(
  id: string,
  newText: string,
  deviceType: DeviceType
): Promise<ActionResult> {
  const supabase = createClient();

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    // Get current response
    const { data: currentResponse, error: fetchError } = await supabase
      .from('responses')
      .select('selected_response, status')
      .eq('id', id)
      .single();

    if (fetchError || !currentResponse) {
      return { success: false, error: 'Response not found' };
    }

    // Update response with edit
    const { error: updateError } = await supabase
      .from('responses')
      .update({
        status: 'edited' as ResponseStatus,
        original_response: currentResponse.selected_response,
        edited_response: newText,
        selected_response: newText,
        edited_by: user.id,
        edited_at: new Date().toISOString(),
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_device: deviceType,
      })
      .eq('id', id);

    if (updateError) {
      return { success: false, error: `Failed to edit: ${updateError.message}` };
    }

    // Create audit log
    const { error: auditError } = await supabase.from('audit_log').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action_type: 'response.edited',
      action_category: 'engagement',
      entity_type: 'response',
      entity_id: id,
      action_data: { newText },
      previous_state: {
        status: currentResponse.status,
        selected_response: currentResponse.selected_response,
      },
      new_state: {
        status: 'edited',
        selected_response: newText,
      },
      device_type: deviceType,
    });

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    revalidatePath('/dashboard/queue');
    return { success: true };
  } catch (error) {
    console.error('Error editing response:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Bulk approve multiple responses
 */
export async function bulkApprove(
  ids: string[],
  deviceType: DeviceType
): Promise<ActionResult & { successCount?: number; failCount?: number }> {
  const supabase = createClient();

  try {
    if (ids.length === 0) {
      return { success: false, error: 'No items selected' };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    const now = new Date().toISOString();

    // Update all responses
    const { data: updatedResponses, error: updateError } = await supabase
      .from('responses')
      .update({
        status: 'approved' as ResponseStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        review_device: deviceType,
      })
      .in('id', ids)
      .select('id');

    if (updateError) {
      return { success: false, error: `Failed to bulk approve: ${updateError.message}` };
    }

    const successCount = updatedResponses?.length || 0;
    const failCount = ids.length - successCount;

    // Create audit log entries for each
    const auditEntries = ids.map((id) => ({
      organization_id: profile.organization_id,
      user_id: user.id,
      action_type: 'response.bulk_approved',
      action_category: 'engagement',
      entity_type: 'response',
      entity_id: id,
      action_data: { bulk: true, totalInBatch: ids.length },
      previous_state: { status: 'pending' },
      new_state: { status: 'approved' },
      device_type: deviceType,
    }));

    const { error: auditError } = await supabase.from('audit_log').insert(auditEntries);

    if (auditError) {
      console.error('Failed to create audit logs:', auditError);
    }

    revalidatePath('/dashboard/queue');
    return { success: true, successCount, failCount };
  } catch (error) {
    console.error('Error bulk approving:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Bulk reject multiple responses
 */
export async function bulkReject(
  ids: string[],
  reason: string | null,
  deviceType: DeviceType
): Promise<ActionResult & { successCount?: number; failCount?: number }> {
  const supabase = createClient();

  try {
    if (ids.length === 0) {
      return { success: false, error: 'No items selected' };
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'User profile not found' };
    }

    const now = new Date().toISOString();

    // Update all responses
    const { data: updatedResponses, error: updateError } = await supabase
      .from('responses')
      .update({
        status: 'rejected' as ResponseStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        review_device: deviceType,
        review_notes: reason,
      })
      .in('id', ids)
      .select('id');

    if (updateError) {
      return { success: false, error: `Failed to bulk reject: ${updateError.message}` };
    }

    const successCount = updatedResponses?.length || 0;
    const failCount = ids.length - successCount;

    // Create audit log entries
    const auditEntries = ids.map((id) => ({
      organization_id: profile.organization_id,
      user_id: user.id,
      action_type: 'response.bulk_rejected',
      action_category: 'engagement',
      entity_type: 'response',
      entity_id: id,
      action_data: { bulk: true, totalInBatch: ids.length, reason },
      previous_state: { status: 'pending' },
      new_state: { status: 'rejected' },
      device_type: deviceType,
    }));

    const { error: auditError } = await supabase.from('audit_log').insert(auditEntries);

    if (auditError) {
      console.error('Failed to create audit logs:', auditError);
    }

    revalidatePath('/dashboard/queue');
    return { success: true, successCount, failCount };
  } catch (error) {
    console.error('Error bulk rejecting:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
