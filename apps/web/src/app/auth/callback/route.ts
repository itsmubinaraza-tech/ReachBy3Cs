import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has a profile with an organization
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', data.user.id)
        .single();

      // If user has no organization, redirect to post-oauth setup
      if (!userProfile?.organization_id) {
        return NextResponse.redirect(`${origin}/post-oauth`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
