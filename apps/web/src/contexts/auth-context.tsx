'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { User, UserRole } from 'shared-types';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string | null;
  avatarUrl: string | null;
  organizationId: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    organizationName: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession?: Session | null;
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: initialSession ?? null,
    isLoading: true,
    isAuthenticated: false,
  });
  const router = useRouter();
  const supabase = createClient();

  // Fetch user profile from database
  const fetchUserProfile = useCallback(
    async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, full_name, avatar_url, organization_id')
        .eq('id', supabaseUser.id)
        .single();

      if (error || !data) {
        console.error('Failed to fetch user profile:', error);
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        role: data.role as UserRole,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        organizationId: data.organization_id,
      };
    },
    [supabase]
  );

  // Handle auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setState({
          user: userProfile,
          session,
          isLoading: false,
          isAuthenticated: !!userProfile,
        });
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    // Initial session check
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setState({
          user: userProfile,
          session,
          isLoading: false,
          isAuthenticated: !!userProfile,
        });
      } else {
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile, router]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    router.push('/dashboard');
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    organizationName: string
  ) => {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError || !authData.user) {
      return { error: new Error(authError?.message || 'Failed to create account') };
    }

    // Create organization
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organizationName,
        slug,
        settings: {
          theme: 'default',
          auto_post_enabled: false,
          daily_post_limit: 20,
          review_required_risk_levels: ['medium', 'high', 'blocked'],
        },
      })
      .select()
      .single();

    if (orgError || !orgData) {
      return { error: new Error('Failed to create organization') };
    }

    // Create or update user profile (upsert handles trigger-created records)
    const { error: profileError } = await supabase.from('users').upsert(
      {
        id: authData.user.id,
        organization_id: orgData.id,
        email,
        full_name: fullName,
        role: 'owner',
        notification_preferences: { push: true, email: true },
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false,
      }
    );

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return { error: new Error('Failed to create user profile') };
    }

    router.push('/dashboard');
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.push('/login');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  };

  const refreshSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.refreshSession();

    if (session?.user) {
      const userProfile = await fetchUserProfile(session.user);
      setState({
        user: userProfile,
        session,
        isLoading: false,
        isAuthenticated: !!userProfile,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
