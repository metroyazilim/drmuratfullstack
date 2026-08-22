# SPEC-002 — i18n temeli

**Faz:** 1 — Temel
**Bağımlılık:** SPEC-001
**Sonraki:** SPEC-003 (İçerik katmanı)

## Goal

Dört dilin (TR/EN/AR/RU) routing, çeviri ve RTL altyapısını
kurmak. Bu spec bittiğinde her dil kendi URL prefix'i altında
açılıyor, statik sayfa yolları dile göre çevriliyor, Arapça RTL
ve doğru fontla render ediliyor, dil değiştirici kullanıcıyı
bulunduğu sayfanın karşılığına götürüyor olmalı.

## Context

- `context/architecture.md` → Routing Model, `lib/i18n` sınırı.
- `context/code-standards.md` → i18n bölümü.
- `context/ui-context.md` → Typography (Arapça font), RTL bölümü.
- `context/project-overview.md` → i18n özellikleri, hreflang hedefi.

**Sürüm uyarısı:** Next 16'da `middleware.ts` kullanımdan kalktı;
dosya adı `proxy.ts`, export edilen fonksiyon adı `proxy`. `edge`
runtime `proxy` içinde desteklenmiyor, çalışma zamanı `nodejs`.
Kod yazmadan önce `node_modules/next/dist/docs/` ve next-intl'in
kurulu sürümünün dokümanı kaynak alınır — eski `middleware.ts`
örnekleri uygulanmaz.

## Scope

- `next-intl` kurulumu ve Next.js eklentisi.
- `routing.ts` — locale listesi, varsayılan, prefix stratejisi ve
  dile göre statik yol çevirileri (`pathnames`).
- `proxy.ts` — locale algılama ve yönlendirme.
- `navigation.ts` — tip güvenli `Link`, `redirect`, `usePathname`,
  `useRouter`, `getPathname`.
- `request.ts` — istek başına locale ve mesaj çözümleme.
- `app/[locale]/layout.tsx` — `lang`, `dir`, locale'e bağlı font.
- `messages/{tr,en,ar,ru}.json` — arayüz metni iskeleti.
- `LanguageSwitcher` bileşeni.
- Kök `/` → `/tr` yönlendirmesi.
- `localizedHref()` sarmalayıcısı.
- Dört dilde açılan geçici bir doğrulama sayfası.

## Out of Scope

- İçerik slug'ları (hizmet/blog detay adresleri) — SPEC-003.
  Bu spec yalnızca **statik** yolları çevirir.
- hreflang ve canonical metadata — SPEC-004.
- Header, Footer, gerçek menü — SPEC-005. `LanguageSwitcher` bu
  spec'te tek başına, geçici sayfada doğrulanır.
- Gerçek çeviri metinleri — SPEC-011. Burada yalnızca anahtar
  iskeleti ve birkaç örnek değer olur.

## Implementation

### 1. Kurulum

```bash
npm install next-intl@4.13.7
```

`next.config.ts` next-intl eklentisiyle sarılır; eklentiye
`src/i18n/request.ts` yolu verilir (varsayılan konum budur).

### 2. `src/i18n/routing.ts`

```ts
import { defineRouting } from 'next-intl/routing';

export const locales = ['tr', 'en', 'ar', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'tr',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/services': {
      tr: '/hizmetler',
      en: '/services',
      ar: '/الخدمات',
      ru: '/uslugi',
    },
    '/services/[slug]': {
      tr: '/hizmetler/[slug]',
      en: '/services/[slug]',
      ar: '/الخدمات/[slug]',
      ru: '/uslugi/[slug]',
    },
    // ... blog, team, gallery, video, faq, appointment, contact,
    //     about, mission, vision, quality, legal/[slug]
  },
});
```

`localePrefix: 'always'` seçilmiştir — dört dil de prefix'li
(`project-overview.md` kararı). Yol anahtarları İngilizce ve
dahili; kullanıcıya görünen hali `pathnames` haritasından gelir.

