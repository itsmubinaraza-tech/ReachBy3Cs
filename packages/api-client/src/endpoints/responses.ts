import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApproveResponseRequest, RejectResponseRequest, ApiResult, Response } from 'shared-types';

export class ResponsesApi {
  constructor(private supabase: SupabaseClient) {}

  async approve(request: ApproveResponseRequest): Promise<ApiResult<Response>> {
    const { data: session } = await this.supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      };
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_device: request.deviceType,
    };

    // Handle edited response
    if (request.editedResponse) {
      updateData.edited_response = request.editedResponse;
      updateData.edited_by = userId;
      updateData.edited_at = new Date().toISOString();
      updateData.selected_response = request.editedResponse;
      updateData.status = 'edited';
    }

    // Handle type change
    if (request.selectedType) {
      updateData.selected_type = request.selectedType;
    }

    // Add notes
    if (request.notes) {
      updateData.review_notes = request.notes;
    }

    const { data, error } = await this.supabase
      .from('responses')
      .update(updateData)
      .eq('id', request.responseId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message,
        },
      };
    }

    // Update queue status
    await this.supabase
      .from('engagement_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('response_id', request.responseId);

    // Log audit event
    await this.logAuditEvent(userId, 'response.approved', 'response', request.responseId, {
      deviceType: request.deviceType,
      editedResponse: request.editedResponse,
      selectedType: request.selectedType,
    });

    return { data: data as Response, error: null };
  }

  async reject(request: RejectResponseRequest): Promise<ApiResult<Response>> {
    const { data: session } = await this.supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      return {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      };
    }

    const { data, error } = await this.supabase
      .from('responses')
      .update({
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_device: request.deviceType,
        review_notes: request.reason,
      })
      .eq('id', request.responseId)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message,
        },
      };
    }

    // Update queue status
    await this.supabase
      .from('engagement_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('response_id', request.responseId);

    // Log audit event
    await this.logAuditEvent(userId, 'response.rejected', 'response', request.responseId, {
      deviceType: request.deviceType,
      reason: request.reason,
    });

    return { data: data as Response, error: null };
  }

  async getById(responseId: string): Promise<ApiResult<Response>> {
    const { data, error } = await this.supabase
      .from('responses')
      .select('*')
      .eq('id', responseId)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          code: 'QUERY_ERROR',
          message: error.message,
        },
      };
    }

    return { data: data as Response, error: null };
  }

  private async logAuditEvent(
    userId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    actionData: Record<string, unknown>
  ) {
    // Get user's organization
    const { data: userData } = await this.supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!userData) return;

    await this.supabase.from('audit_log').insert({
      organization_id: userData.organization_id,
      user_id: userId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      action_data: actionData,
      device_type: actionData.deviceType,
    });
  }
}
