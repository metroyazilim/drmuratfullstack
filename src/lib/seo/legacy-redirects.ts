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
  { source: '/sayfa-hakkimizda-1', destination: '/tr/hakkimizda' },
  { source: '/sayfa-misyonumuz-2', destination: '/tr/misyonumuz' },
  { source: '/sayfa-vizyonumuz-3', destination: '/tr/vizyonumuz' },
  { source: '/sayfa-kalite-politikamiz-4', destination: '/tr/kalite-politikamiz' },
  { source: '/ekibimiz', destination: '/tr/ekibimiz' },
  { source: '/iletisim', destination: '/tr/iletisim' },
  { source: '/randevu-al', destination: '/tr/randevu-al' },
  { source: '/sss', destination: '/tr/sss' },
  { source: '/resim-galerisi', destination: '/tr/galeri' },
  { source: '/video-galerisi', destination: '/tr/video-galeri' },

  // — Hizmetler (Ozon Tedavisi yeni sayfadır, eski karşılığı yoktur) —
  { source: '/hizmetler', destination: '/tr/hizmetler' },
  { source: '/hizmet-botoks-ve-dolgu-29', destination: '/tr/hizmetler/botoks-dolgu' },
  { source: '/hizmet-bolgesel-zayiflama-28', destination: '/tr/hizmetler/bolgesel-zayiflama' },
  { source: '/hizmet-mezoterapi-27', destination: '/tr/hizmetler/mezoterapi' },
  { source: '/hizmet-leke-tedavisi-26', destination: '/tr/hizmetler/leke-tedavisi' },
  { source: '/hizmet-kupa-tedavisi-25', destination: '/tr/hizmetler/kupa-tedavisi' },
  { source: '/hizmet-tibbi-suluk-tedavisi-24', destination: '/tr/hizmetler/tibbi-suluk-tedavisi' },
  { source: '/hizmet-hydrafacial-cilt-bakimi-23', destination: '/tr/hizmetler/hydrafacial-cilt-bakimi' },
  { source: '/hizmet-dermapen-21', destination: '/tr/hizmetler/dermapen' },
  { source: '/hizmet-cilt-bakimi-20', destination: '/tr/hizmetler/cilt-bakimi' },

  // — Blog —
  { source: '/blog-botoks-tedavisi-icin-en-iyi-rehber-2022-30', destination: '/tr/blog/botoks-tedavisi-rehberi' },
  { source: '/blog-halkali-botoks-merkezi-29', destination: '/tr/blog/halkali-botoks-merkezi' },
  { source: '/blog-kucuk-cekmece-dudak-dolgusu-28', destination: '/tr/blog/kucukcekmece-dudak-dolgusu' },
  { source: '/blog-goz-alti-isik-dolgusu-halkali-goz-alti-isik-dolgusu-27', destination: '/tr/blog/goz-alti-isik-dolgusu' },
  { source: '/blog-suluk-tedavi-fiyatlari-26', destination: '/tr/blog/suluk-tedavisi-fiyatlari' },
  // Eski adresteki "istabul" yazım hatası yeni slug'da düzeltildi.
  { source: '/blog-hacamat-kupa-tedavisi-istabul-kupa-tedavisi-25', destination: '/tr/blog/hacamat-kupa-tedavisi-istanbul' },
  { source: '/blog-mezoterapi-hakkinda-bilinmeyenler-24', destination: '/tr/blog/mezoterapi-hakkinda' },
  { source: '/blog-botoks-uygulamasi-hakkinda-bilgiler-23', destination: '/tr/blog/botoks-uygulamasi' },
  { source: '/blog-dolgu-uygulamalari-hakkinda-bilgiler-22', destination: '/tr/blog/dolgu-uygulamalari' },
  { source: '/blog-h100-genclik-asisi-hakkinda-bilgiler-21', destination: '/tr/blog/h100-genclik-asisi' },

  // — Kategori sayfaları içeriksizdi, blog listesine toplanır —
  { source: '/konu-kategori-:slug*', destination: '/tr/blog' },
];

const exactMap = new Map(
  legacyRedirects
    .filter((entry) => !entry.source.includes(':'))
    .map((entry) => [entry.source, entry.destination]),
);

/**
 * Eski bir URL'in yeni karşılığı; yoksa null.
 *
 * proxy.ts içinden, next-intl middleware'inden ÖNCE çağrılır. Sebep:
 * next-intl `/hizmet-mezoterapi-27`'yi tanımadığı için önce
 * `/tr/hizmet-mezoterapi-27`'ye locale prefix'i ekler; next.config
 * `redirects()` o noktadan sonra çalışsa ya zincir oluşur ya da 404'e
 * düşer. Burada yakalamak tek adımlı 308 garantisi verir.
 */
export function matchLegacyRedirect(url: URL): string | null {
  const path = url.pathname.replace(/\/$/, '') || '/';

  const exact = exactMap.get(path);
  if (exact) return exact;

  // Kategori sayfaları içeriksizdi → blog listesine toplanır.
  if (path.startsWith('/konu-kategori-')) return '/tr/blog';

  // Eski sayfalama sayfaları (/blog?sayfa=2) liste sayfasına toplanır.
  // Yeni sitede sayfalama yok (SPEC-008 kararı: 10 yazı, eşik 24), bu yüzden
  // parametre taşınmaz — taşınsaydı var olmayan bir sayfaya yönlendirilirdi.
  if (path === '/blog') {
    return '/tr/blog';
  }

  return null;
}
