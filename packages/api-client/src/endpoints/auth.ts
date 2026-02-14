import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoginRequest, SignupRequest, LoginResponse, ApiResult } from 'shared-types';

export class AuthApi {
  constructor(private supabase: SupabaseClient) {}

  async login(request: LoginRequest): Promise<ApiResult<LoginResponse>> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });

    if (error) {
      return {
        data: null,
        error: {
          code: error.name,
          message: error.message,
        },
      };
    }

    if (!data.user || !data.session) {
      return {
        data: null,
        error: {
          code: 'AUTH_ERROR',
          message: 'Failed to authenticate',
        },
      };
    }

    // Fetch user's organization
    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select('organization_id, role, organizations(id, name, slug)')
      .eq('id', data.user.id)
      .single();

    if (userError || !userData) {
      return {
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      };
    }

    const org = userData.organizations as unknown as { id: string; name: string; slug: string };

    return {
      data: {
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: userData.role,
        },
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at!,
        },
      },
      error: null,
    };
  }

  async signup(request: SignupRequest): Promise<ApiResult<LoginResponse>> {
    // Sign up the user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
      email: request.email,
      password: request.password,
      options: {
        data: {
          full_name: request.fullName,
        },
      },
    });

    if (authError || !authData.user) {
      return {
        data: null,
        error: {
          code: authError?.name || 'SIGNUP_ERROR',
          message: authError?.message || 'Failed to create account',
        },
      };
    }

    // Create organization
    const { data: orgData, error: orgError } = await this.supabase
      .from('organizations')
      .insert({
        name: request.organizationName,
        slug: request.organizationName.toLowerCase().replace(/\s+/g, '-'),
      })
      .select()
      .single();

    if (orgError || !orgData) {
      return {
        data: null,
        error: {
          code: 'ORG_CREATE_ERROR',
          message: 'Failed to create organization',
        },
      };
    }

    // Create user profile
    const { error: profileError } = await this.supabase.from('users').insert({
      id: authData.user.id,
      organization_id: orgData.id,
      email: request.email,
      full_name: request.fullName,
      role: 'owner',
    });

    if (profileError) {
      return {
        data: null,
        error: {
          code: 'PROFILE_CREATE_ERROR',
          message: 'Failed to create user profile',
        },
      };
    }

    return {
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          role: 'owner',
        },
        organization: {
          id: orgData.id,
          name: orgData.name,
          slug: orgData.slug,
        },
        session: {
          access_token: authData.session?.access_token || '',
          refresh_token: authData.session?.refresh_token || '',
          expires_at: authData.session?.expires_at || 0,
        },
      },
      error: null,
    };
  }

  async logout(): Promise<ApiResult<null>> {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      return {
        data: null,
        error: {
          code: error.name,
          message: error.message,
        },
      };
    }

    return { data: null, error: null };
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
