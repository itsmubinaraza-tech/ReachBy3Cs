import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  User,
  UserInsert,
  UserUpdate,
  UserRole,
  UserNotificationPreferences,
  ApiResult,
} from 'shared-types';
import { BaseRepository } from './base';

export class UserRepository extends BaseRepository<User, UserInsert, UserUpdate> {
  protected tableName = 'users';

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  async findByEmail(email: string): Promise<ApiResult<User>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as User, error: null };
  }

  async findByOrganization(organizationId: string): Promise<ApiResult<User[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      return this.handleError(error);
    }

    return { data: data as User[], error: null };
  }

  async updateRole(userId: string, role: UserRole): Promise<ApiResult<User>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as User, error: null };
  }

  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<ApiResult<User>> {
    // First get current preferences
    const { data: current, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return this.handleError(fetchError);
    }

    // Merge preferences
    const mergedPreferences = {
      ...(current?.notification_preferences || {}),
      ...preferences,
    };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        notification_preferences: mergedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as User, error: null };
  }

  async updateLastActive(userId: string): Promise<ApiResult<null>> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      return this.handleError(error);
    }

    return { data: null, error: null };
  }

  async getWithOrganization(userId: string): Promise<ApiResult<User & { organization: unknown }>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(`
        *,
        organization:organizations(id, name, slug, settings)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as User & { organization: unknown }, error: null };
  }
}
