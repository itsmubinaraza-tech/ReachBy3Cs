import type { SupabaseClient } from '@supabase/supabase-js';
import type { ApiResult } from 'shared-types';

/**
 * Base repository class with common CRUD operations
 */
export abstract class BaseRepository<T, TInsert, TUpdate> {
  protected abstract tableName: string;

  constructor(protected supabase: SupabaseClient) {}

  protected handleError(error: unknown): ApiResult<never> {
    const err = error as { message?: string; code?: string };
    return {
      data: null,
      error: {
        code: err.code || 'DATABASE_ERROR',
        message: err.message || 'An unexpected database error occurred',
      },
    };
  }

  async findById(id: string): Promise<ApiResult<T>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as T, error: null };
  }

  async findMany(
    filters: Partial<Record<keyof T, unknown>> = {},
    options: {
      limit?: number;
      offset?: number;
      orderBy?: keyof T;
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<ApiResult<T[]>> {
    let query = this.supabase.from(this.tableName).select('*');

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy as string, {
        ascending: options.orderDirection !== 'desc',
      });
    }

    // Apply pagination
    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: data as T[], error: null };
  }

  async create(input: TInsert): Promise<ApiResult<T>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(input as Record<string, unknown>)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as T, error: null };
  }

  async createMany(inputs: TInsert[]): Promise<ApiResult<T[]>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(inputs as Record<string, unknown>[])
      .select();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as T[], error: null };
  }

  async update(id: string, input: Partial<TUpdate>): Promise<ApiResult<T>> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(input as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.handleError(error);
    }

    return { data: data as T, error: null };
  }

  async delete(id: string): Promise<ApiResult<null>> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      return this.handleError(error);
    }

    return { data: null, error: null };
  }

  async count(filters: Partial<Record<keyof T, unknown>> = {}): Promise<ApiResult<number>> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    }

    const { count, error } = await query;

    if (error) {
      return this.handleError(error);
    }

    return { data: count || 0, error: null };
  }
}
