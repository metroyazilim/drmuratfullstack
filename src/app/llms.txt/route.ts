import { getClinic, getFaq, listPosts, listServices } from '@/lib/content';
import { localeUrls } from '@/lib/seo/alternates';
import { IS_PRODUCTION_DEPLOY, SITE_NAME, absoluteUrl } from '@/lib/seo/config';
import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/lib/i18n';

/**
 * /llms.txt — llmstxt.org sözleşmesi.
 *
 * Yanıt motorları (ChatGPT, Perplexity, AI Overviews) bir klinik hakkında
 * "nerede, ne yapıyor, kim uyguluyor, nasıl randevu alınır" sorularını
 * cevaplarken sayfaları tek tek gezmek yerine bu özeti okur. İçerikten
 * TÜRETİLİR; elle güncellenen ikinci bir gerçek kaynağı olmaz.
 *
 * Dil: Türkçe (birincil pazar, x-default). Diğer diller hreflang üzerinden
 * zaten keşfediliyor; dört dili tek dosyaya yığmak özeti okunmaz yapardı.
 */
export const dynamic = 'force-static';

const LOCALE: Locale = 'tr';
const MAX_POSTS = 12;
const MAX_FAQ = 8;

function serviceUrl(slug: string): string {
  return absoluteUrl(
    getPathname({
      locale: LOCALE,
      href: { pathname: '/services/[slug]', params: { slug } },
    }),
  );
}

function postUrl(slug: string): string {
  return absoluteUrl(
    getPathname({
      locale: LOCALE,
      href: { pathname: '/blog/[slug]', params: { slug } },
    }),
  );
}

function build(): string {
  const clinic = getClinic();
  const services = listServices(LOCALE);
  const { items: posts } = listPosts(LOCALE, { limit: MAX_POSTS });
  const faq = getFaq(LOCALE).slice(0, MAX_FAQ);

  const url = (href: Parameters<typeof localeUrls>[0]) =>
    localeUrls(href)[LOCALE];

  const lines: string[] = [
    `# ${SITE_NAME.tr}`,
    '',
    `> ${clinic.description}`,
    '',
    '## Klinik künyesi',
    '',
    `- **Hekim:** ${clinic.doctor.name} — ${clinic.doctor.title}`,
    `- **Uzmanlık:** ${clinic.doctor.specialty}`,
    `- **Adres:** ${clinic.address.formatted}`,
    `- **Telefon / WhatsApp:** ${clinic.contact.phoneFormatted} (${clinic.contact.phone})`,
    `- **E-posta:** ${clinic.contact.email}`,
    `- **Randevu:** ${url('/appointment')}`,
    `- **Diller:** Türkçe, İngilizce, Arapça, Rusça (aynı içerik /tr, /en, /ar, /ru altında)`,
    '',
    '## Hizmetler',
    '',
    ...services.map(
      (service) => `- [${service.title}](${serviceUrl(service.slug)}): ${service.shortDescription}`,
    ),
    '',
    '## Kurumsal',
    '',
    `- [Hakkımızda](${url('/about')})`,
    `- [Ekibimiz](${url('/team')})`,
    `- [Misyonumuz](${url('/mission')})`,
    `- [Vizyonumuz](${url('/vision')})`,
    `- [Kalite politikamız](${url('/quality')})`,
    `- [Galeri](${url('/gallery')})`,
    `- [İletişim](${url('/contact')})`,
    '',
    '## Blog',
    '',
    ...posts.map((post) => `- [${post.title}](${postUrl(post.slug)}): ${post.description}`),
  ];

  if (faq.length > 0) {
    lines.push(
      '',
      '## Sık sorulan sorular',
      '',
      ...faq.flatMap((item) => [`### ${item.question}`, '', item.answer, '']),
      `Tümü: ${url('/faq')}`,
    );
  }

  lines.push(
    '',
    '## Notlar',
    '',
    '- Bu sitedeki tıbbi içerik bilgilendirme amaçlıdır ve hekim muayenesinin yerine geçmez.',
    '- Fiyat bilgisi yayımlanmaz; her uygulama muayene sonrası kişiye göre planlanır.',
    `- Kanonik alan adı: ${absoluteUrl('/')}`,
    '',
  );

  return lines.join('\n');
}

export function GET(): Response {
  // Preview dağıtımı taranmıyor; oradaki llms.txt de içerik sızdırmasın.
  const body = IS_PRODUCTION_DEPLOY
    ? build()
    : '# Preview dağıtımı\n\nBu dağıtım indekslenmez.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
