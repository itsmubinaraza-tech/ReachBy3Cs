import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Check if we're in demo mode (no real Supabase connection)
function isDemoMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  return (
    demoMode ||
    !supabaseUrl ||
    supabaseUrl.includes('placeholder') ||
    supabaseUrl === 'https://placeholder.supabase.co'
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // In demo mode, skip Supabase auth and return null user
  if (isDemoMode()) {
    return { response, user: null, supabase: null };
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
