import type { MetadataRoute } from 'next';
import { getClinic } from '@/lib/content';
import { SITE_NAME } from '@/lib/seo/config';

/**
 * Web App Manifest — /manifest.webmanifest.
 *
 * Kök (locale'siz) bir kaynak olduğu için tek dilli: birincil pazar
 * Türkiye, `start_url` de x-default ile aynı yere (/tr) bakar.
 *
 * `display: browser` bilinçli: bu bir uygulama değil, klinik sitesi.
 * `standalone` verirsek Android "ana ekrana ekle" akışında adres çubuğu
 * kaybolur ve kullanıcı telefon/WhatsApp linklerinden geri dönemez.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const clinic = await getClinic();

  return {
    name: SITE_NAME,
    short_name: 'Dr. Murat Irmak',
    description: clinic.description,
    start_url: '/',
    scope: '/',
    display: 'browser',
    lang: 'tr',
    dir: 'ltr',
    background_color: '#ffffff',
    theme_color: '#012d5b',
    categories: ['medical', 'health', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Android ikonu daire/squircle olarak kırpar; bu sürümde logo
        // %60'lık güvenli alanda durur, aksi halde mührün dış halkası kesilir.
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
