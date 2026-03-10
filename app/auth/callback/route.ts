import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/app';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error.message);
        return NextResponse.redirect(
          new URL('/auth/login?error=authentication_failed', request.url)
        );
      }

      return NextResponse.redirect(new URL(next, request.url));
      
    } catch (error) {
      console.error('Unexpected auth error:', error);
      return NextResponse.redirect(
        new URL('/auth/login?error=unexpected_error', request.url)
      );
    }
  }

  return NextResponse.redirect(new URL('/auth/login', request.url));
}
