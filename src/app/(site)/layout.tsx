import type { Metadata, Viewport } from 'next';
import { fontSans } from '@/lib/fonts';
import { JsonLd } from '@/components/shared/json-ld';
import { clinicSchema, physicianSchema, websiteSchema } from '@/lib/seo/schema';
import { SITE_NAME, SITE_URL, absoluteUrl } from '@/lib/seo/config';
import { LOCALE } from '@/lib/site-routes';
import { getClinic, listTeam, listServices } from '@/lib/content';
import { getTranslations } from '@/lib/strings';
import { SkipLink } from '@/components/shared/skip-link';
import { TopBar } from '@/components/shared/top-bar';
import { Header } from '@/components/shared/header';
import { Footer } from '@/components/shared/footer';
import { FloatingActions } from '@/components/shared/floating-actions';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

/**
 * İçerik artık panelden de gelebildiği için sayfalar build'de donmaz.
 */
export const revalidate = 300;

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
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  applicationName: SITE_NAME,
  // Bir hekim kliniği: yayıncı ve içerik sahibi aynı varlık.
  publisher: SITE_NAME,
  // iOS telefon numaralarını kendi kendine linkler ve <bdi>/adres
  // bloklarını bozar; telefon linklerini biz zaten veriyoruz.
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: false, title: 'Dr. Murat Irmak' },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [tFooter, clinic, team, services] = await Promise.all([
    getTranslations('footer'),
    getClinic(),
    listTeam(LOCALE),
    listServices(LOCALE),
  ]);
  const homeUrl = absoluteUrl('/');
  const leadPhysician = team.find((member) => member.name === clinic.doctor.name);

  /**
   * Site genelinde geçerli üç varlık: site, klinik, hekim.
   * `founder`/`employee` referansları boşta kalmasın diye hekim şeması
   * klinikle birlikte, her sayfada basılır.
   */
  const physician = physicianSchema(LOCALE, leadPhysician, clinic);
  const siteSchema = [
    websiteSchema(LOCALE, homeUrl),
    clinicSchema(LOCALE, tFooter('about'), clinic, services),
    ...(physician ? [physician] : []),
  ];

  return (
    <html lang="tr" dir="ltr" className={`${fontSans.variable} font-sans`}>
      <body className="bg-bg-base text-text-primary antialiased">
        {/* Klinik ve hekim tekil varlıklar; her sayfada @id ile referans verilir. */}
        <JsonLd data={siteSchema} />
        <SkipLink />
        <TopBar />
        <Header />
        {/* Sayfalar kendi <main>'ini açmaz; yalnızca içerik döner. */}
        <main id="main-content">{children}</main>
        <Footer />
        <FloatingActions phone={clinic.contact.phone} whatsapp={clinic.contact.whatsapp} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
