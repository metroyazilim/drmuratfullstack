import type { NextConfig } from 'next';


const remoteImagePatterns = [new URL('https://*.r2.dev/**')];
const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();
if (r2PublicBaseUrl) {
  const pattern = new URL(r2PublicBaseUrl);
  pattern.pathname = `${pattern.pathname.replace(/\/+$/, '')}/**`;
  pattern.search = '';
  pattern.hash = '';
  remoteImagePatterns.push(pattern);
}

const nextConfig: NextConfig = {
  // Docker/Dokploy hedefi: çalışma zamanı imajının tüm node_modules'e ihtiyaç duymaması için
  // kendi kendine yeten sunucu paketi (.next/standalone) üretilir.
  output: 'standalone',
  images: {
    remotePatterns: remoteImagePatterns,
    formats: ['image/avif', 'image/webp'],
    /**
     * Optimize edilmiş görseller 1 yıl önbellekte kalır.
     * Kaynak dosyalar sürümlenmiş (içerik değişince dosya adı değişiyor),
     * bu yüzden uzun TTL güvenli ve tekrar ziyarette LCP'yi düşürüyor.
     */
    minimumCacheTTL: 31_536_000,
  },
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/:locale(tr|en|ar|ru)',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:locale(tr|en|ar|ru)/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },

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

export default nextConfig;