Çevrilecek statik yolların tam listesi (12 giriş):
`/`, `/about`, `/mission`, `/vision`, `/quality`, `/team`,
`/team/[slug]`, `/services`, `/services/[slug]`, `/blog`,
`/blog/[slug]`, `/gallery`, `/video`, `/faq`, `/appointment`,
`/contact`, `/legal/[slug]`.

Arapça yollar **ana dilde** yazılır (percent-encode edilir), Rusça
yollar **Latin transliterasyonla** — gerekçesi
`architecture.md` → Routing Model'de.

### 3. `src/proxy.ts`

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
};
```

Dosya adı ve export'un `proxy` sözleşmesine uyduğu doğrulanır;
Next 16 `middleware.ts` için uyarı verir.

Matcher `_next`, `_vercel` ve uzantılı istekleri (görseller,
`robots.txt`, `sitemap.xml`) dışarıda bırakır — statik varlıklar
locale yönlendirmesine girmez.

### 4. `src/i18n/navigation.ts` ve `localizedHref`

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

`localizedHref(locale, route, params)` bu `getPathname`
üzerine ince bir sarmalayıcıdır ve sunucu tarafında (sitemap,
JSON-LD, `<a>` üretimi) kullanılır. İstemci ve bileşenlerde
doğrudan next-intl'in `Link`'i kullanılır.

`code-standards.md` kuralı gereği projede `next/link` **doğrudan
import edilmez**; yalnızca `@/i18n/navigation` üzerinden gelen
`Link` kullanılır. Bu bir ESLint `no-restricted-imports` kuralı
ile zorlanır.

### 5. `src/i18n/request.ts`

`getRequestConfig` ile istek başına locale çözülür; geçersiz
locale `notFound()` ile 404'e düşer. Mesajlar
`messages/{locale}.json` dosyasından dinamik import edilir.

`hasLocale` yardımcısı ile doğrulama yapılır — elle string
karşılaştırması yazılmaz.

### 6. `src/app/[locale]/layout.tsx`

Sorumlulukları:

- `params` **await** edilerek okunur (Next 16'da senkron erişim
  kaldırıldı).
- Locale `hasLocale` ile doğrulanır, geçersizse `notFound()`.
- `generateStaticParams` dört locale'i döndürür → dört dil build'de
  statik üretilir.
- `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`.
- Font sınıfı locale'e göre seçilir: `ar` → `--font-arabic`,
  diğerleri → `--font-sans`. Her iki font değişkeni de `<html>`
  üzerinde tanımlı kalır.
- `NextIntlClientProvider` ile istemci bileşenlerine mesaj akışı.
- Statik render'ın korunması için next-intl'in kurulu sürümünün
  gerektirdiği çağrı yapılır (`setRequestLocale` veya
  `next/root-params` tabanlı akış) — hangisinin geçerli olduğu
  kurulu sürümün dokümanından doğrulanır.

Kök `src/app/layout.tsx` yalnızca `children` döndüren minimal bir
kabuk olur; `<html>` ve `<body>` locale layout'unda tanımlanır.

### 7. Kök yönlendirme

`/` isteği `proxy` tarafından `/tr`'ye yönlendirilir. Bu
yönlendirmenin **kalıcı değil** (307/308 yerine next-intl'in
varsayılanı) olduğu doğrulanır; ileride dil algılama davranışı
değişirse kalıcı yönlendirme cache'te takılı kalmamalıdır.

### 8. `messages/{locale}.json`

Bu spec'te yalnızca iskelet ve doğrulama için gereken anahtarlar:

```
nav.*          → menü etiketleri
common.*       → "Randevu Al", "Devamını Oku", "Ana Sayfa"
language.*     → dil adları (kendi dilinde: Türkçe, English,
                 العربية, Русский)
