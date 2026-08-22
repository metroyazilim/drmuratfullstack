import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { matchLegacyRedirect } from '@/lib/seo/legacy-redirects';

const intlMiddleware = createMiddleware(routing);

const supportedLocales = new Set<string>(routing.locales);

/**
 * `/de`, `/fr` gibi desteklenmeyen dil kodları.
 *
 * next-intl bunları tanımadığı için `/tr/de`'ye yönlendirir ve orada 404
 * verir — olmayan bir dil için önce yanlış bir yönlendirme sinyali üretilir.
 * İki harfli bilinmeyen kodu yönlendirmeden geçirip doğrudan 404'e düşürüyoruz.
 */
function isUnsupportedLocaleSegment(pathname: string): boolean {
  const segment = pathname.split('/')[1];
  if (!segment || segment.length !== 2) return false;
  return !supportedLocales.has(segment);
}

export default function proxy(request: NextRequest) {
  // Eski site URL'leri locale prefix'i eklenmeden ÖNCE yakalanır;
  // böylece yönlendirme tek adımda olur (zincir yok).
  const legacy = matchLegacyRedirect(request.nextUrl);
  if (legacy) {
    return NextResponse.redirect(new URL(legacy, request.url), 308);
  }

  if (isUnsupportedLocaleSegment(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
