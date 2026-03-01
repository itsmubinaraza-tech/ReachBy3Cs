import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import type { Session, User, AuthError } from '@supabase/supabase-js';
import type { User as DbUser, UserRole } from 'shared-types';
import { supabase } from '../lib/supabase';
import { AppStorage } from '../lib/storage';

interface AuthState {
  user: User | null;
  dbUser: DbUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  authenticateWithBiometrics: () => Promise<boolean>;
  checkBiometricsAvailable: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    dbUser: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Fetch database user profile
  const fetchDbUser = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as DbUser;
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          const dbUser = await fetchDbUser(session.user.id);
          setState({
            user: session.user,
            dbUser,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        } else if (mounted) {
          setState({
            user: null,
            dbUser: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const dbUser = await fetchDbUser(session.user.id);
          setState({
            user: session.user,
            dbUser,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          AppStorage.clearSelectedOrgId();
          setState({
            user: null,
            dbUser: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setState(prev => ({
            ...prev,
            session,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchDbUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Create or update user profile in database (upsert handles trigger-created records)
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert(
          {
            id: data.user.id,
            email,
            full_name: fullName,
            role: 'member',
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        );

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    AppStorage.clearSelectedOrgId();
    AppStorage.clearQueueCache();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'nm-platform://reset-password',
    });
    return { error };
  }, []);

  const checkBiometricsAvailable = useCallback(async (): Promise<boolean> => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    const available = await checkBiometricsAvailable();
    if (!available) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your account',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    return result.success;
  }, [checkBiometricsAvailable]);

  const refreshUser = useCallback(async () => {
    if (state.user) {
      const dbUser = await fetchDbUser(state.user.id);
      setState(prev => ({ ...prev, dbUser }));
    }
  }, [state.user, fetchDbUser]);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    authenticateWithBiometrics,
    checkBiometricsAvailable,
    refreshUser,
    role: state.dbUser?.role ?? 'member',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
