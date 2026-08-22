import type { MetadataRoute } from 'next';
import { IS_PRODUCTION_DEPLOY, SITE_URL } from '@/lib/seo/config';

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
        disallow: ['/api/', '/_next/', '/admin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
