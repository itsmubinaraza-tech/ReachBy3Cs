import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditLog, DeviceType, ApiResult } from 'shared-types';

export interface AuditLogInsert {
  organization_id: string;
  user_id?: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  action_data?: Record<string, unknown>;
  previous_state?: Record<string, unknown>;
  new_state?: Record<string, unknown>;
  device_type?: DeviceType;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export class AuditLogRepository {
  private tableName = 'audit_log';

  constructor(private supabase: SupabaseClient) {}

  private handleError(error: unknown): ApiResult<never> {
    const err = error as { message?: string; code?: string };
    return {
      data: null,
      error: {
        code: err.code || 'DATABASE_ERROR',
        message: err.message || 'An unexpected database error occurred',
      },
    };
  }

  async create(input: AuditLogInsert): Promise<ApiResult<AuditLog>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(input)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as AuditLog, error: null };
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ApiResult<AuditLog[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as AuditLog[], error: null };
  }

  async findByOrganization(
    organizationId: string,
    options: {
      limit?: number;
      offset?: number;
      actionType?: string;
      entityType?: string;
      userId?: string;
      since?: string;
    } = {}
  ): Promise<ApiResult<AuditLog[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (options.actionType) {
      query = query.eq('action_type', options.actionType);
    }
    if (options.entityType) {
      query = query.eq('entity_type', options.entityType);
    }
    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }
    if (options.since) {
      query = query.gte('created_at', options.since);
    }

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as AuditLog[], error: null };
  }

  async findByUser(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ApiResult<AuditLog[]>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as AuditLog[], error: null };
  }

  // Helper methods for common audit actions
  async logResponseApproved(
    organizationId: string,
    userId: string,
    responseId: string,
    deviceType: DeviceType,
    previousStatus: string
  ): Promise<ApiResult<AuditLog>> {
    return this.create({
      organization_id: organizationId,
      user_id: userId,
      action_type: 'response.approved',
      entity_type: 'response',
      entity_id: responseId,
      previous_state: { status: previousStatus },
      new_state: { status: 'approved' },
      device_type: deviceType,
    });
  }

  async logResponseRejected(
    organizationId: string,
    userId: string,
    responseId: string,
    deviceType: DeviceType,
    reason?: string
  ): Promise<ApiResult<AuditLog>> {
    return this.create({
      organization_id: organizationId,
      user_id: userId,
      action_type: 'response.rejected',
      entity_type: 'response',
      entity_id: responseId,
      action_data: { reason },
      new_state: { status: 'rejected' },
      device_type: deviceType,
    });
  }

  async logResponsePosted(
    organizationId: string,
    responseId: string,
    externalId: string,
    externalUrl: string,
    isAutoPost: boolean
  ): Promise<ApiResult<AuditLog>> {
    return this.create({
      organization_id: organizationId,
      action_type: isAutoPost ? 'response.auto_posted' : 'response.posted',
      entity_type: 'response',
      entity_id: responseId,
      action_data: { external_id: externalId, external_url: externalUrl },
      new_state: { status: 'posted' },
      device_type: 'api',
    });
  }

  async logPostDetected(
    organizationId: string,
    postId: string,
    platformSlug: string,
    detectionMethod: string
  ): Promise<ApiResult<AuditLog>> {
    return this.create({
      organization_id: organizationId,
      action_type: 'post.detected',
      entity_type: 'post',
      entity_id: postId,
      action_data: { platform: platformSlug, detection_method: detectionMethod },
      device_type: 'api',
    });
  }

  async logSignalGenerated(
    organizationId: string,
    signalId: string,
    processingTimeMs: number,
    modelUsed: string
  ): Promise<ApiResult<AuditLog>> {
    return this.create({
      organization_id: organizationId,
      action_type: 'signal.generated',
      entity_type: 'signal',
      entity_id: signalId,
      action_data: { processing_time_ms: processingTimeMs, model: modelUsed },
      device_type: 'api',
    });
  }
}
