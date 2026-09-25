import { getClinic, getFaq, listPosts, listServices } from '@/lib/content';
import { localeUrls } from '@/lib/seo/alternates';
import { IS_PRODUCTION_DEPLOY, SITE_NAME, absoluteUrl } from '@/lib/seo/config';
import type { Locale } from '@/lib/site-routes';

/**
 * /llms.txt — llmstxt.org sözleşmesi.
 *
 * Yanıt motorları (ChatGPT, Perplexity, AI Overviews) bir klinik hakkında
 * "nerede, ne yapıyor, kim uyguluyor, nasıl randevu alınır" sorularını
 * cevaplarken sayfaları tek tek gezmek yerine bu özeti okur. İçerikten
 * TÜRETİLİR; elle güncellenen ikinci bir gerçek kaynağı olmaz.
 *
 * Dil: Türkçe. Public site tek dil olarak yayınlanır; tüm canonical URL'ler
 * doğrudan Türkçe route'lara işaret eder.
 */
export const dynamic = 'force-static';

const LOCALE: Locale = 'tr';
const MAX_POSTS = 12;
const MAX_FAQ = 8;

function serviceUrl(slug: string): string {
  return absoluteUrl(`/hizmetler/${slug}`);
}

function postUrl(slug: string): string {
  return absoluteUrl(`/blog/${slug}`);
}

async function build(): Promise<string> {
  const [clinic, services, postsResult, faqResult] = await Promise.all([
    getClinic(),
    listServices(LOCALE),
    listPosts(LOCALE, { limit: MAX_POSTS }),
    getFaq(LOCALE),
  ]);
  const posts = postsResult.items;
  const faq = faqResult.slice(0, MAX_FAQ);

  const url = (href: Parameters<typeof localeUrls>[0]) =>
    localeUrls(href).tr;

  const lines: string[] = [
    `# ${SITE_NAME}`,
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
    `- **Dil:** Türkçe`,
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

export async function GET(): Promise<Response> {
  // Preview dağıtımı taranmıyor; oradaki llms.txt de içerik sızdırmasın.
  const body = IS_PRODUCTION_DEPLOY
    ? await build()
    : '# Preview dağıtımı\n\nBu dağıtım indekslenmez.\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
