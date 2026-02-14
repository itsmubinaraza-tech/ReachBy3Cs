import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type { SupabaseClient };

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Create a Supabase client
 * This is a factory function that can be used in both web and mobile
 */
export function createSupabaseClient(config: SupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

/**
 * Get environment variables for Supabase
 * Works in both Next.js and React Native environments
 */
export function getSupabaseConfig(): SupabaseConfig {
  // Next.js environment variables
  const nextUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
  const nextKey =
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

  // Expo environment variables (for React Native)
  const expoUrl = typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SUPABASE_URL : undefined;
  const expoKey =
    typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : undefined;

  const url = nextUrl || expoUrl;
  const anonKey = nextKey || expoKey;

  if (!url || !anonKey) {
    throw new Error('Supabase URL and anon key are required');
  }

  return { url, anonKey };
}
