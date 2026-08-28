import { getTranslations } from 'next-intl/server';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getAlternates, getClinic, listEntityIds } from '@/lib/content';
import { Container } from '@/components/ui/container';
import { Link } from '@/lib/i18n';
import { footerNav } from '@/lib/navigation';
import { DirectionsButton } from './directions-button';
import { mapsUrl } from '@/lib/utils/maps';
import { Brand } from './brand';
import type { Locale } from '@/lib/i18n';

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('nav');
  const tFooter = await getTranslations('footer');
  const tLegal = await getTranslations('legal');
  const tA11y = await getTranslations('a11y');
  const tMap = await getTranslations('map');
  const clinic = getClinic();

  // Harita, clinic.json'daki `address.geo` ile aynı noktayı gösterir;
  // LocalBusiness şeması ve harita tek kaynaktan beslenir.
  const geo = clinic.address.geo;

  // Yasal bağlantılar İÇERİKTEN türetilir; sabit slug listesi tutulmaz.
  // Slug dile göre değişiyor (tr: kvkk, en: privacy-policy) ve henüz
  // yazılmamış bir yasal sayfaya link vermek 404 üretirdi.
  const legalPages = listEntityIds('legal')
    .map((id) => ({ id, slugs: getAlternates('legal', id) }))
    .filter((entry): entry is { id: string; slugs: Record<Locale, string> } =>
      Boolean(entry.slugs),
    );

  return (
    <footer className="bg-bg-inverse text-text-inverse">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-4">
          {/* Marka + bülten */}
          <div className="lg:pe-6">
            <Brand inverse />
            {/* Klinik tanıtım metni dile göre çevrilir; clinic.json'daki
                description tek dildi ve her locale'de aynı Türkçe metni
                basıyordu. Künye (telefon, adres) clinic.json'da kalır,
                bu tanıtım cümlesi messages'a taşındı. */}
            <p className="text-text-inverse/60 mt-4 text-sm leading-relaxed">
              {tFooter('about')}
            </p>

            <div className="mt-6">
              <p className="text-text-inverse text-sm font-semibold">
                {tFooter('newsletterTitle')}
              </p>
              {/* SPEC-010'a kadar devre dışı: çalışmayan bir forma
                  e-posta girdirmek güven kaybettirir. */}
              <form className="mt-3 flex gap-2" aria-describedby="newsletter-note">
                <label htmlFor="newsletter-email" className="sr-only">
                  {tFooter('newsletterPlaceholder')}
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  disabled
                  placeholder={tFooter('newsletterPlaceholder')}
                  className="border-border-inverse text-text-inverse placeholder:text-text-inverse/40 h-11 w-full rounded-md border bg-transparent px-3 text-sm disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled
                  className="bg-accent-primary text-text-inverse h-11 shrink-0 rounded-md px-4 text-sm font-semibold disabled:opacity-50"
                >
                  {tFooter('newsletterSubmit')}
                </button>
              </form>
              <p id="newsletter-note" className="text-text-inverse/40 mt-2 text-xs">
                {tFooter('newsletterSoon')}
              </p>
            </div>
          </div>

          <nav aria-label={tFooter('corporate')}>
            <h2 className="text-text-inverse text-sm font-semibold">
              {tFooter('corporate')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {footerNav.corporate.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-text-inverse/60 hover:text-accent-primary text-sm transition-colors"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={tFooter('quickLinks')}>
            <h2 className="text-text-inverse text-sm font-semibold">
              {tFooter('quickLinks')}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {footerNav.quickLinks.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="text-text-inverse/60 hover:text-accent-primary text-sm transition-colors"
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-text-inverse text-sm font-semibold">
              {tFooter('contact')}
            </h2>
            <ul className="text-text-inverse/60 mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${clinic.contact.phone}`}
                  className="hover:text-accent-primary inline-flex items-start gap-2 transition-colors"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <bdi>{clinic.contact.phoneFormatted}</bdi>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${clinic.contact.email}`}
                  className="hover:text-accent-primary inline-flex items-start gap-2 transition-colors"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{clinic.contact.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2 leading-relaxed">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <address className="not-italic">{clinic.address.formatted}</address>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-border-inverse flex flex-col items-center justify-between gap-4 border-t py-6 md:flex-row">
          <p className="text-text-inverse/40 text-xs">
            © {new Date().getFullYear()} {clinic.name}. {tFooter('rights')}
          </p>
          <nav aria-label={tA11y('footerNav')}>
            <ul className="flex items-center gap-5">
              {legalPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={{
                      pathname: '/legal/[slug]',
                      params: { slug: page.slugs[locale] },
                    }}
                    className="text-text-inverse/40 hover:text-accent-primary text-xs transition-colors"
                  >
                    {tLegal(page.id)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>

      {/* Konum haritası: footer'ın en altında tam genişlikte bir şerit.
          `loading="lazy"` ile ilk boyamanın dışında tutulur; harita
          görünüm alanına girmeden yüklenmez ve LCP'yi etkilemez.
          `hl` parametresi harita arayüzünü aktif dile çevirir. */}
      {geo && (
        <div className="border-border-inverse relative border-t">
          <iframe
            title={tMap('embedTitle')}
            src={`https://maps.google.com/maps?q=${geo.latitude},${geo.longitude}&z=17&hl=${locale}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-72 w-full border-0 md:h-96"
          />
          {/* Gömülü harita yalnızca gösterir; navigasyonu kullanıcının
              kendi harita uygulamasında açan buton üstüne bindirilir.
              Üst-bitiş köşesi Google'ın kendi denetimlerinin (sol üstte
              "büyük haritada göster", altta yakınlaştırma) dışında kalır. */}
          <DirectionsButton
            href={mapsUrl(clinic.address)}
            label={tMap('goToLocation')}
            variant="onImage"
            className="absolute end-4 top-4 shadow-lg md:end-6 md:top-6"
          />
        </div>
      )}
    </footer>
  );
}
