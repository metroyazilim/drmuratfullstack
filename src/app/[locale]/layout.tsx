import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { fontSans, fontArabic } from '@/lib/fonts';
import { routing } from '@/i18n/routing';
import { JsonLd } from '@/components/shared/json-ld';
import { clinicSchema } from '@/lib/seo/schema';
import { SITE_NAME, SITE_URL } from '@/lib/seo/config';
import type { Locale } from '@/lib/i18n';
import { getClinic } from '@/lib/content';
import { SkipLink } from '@/components/shared/skip-link';
import { TopBar } from '@/components/shared/top-bar';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { FloatingActions } from '@/components/shared/floating-actions';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Kök metadata yalnızca metadataBase ve başlık şablonunu kurar.
 * Sayfaya özel metadata her route'un kendi generateMetadata'sından,
 * buildMetadata() üzerinden gelir (architecture.md → Invariant 3).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const name = hasLocale(routing.locales, locale)
    ? SITE_NAME[locale as Locale]
    : SITE_NAME.tr;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: name, template: `%s | ${name}` },
  };
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const isRtl = locale === 'ar';
  const clinic = getClinic();
  const tFooter = await getTranslations({ locale, namespace: 'footer' });

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${fontSans.variable} ${fontArabic.variable} ${
        isRtl ? 'font-arabic' : 'font-sans'
      }`}
    >
      <body className="bg-bg-base text-text-primary antialiased">
        {/* Klinik tekil bir varlık; her sayfada @id ile referans verilir. */}
        <JsonLd data={clinicSchema(locale as Locale, tFooter('about'))} />
        <NextIntlClientProvider messages={messages}>
          <SkipLink />
          <TopBar />
          <Header />
          {/* Sayfalar kendi <main>'ini açmaz; yalnızca içerik döner. */}
          <main id="main-content">{children}</main>
          <Footer locale={locale} />
          <FloatingActions
            phone={clinic.contact.phone}
            whatsapp={clinic.contact.whatsapp}
          />
          <Analytics />
          <SpeedInsights />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
