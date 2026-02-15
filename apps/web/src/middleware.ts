import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/auth/confirm',
];

// Demo routes - allow access for testing without auth
// In demo mode, all dashboard routes are accessible
const demoRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/auth/')
  );

  // Check if the path is an auth route (login, signup, etc.)
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Check if the path is a dashboard route
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Check if demo mode is enabled (all dashboard routes accessible without auth)
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

  // Check if the path is a demo route (allows unauthenticated access for testing)
  const isDemoRoute = isDemoMode && isDashboardRoute;

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and trying to access dashboard (except in demo mode), redirect to login
  if (!user && isDashboardRoute && !isDemoRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // For API routes, check authentication and return 401 if not authenticated
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - static assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
