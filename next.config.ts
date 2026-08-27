import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    /**
     * Optimize edilmiş görseller 1 yıl önbellekte kalır.
     * Kaynak dosyalar sürümlenmiş (içerik değişince dosya adı değişiyor),
     * bu yüzden uzun TTL güvenli ve tekrar ziyarette LCP'yi düşürüyor.
     */
    minimumCacheTTL: 31_536_000,
  },
  poweredByHeader: false,
  compress: true,

  /**
   * Güvenlik başlıkları.
   *
   * CSP BİLİNÇLİ OLARAK YOK: yanlış kurulmuş bir CSP, Next.js'in inline
   * script'lerini ve YouTube facade'ını kırar — hiç CSP'siz olmaktan
   * kötüdür. Eklenecekse ayrı bir iş birimi olarak, `report-only` modda
   * başlatılıp en az bir hafta rapor izlenmelidir (SPEC-012).
   */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        /**
         * public/ altındaki görseller ve ikonlar değişmez kabul edilir;
         * güncellenmeleri gerektiğinde dosya adı değişiyor. `immutable`,
         * tekrar ziyarette koşullu istek bile göndermez.
         */
        source: '/:path(images|icons)/:file*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
