import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
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
    ];
  },
};

export default withNextIntl(nextConfig);
