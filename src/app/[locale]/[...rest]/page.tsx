import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type PageProps = {
  params: Promise<{ locale: string; rest: string[] }>;
};

/**
 * Locale altındaki eşleşmeyen yolları yakalar.
 *
 * Bu route olmadan `/tr/yok-boyle` isteği KÖK not-found'a düşüyor ve
 * kullanıcı header, footer ve menüyü kaybediyordu. Buradan `notFound()`
 * çağrılınca `[locale]/not-found.tsx` locale layout'unun İÇİNDE render
 * edilir — kullanıcı siteye dönüş yolunu kaybetmez.
 */
export default async function CatchAllPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}
