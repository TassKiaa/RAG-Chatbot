import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createServerComponentClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return user to an error layout page if verification fails
  return NextResponse.redirect(`${origin}/login?message=Could not verify authentication credentials`);
}