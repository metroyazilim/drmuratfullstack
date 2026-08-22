import { Inter, IBM_Plex_Sans_Arabic } from 'next/font/google';

/**
 * Latin + Kiril gövde fontu. Dört dilin de arayüz fontu olduğundan
 * önyükleniyor.
 *
 * NOT: Kiril alt kümesini ayrı bir `Inter()` çağrısına bölüp
 * `preload: false` yapmak DENENDİ ve ÖLÇÜLDÜ — geri tepti. İki ayrı
 * aile font yığınında yan yana durduğu için tarayıcı ikisini birden
 * indirdi: 3 dosya/150 KB yerine 4 dosya/263 KB, Lighthouse 89 → 84.
 * Tek çağrıda bırakmak daha iyi.
 */
export const fontSans = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Arapça fontu — `preload: false`.
 *
 * Ölçüm bulgusu: dört ağırlık × arabic subset = 4 dosya (~150 KB) ve bunlar
 * ÖNYÜKLEME ile Türkçe, İngilizce ve Rusça sayfalarda da indiriliyordu;
 * hiçbirinde kullanılmadıkları hâlde LCP'yi geciktiriyorlardı.
 *
 * `preload: false` ile dosyalar yalnızca Arapça font ailesi gerçekten
 * uygulandığında (yani `/ar` altında) indirilir. Arapça sayfada `display:
 * swap` sayesinde metin yine anında görünür.
 *
 * Ağırlık sayısı da 4'ten 2'ye indirildi: tasarımda Arapça metin yalnızca
 * gövde (400) ve başlık (700) ağırlıklarını kullanıyor.
 */
export const fontArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
  preload: false,
});
