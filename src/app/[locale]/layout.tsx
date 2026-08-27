import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { fontSans, fontArabic } from '@/lib/fonts';
import { routing } from '@/i18n/routing';
import { JsonLd } from '@/components/shared/json-ld';
import { clinicSchema, physicianSchema, websiteSchema } from '@/lib/seo/schema';
import { localeUrls } from '@/lib/seo/alternates';
import { SITE_NAME, SITE_URL } from '@/lib/seo/config';
import type { Locale } from '@/lib/i18n';
import { getClinic, listServices, listTeam } from '@/lib/content';
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
 * `themeColor` Metadata'da değil Viewport'ta durur (Next 14+).
 * Değer logonun laciverdi — Android adres çubuğu markayla aynı renkte olur.
 */
export const viewport: Viewport = {
  themeColor: '#012d5b',
  colorScheme: 'light',
};

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
    applicationName: name,
    // Bir hekim kliniği: yayıncı ve içerik sahibi aynı varlık.
    publisher: name,
    // iOS telefon numaralarını kendi kendine linkler ve <bdi>/adres
    // bloklarını bozar; telefon linklerini biz zaten veriyoruz.
    formatDetection: { telephone: false, address: false, email: false },
    appleWebApp: { capable: false, title: 'Dr. Murat Irmak' },
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

  const typedLocale = locale as Locale;
  const homeUrl = localeUrls('/')[typedLocale];
  const leadPhysician = listTeam(typedLocale).find(
    (member) => member.name === clinic.doctor.name,
  );

  /**
   * Site genelinde geçerli üç varlık: site, klinik, hekim.
   * `founder`/`employee` referansları boşta kalmasın diye hekim şeması
   * klinikle birlikte, her sayfada basılır.
   */
  const siteSchema = [
    websiteSchema(typedLocale, homeUrl),
    clinicSchema(typedLocale, tFooter('about'), listServices(typedLocale)),
    ...(physicianSchema(typedLocale, leadPhysician)
      ? [physicianSchema(typedLocale, leadPhysician)!]
      : []),
  ];

  return (
    <html
      lang={locale}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`${fontSans.variable} ${fontArabic.variable} ${
        isRtl ? 'font-arabic' : 'font-sans'
      }`}
    >
      <body className="bg-bg-base text-text-primary antialiased">
        {/* Klinik ve hekim tekil varlıklar; her sayfada @id ile referans verilir. */}
        <JsonLd data={siteSchema} />
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