a11y.*         → "WhatsApp'tan yazın", "Telefonla arayın"
```

Dört dosya da **aynı anahtar setini** taşır. Eksik anahtar
sessizce fallback'e düşmez; tip düzeyinde yakalanır
(next-intl'in `Messages` tip augmentation'ı `tr` dosyası referans
alınarak tanımlanır).

### 9. `LanguageSwitcher`

- İstemci bileşeni (`components/shared/language-switcher.tsx`).
- Radix `dropdown-menu` üzerine kurulur.
- Mevcut `pathname`'i alır ve aynı route'un hedef dildeki
  karşılığına gider — dil değiştirince kullanıcı anasayfaya
  düşmez.
- Dil adları kendi dilinde yazılır.
- Aktif dil işaretli; `aria-current="true"` taşır.
- Bayrak ikonu kullanılmaz (dil ≠ ülke).

### 10. RTL doğrulama sayfası (geçici)

SPEC-001'in demo sayfası **silinir** ve yerine
`app/[locale]/page.tsx` altında geçici bir doğrulama sayfası
konur: birkaç çevrilmiş metin, bir yön duyarlı ikon
(`rtl:rotate-180`), `ms-*`/`me-*` kullanan bir kart, telefon
numarası `<bdi>` içinde, ve `LanguageSwitcher`.

Bu sayfa SPEC-006'da gerçek anasayfa ile değiştirilir; dosya
başına `{/* GEÇİCİ: SPEC-006'da değiştirilecek */}` yorumu konur.

## Acceptance

1. `/tr`, `/en`, `/ar`, `/ru` dördü de açılıyor; `/` isteği
   `/tr`'ye yönleniyor.
2. `/tr/hizmetler`, `/en/services`, `/ar/الخدمات`, `/ru/uslugi`
   aynı sayfayı kendi dilinde açıyor.
3. Arapça sayfada `<html dir="rtl">` ve Arapça font uygulanıyor;
   `ms-*`/`me-*` kullanan kart aynalanıyor, yön ikonu dönüyor.
4. `LanguageSwitcher` `/en/services` üzerindeyken Arapça'ya
   geçince `/ar/الخدمات`'a gidiyor — anasayfaya düşmüyor.
5. Geçersiz locale (`/de`) 404 dönüyor.
6. Dört `messages` dosyası aynı anahtar setine sahip; birinden
   anahtar silindiğinde `npm run typecheck` hata veriyor.
7. Projede `next/link` importu yok; lint kuralı bunu engelliyor.
8. `proxy.ts` mevcut, `middleware.ts` yok, build'de `middleware`
   kullanımdan kalkma uyarısı çıkmıyor.
9. Build çıktısında dört dil için de statik route üretildiği
   görülüyor (dinamik render'a düşen sayfa yok).
10. SPEC-001'in token demo sayfası silinmiş.
11. `npm run check` temiz geçiyor.

## Notes

- **`pathnames` yalnızca statik yollar içindir.** Hizmet ve blog
  slug'ları dile göre değişir (`botoks-dolgu` ↔ `botox-fillers`)
  ve bu eşleme içerik frontmatter'ından çözülür — SPEC-003'ün
  işi. Bu spec'te `[slug]` segmenti çevrilmeden bırakılır.
- Arapça yolların percent-encode görünmesi beklenen davranıştır
  (kullanıcı kararı); hata sanılıp Latin'e çevrilmemeli.
- `localePrefix: 'always'` seçildiği için `/tr` prefix'i asla
  düşmez; SEO tarafında canonical ve hreflang bunun üzerine
  kurulacak (SPEC-004).
- next-intl'in kurulu sürümünde statik render için gereken çağrı
  (`setRequestLocale` vs. `next/root-params`) sürümden sürüme
  değişti. Kabul kriteri #9 (dinamik render'a düşen sayfa yok) bu
  ayrımın doğru yapıldığını kanıtlar — build çıktısı kontrol
  edilmeden spec kapatılmaz.
- Dil algılama `Accept-Language` üzerinden çalışır. Türkiye'den
  gelen bir kullanıcı `/tr`'ye, Arapça tarayıcı `/ar`'a düşer;
  bu davranış kullanıcı bir dil seçtiğinde çerezle hatırlanır
  (next-intl varsayılanı).
