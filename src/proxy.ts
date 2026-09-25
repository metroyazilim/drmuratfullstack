import { NextResponse, type NextRequest } from 'next/server';
import { matchLegacyRedirect } from '@/lib/seo/legacy-redirects';

export default function proxy(request: NextRequest) {
  const legacy = matchLegacyRedirect(request.nextUrl);
  if (legacy) return NextResponse.redirect(new URL(legacy, request.url), 308);
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
