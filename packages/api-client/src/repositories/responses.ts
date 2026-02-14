import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Response,
  ResponseInsert,
  ResponseUpdate,
  ResponseStatus,
  ResponseWithContext,
  DeviceType,
  ApiResult,
} from 'shared-types';
import { BaseRepository } from './base';

export class ResponseRepository extends BaseRepository<
  Response,
  ResponseInsert,
  ResponseUpdate
> {
  protected tableName = 'responses';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findBySignalId(signalId: string): Promise<ApiResult<Response | null>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('signal_id', signalId)
      .maybeSingle();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response | null, error: null };
  }

  async findByStatus(
    organizationId: string,
    status: ResponseStatus,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApiResult<Response[]>> {
    // Need to join through signals to posts to get organization_id
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        signal:signals!inner(
          post:posts!inner(organization_id)
        )
      `)
      .eq('signal.post.organization_id', organizationId)
      .eq('status', status)
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

    return { data: data as Response[], error: null };
  }

  async findWithFullContext(responseId: string): Promise<ApiResult<ResponseWithContext>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        signal:signals!inner(
          *,
          risk_score:risk_scores(*),
          post:posts!inner(
            *,
            platform:platforms(*)
          ),
          problem_category:problem_categories(*)
        ),
        cluster:clusters(*)
      `)
      .eq('id', responseId)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as unknown as ResponseWithContext, error: null };
  }

  async approve(
    responseId: string,
    reviewerId: string,
    deviceType: DeviceType,
    notes?: string
  ): Promise<ApiResult<Response>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_device: deviceType,
        review_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response, error: null };
  }

  async reject(
    responseId: string,
    reviewerId: string,
    deviceType: DeviceType,
    reason?: string
  ): Promise<ApiResult<Response>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        review_device: deviceType,
        review_notes: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response, error: null };
  }

  async edit(
    responseId: string,
    editedResponse: string,
    editorId: string
  ): Promise<ApiResult<Response>> {
    // First get the current response to store as original
    const { data: current, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('selected_response, original_response')
      .eq('id', responseId)
      .single();

    if (fetchError) {
      return this.handleError(fetchError);
    }

    // Store original only if not already stored
    const originalResponse = current?.original_response || current?.selected_response;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'edited',
        original_response: originalResponse,
        edited_response: editedResponse,
        selected_response: editedResponse,
        edited_by: editorId,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response, error: null };
  }

  async markPosted(
    responseId: string,
    externalId: string,
    externalUrl: string
  ): Promise<ApiResult<Response>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        posted_external_id: externalId,
        posted_external_url: externalUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response, error: null };
  }

  async markFailed(responseId: string, errorMessage: string): Promise<ApiResult<Response>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status: 'failed',
        posting_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response, error: null };
  }

  async getAutoPostEligible(organizationId: string): Promise<ApiResult<Response[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        signal:signals!inner(
          post:posts!inner(organization_id)
        )
      `)
      .eq('signal.post.organization_id', organizationId)
      .eq('status', 'pending')
      .eq('can_auto_post', true)
      .order('created_at', { ascending: true });

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response[], error: null };
  }

  async getByCluster(clusterId: string): Promise<ApiResult<Response[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('cluster_id', clusterId)
      .order('created_at', { ascending: false });

    if (error) {
      return this.handleError(error);
    }

    return { data: data as Response[], error: null };
  }
}
