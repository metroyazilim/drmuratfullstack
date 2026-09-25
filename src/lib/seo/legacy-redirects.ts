/**
 * 2022 tarihli eski sitenin URL'leri → yeni adresler.
 *
 * Liste canlı siteden çekilmiştir (`/hizmetler`, `/blog`, `/blog?sayfa=2`);
 * tahmin içermez. Eski site tek dilliydi, bu yüzden tüm hedefler /tr altındadır —
 * birikmiş arama otoritesi Türkçe içeriğe aittir.
 *
 * Bir eski URL bu listeden düşerse o sayfanın 2022'den beri biriktirdiği
 * değer sıfırlanır. Silme, ancak yerine yenisi eklenerek yapılır.
 */
export type LegacyRedirect = {
  source: string;
  destination: string;
};

export const legacyRedirects: LegacyRedirect[] = [
  // — Kurumsal ve sistem sayfaları —
  { source: '/sayfa-hakkimizda-1', destination: '/hakkimizda' },
  { source: '/sayfa-misyonumuz-2', destination: '/misyonumuz' },
  { source: '/sayfa-vizyonumuz-3', destination: '/vizyonumuz' },
  { source: '/sayfa-kalite-politikamiz-4', destination: '/kalite-politikamiz' },
  { source: '/resim-galerisi', destination: '/galeri' },
  // Video galerisi kaldırıldı; en yakın içerik foto galerisi.
  { source: '/video-galerisi', destination: '/galeri' },

  // — Hizmetler (Ozon Tedavisi yeni sayfadır, eski karşılığı yoktur) —
  { source: '/hizmet-botoks-ve-dolgu-29', destination: '/hizmetler/botoks-dolgu' },
  { source: '/hizmet-bolgesel-zayiflama-28', destination: '/hizmetler/bolgesel-zayiflama' },
  { source: '/hizmet-mezoterapi-27', destination: '/hizmetler/mezoterapi' },
  { source: '/hizmet-leke-tedavisi-26', destination: '/hizmetler/leke-tedavisi' },
  { source: '/hizmet-kupa-tedavisi-25', destination: '/hizmetler/kupa-tedavisi' },
  { source: '/hizmet-tibbi-suluk-tedavisi-24', destination: '/hizmetler/tibbi-suluk-tedavisi' },
  { source: '/hizmet-hydrafacial-cilt-bakimi-23', destination: '/hizmetler/hydrafacial-cilt-bakimi' },
  { source: '/hizmet-dermapen-21', destination: '/hizmetler/dermapen' },
  { source: '/hizmet-cilt-bakimi-20', destination: '/hizmetler/cilt-bakimi' },

  // — Blog —
  { source: '/blog-botoks-tedavisi-icin-en-iyi-rehber-2022-30', destination: '/blog/botoks-tedavisi-rehberi' },
  { source: '/blog-halkali-botoks-merkezi-29', destination: '/blog/halkali-botoks-merkezi' },
  { source: '/blog-kucuk-cekmece-dudak-dolgusu-28', destination: '/blog/kucukcekmece-dudak-dolgusu' },
  { source: '/blog-goz-alti-isik-dolgusu-halkali-goz-alti-isik-dolgusu-27', destination: '/blog/goz-alti-isik-dolgusu' },
  { source: '/blog-suluk-tedavi-fiyatlari-26', destination: '/blog/suluk-tedavisi-fiyatlari' },
  // Eski adresteki "istabul" yazım hatası yeni slug'da düzeltildi.
  { source: '/blog-hacamat-kupa-tedavisi-istabul-kupa-tedavisi-25', destination: '/blog/hacamat-kupa-tedavisi-istanbul' },
  { source: '/blog-mezoterapi-hakkinda-bilinmeyenler-24', destination: '/blog/mezoterapi-hakkinda' },
  { source: '/blog-botoks-uygulamasi-hakkinda-bilgiler-23', destination: '/blog/botoks-uygulamasi' },
  { source: '/blog-dolgu-uygulamalari-hakkinda-bilgiler-22', destination: '/blog/dolgu-uygulamalari' },
  { source: '/blog-h100-genclik-asisi-hakkinda-bilgiler-21', destination: '/blog/h100-genclik-asisi' },

  // — Kategori sayfaları içeriksizdi, blog listesine toplanır —
  { source: '/konu-kategori-:slug*', destination: '/blog' },
];

const exactMap = new Map(
  legacyRedirects
    .filter((entry) => !entry.source.includes(':'))
    .map((entry) => [entry.source, entry.destination]),
);

/**
 * Eski bir URL'in yeni karşılığı; yoksa null.
 *
 * proxy.ts içinden çağrılır; tek adımlı 308 garantisi verir.
 */
export function matchLegacyRedirect(url: URL): string | null {
  const path = url.pathname.replace(/\/$/, '') || '/';

  const exact = exactMap.get(path);
  if (exact) return exact;

  // Kategori sayfaları içeriksizdi → blog listesine toplanır.
  if (path.startsWith('/konu-kategori-')) return '/blog';

  return null;
}
