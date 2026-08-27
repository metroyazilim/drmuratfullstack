import type { MetadataRoute } from 'next';
import { IS_PRODUCTION_DEPLOY, SITE_URL } from '@/lib/seo/config';

/**
 * Yanıt motorlarının tarayıcıları.
 *
 * Bunlar AÇIK BIRAKILIR: ChatGPT, Claude, Perplexity ve AI Overviews
 * kaynak gösterip tıklama gönderiyor — bir kliniğin "Halkalı'da botoks
 * nerede yaptırılır?" sorusunda görünmesi, klasik sıralamadan daha
 * değerli olabilir. Kural yokken de taranırlar; burada açıkça yazılması
 * niyeti belgeliyor, ileride yanlışlıkla kapatılmasını zorlaştırıyor.
 */
const ANSWER_ENGINE_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Amazonbot',
  'meta-externalagent',
];

/**
 * Karşılığında tıklama göndermeyen toplu kazıyıcılar.
 * Bytespider agresif tarar ve kaynak göstermez; CCBot'un çıktısı ise
 * üçüncü tarafların eğitim setlerine gider. Klinik içeriğinin (hasta
 * bilgilendirme metinleri) buralarda dolaşmasının bir getirisi yok.
 */
const SCRAPER_BOTS = ['Bytespider', 'CCBot'];

const DISALLOWED_PATHS = ['/api/', '/_next/', '/admin'];

export default function robots(): MetadataRoute.Robots {
  // Preview dağıtımları indekslenirse canlı siteyle birebir kopya içerik
  // üretip sıralamayı böler. Yalnızca production taranabilir.
  if (!IS_PRODUCTION_DEPLOY) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: ANSWER_ENGINE_BOTS,
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: SCRAPER_BOTS,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
