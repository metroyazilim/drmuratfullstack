# SPEC-004 — SEO katmanı

**Faz:** 1 — Temel
**Bağımlılık:** SPEC-003
**Sonraki:** SPEC-005 (Layout kabuğu)

## Goal

Sitenin tüm SEO çıktısını tek kaynaktan üretmek: metadata,
canonical, dört dilli hreflang, JSON-LD şemaları, sitemap, robots
ve eski URL'lerden yenilere kalıcı yönlendirme.

Bu projenin en yüksek değerli spec'i budur. Site zaten var ve
2022'den beri indekslenmiş; **eski URL'lerin değeri doğru
taşınmazsa yeni site eskisinden kötü sıralanır.**

## Context

- `context/project-overview.md` → SEO bölümü, görsel SEO kuralları,
  anahtar kelime haritası, başarı ölçütleri 4–6.
- `context/architecture.md` → `lib/seo/` sınırı, Invariant 3 ve 12.
- `context/code-standards.md` → SEO bölümü.
- `context/progress-tracker.md` → Session Notes'taki eski URL
  kalıpları.

## Scope

- `lib/seo/metadata.ts` — `buildMetadata()`, başlık şablonu,
  `metadataBase`.
- `lib/seo/alternates.ts` — canonical + hreflang + x-default.
- `lib/seo/schema/*` — JSON-LD üreticileri ve `<JsonLd>` bileşeni.
- `app/sitemap.ts` — dört dilli sitemap, alternate'leriyle.
- `app/robots.ts`.
- `lib/seo/legacy-redirects.ts` + `next.config.ts` `redirects()`.
- Doğrulama script'i: `npm run seo:check`.

## Out of Scope

- Sayfa şablonlarına bağlanması — SPEC-006+ (her sayfa kendi
  `generateMetadata`'sını bu katmanı çağırarak yazar).
- Gerçek OG görsellerinin üretilmesi — SPEC-011.
- Search Console kaydı ve canlı doğrulama — SPEC-012.
- Analytics kurulumu — SPEC-012.

## Implementation

### 1. Site sabitleri

`lib/seo/config.ts`:

- `SITE_URL` — `process.env.NEXT_PUBLIC_SITE_URL`, üretimde
  `https://www.drmuratirmak.com`. Preview dağıtımlarında Vercel'in
  verdiği URL kullanılır ki canonical yanlış domaini işaret
  etmesin.
- `SITE_NAME` — `Dr. Murat Irmak Kliniği` (dile göre çevrilir).
- `DEFAULT_OG` — marka OG görseli (sayfa kendi `ogImage`'ını
  vermezse devreye girer; ama içerik şeması `ogImage`'ı zorunlu
  kıldığı için pratikte yalnızca sistem sayfalarında kullanılır).

`metadataBase` kök layout'ta `SITE_URL` ile ayarlanır — göreli
OG yolları mutlak URL'e bu sayede dönüşür.

### 2. `buildMetadata()`

Tek giriş noktası. Girdi: locale, route, başlık, açıklama,
`ogImage`, opsiyonel `noindex`, opsiyonel `publishedAt/updatedAt`.

Ürettikleri:

- `title` — şablon: `{sayfa başlığı} | Dr. Murat Irmak Kliniği`.
  Anasayfada şablon uygulanmaz, tam başlık kullanılır.
- `description`.
- `alternates` — canonical + `languages` (aşağıda).
- `openGraph` — `type` (`website` / `article`), `locale`
  (`tr_TR`, `en_US`, `ar_AR`, `ru_RU`), `alternateLocale`,
  `images: [{url, width: 1200, height: 630, alt}]`, makale
  sayfalarında `publishedTime` / `modifiedTime`.
- `twitter` — `summary_large_image`.
- `robots` — `noindex` verilmişse `index: false, follow: true`.

Sayfa dosyalarında elle `Metadata` nesnesi kurulmaz
(`architecture.md` → Invariant 3).

### 3. Canonical ve hreflang

`buildAlternates(locale, route, params?)`:

- **canonical** — sayfanın kendi dilindeki mutlak URL'i.
  `localePrefix: 'always'` olduğu için canonical hiçbir zaman
  prefix'siz olmaz.
- **languages** — dört dilin mutlak URL'i + `x-default`.

Detay sayfalarında slug dile göre değiştiği için karşılıklar
SPEC-003'ün `getAlternates(type, id)` fonksiyonundan alınır.
Statik sayfalarda SPEC-002'nin `getPathname`'i kullanılır.

```
<link rel="canonical" href="https://…/en/services/botox-fillers">
<link rel="alternate" hreflang="tr" href="https://…/tr/hizmetler/botoks-dolgu">
<link rel="alternate" hreflang="en" href="https://…/en/services/botox-fillers">
<link rel="alternate" hreflang="ar" href="https://…/ar/%D8%A7%D9%84%D8%AE%D8%AF%D9%85%D8%A7%D8%AA/…">
<link rel="alternate" hreflang="ru" href="https://…/ru/uslugi/botoks-filler">
<link rel="alternate" hreflang="x-default" href="https://…/tr/hizmetler/botoks-dolgu">
```

Kritik kurallar:

1. **hreflang karşılıklı olmalıdır.** A sayfası B'yi gösteriyorsa
   B de A'yı göstermeli. `getAlternates` dört dili birlikte
   ürettiği için bu yapısal olarak garanti — elle yazılmaz.
2. **URL'ler mutlak ve percent-encode edilmiş olmalıdır.**
   Arapça slug'lar `encodeURI` ile kodlanır. Ham Arapça harf
   içeren `href` bazı doğrulayıcılarda geçersiz sayılır.
3. **`x-default` → `tr`.** Birincil pazar Türkiye; dil seçim
   sayfası bulunmadığı için Türkçe sürüm x-default'tur.
4. Sayfanın kendisi de `languages` listesinde yer alır (kendine
   referans veren hreflang zorunludur).
5. `noindex` sayfalarda hreflang üretilmez.

### 4. JSON-LD

`lib/seo/schema/` altında üreticiler, `<JsonLd data={…} />`
bileşeni ile render edilir. Sayfa dosyalarında elle `<script
type="application/ld+json">` yazılmaz.

| Şema                           | Nerede                            | Kaynak                 |
| ------------------------------ | --------------------------------- | ---------------------- |
| `MedicalClinic`                | Kök layout (her sayfada)          | `content/clinic.json`  |
| `WebSite`                      | Anasayfa                          | `clinic.json` + locale |
| `MedicalProcedure` + `Service` | Hizmet detayı                     | Hizmet frontmatter     |
| `BlogPosting`                  | Blog detayı                       | Post frontmatter       |
| `Person`                       | Ekip detayı                       | Team frontmatter       |
| `FAQPage`                      | SSS sayfası + SSS içeren sayfalar | `content/faq`          |
| `BreadcrumbList`               | Tüm iç sayfalar                   | Route + başlıklar      |
| `ImageObject`                  | Galeri                            | `gallery` + `alt`      |

`MedicalClinic` alanları: `name`, `url`, `logo`, `image`,
`telephone`, `email`, `address` (`PostalAddress`), `geo`,
`areaServed`, `sameAs` (sosyal hesaplar), `medicalSpecialty`,
`availableService` (10 hizmete referans), `openingHoursSpecification`.

**`openingHours` yalnızca `clinic.json` doluysa üretilir.**
Çalışma saatleri hâlâ bilinmiyor (`progress-tracker.md` → Open
Questions); yanlış saat vermek hiç vermemekten kötüdür, uydurulmaz.

`BlogPosting`: `headline`, `description`, `image`, `datePublished`
(orijinal 2022 tarihi), `dateModified`, `author` (`Person` — Dr.
Murat Irmak), `publisher` (`MedicalClinic`), `mainEntityOfPage`,
`inLanguage`.

`MedicalProcedure`: `name`, `description`, `bodyLocation`
(varsa), `howPerformed`, `preparation`, `followup`, `provider`.
Bu alanlar içerik frontmatter'ından gelir; **uydurulmaz**, boşsa
üretilmez (`ai-workflow-rules.md` → tıbbi içerik kuralı).

Tüm şemalar `inLanguage` alanını taşır ve `@id` ile birbirine
referans verir (klinik tekil bir varlıktır, her sayfada yeniden
tanımlanmaz — `@id` ile işaret edilir).

### 5. `app/sitemap.ts`

Next.js'in dosya tabanlı sitemap API'si kullanılır; statik XML
tutulmaz.

- Kaynak: SPEC-003'ün `listSlugs` + statik route listesi.
- Her giriş `alternates.languages` ile dört dili listeler —
  Google'ın önerdiği biçim budur ve `<link>` etiketlerini
  tekrarlar.
- `lastModified`: içerik `updatedAt`'i; yoksa `publishedAt`.
- `noindex` sayfalar ve yasal sayfaların indekslenmeyenleri
  sitemap'e girmez.
- Toplam ~140 URL — 50.000 sınırının çok altında, `generateSitemaps`
  ile bölmeye gerek yok.

`priority` ve `changeFrequency` **yazılmaz**: Google bu alanları
yok sayıyor ve gereksiz bakım yükü yaratıyor.

### 6. `app/robots.ts`

- Tüm botlara `allow: '/'`.
- `disallow`: `/api/`, `/_next/`, `/admin` (ileride).
- `sitemap: ${SITE_URL}/sitemap.xml`.
- `host: SITE_URL`.
- **Preview dağıtımlarında tüm site `disallow` edilir.** Vercel
  preview URL'lerinin indekslenmesi kopya içerik üretir;
  `VERCEL_ENV !== 'production'` ise `Disallow: /` döner. Bu, canlı
  siteyi kannibalize eden en yaygın hatadır.

### 7. Eski URL'lerden yönlendirme (301)

`lib/seo/legacy-redirects.ts` içinde tek harita. **Uygulama notu:**
harita `next.config.ts` `redirects()` yerine `proxy.ts` içinde,
next-intl middleware'inden **önce** çalıştırılır. Sebep: next-intl
`/hizmet-mezoterapi-27`'yi tanımadığı için önce `/tr/...` locale
prefix'i ekler; `redirects()` o noktadan sonra devreye girseydi ya
yönlendirme zinciri oluşurdu ya da 404'e düşerdi. `proxy` içinde
yakalamak tek adımlı 308 garantisi verir (Google 308'i 301 ile
eşdeğer sayar).

Tüm eski adresler `/tr/...` altına yönlendirilir — eski site tek
dilliydi ve birikmiş otorite Türkçe içeriğe aittir.

**Kurumsal sayfalar**

| Eski                          | Yeni                      |
| ----------------------------- | ------------------------- |
| `/sayfa-hakkimizda-1`         | `/tr/hakkimizda`          |
| `/sayfa-misyonumuz-2`         | `/tr/misyonumuz`          |
| `/sayfa-vizyonumuz-3`         | `/tr/vizyonumuz`          |
| `/sayfa-kalite-politikamiz-4` | `/tr/kalite-politikamiz`  |
| `/ekibimiz`                   | `/tr/ekibimiz`            |
| `/iletisim`                   | `/tr/iletisim`            |
| `/randevu-al`                 | `/tr/randevu-al`          |
| `/sss`                        | `/tr/sik-sorulan-sorular` |
| `/resim-galerisi`             | `/tr/resim-galerisi`      |
| `/video-galerisi`             | `/tr/video-galerisi`      |

**Hizmetler** (9 adet — Ozon Tedavisi yeni, eski karşılığı yok)

| Eski                                 | Yeni                                    |
| ------------------------------------ | --------------------------------------- |
| `/hizmetler`                         | `/tr/hizmetler`                         |
| `/hizmet-botoks-ve-dolgu-29`         | `/tr/hizmetler/botoks-dolgu`            |
| `/hizmet-bolgesel-zayiflama-28`      | `/tr/hizmetler/bolgesel-zayiflama`      |
| `/hizmet-mezoterapi-27`              | `/tr/hizmetler/mezoterapi`              |
| `/hizmet-leke-tedavisi-26`           | `/tr/hizmetler/leke-tedavisi`           |
| `/hizmet-kupa-tedavisi-25`           | `/tr/hizmetler/kupa-tedavisi`           |
| `/hizmet-tibbi-suluk-tedavisi-24`    | `/tr/hizmetler/tibbi-suluk-tedavisi`    |
| `/hizmet-hydrafacial-cilt-bakimi-23` | `/tr/hizmetler/hydrafacial-cilt-bakimi` |
| `/hizmet-dermapen-21`                | `/tr/hizmetler/dermapen`                |
| `/hizmet-cilt-bakimi-20`             | `/tr/hizmetler/cilt-bakimi`             |

**Blog** (10 adet)

| Eski                                                           | Yeni                                      |
| -------------------------------------------------------------- | ----------------------------------------- |
| `/blog`                                                        | `/tr/blog`                                |
| `/blog-botoks-tedavisi-icin-en-iyi-rehber-2022-30`             | `/tr/blog/botoks-tedavisi-rehberi`        |
| `/blog-halkali-botoks-merkezi-29`                              | `/tr/blog/halkali-botoks-merkezi`         |
| `/blog-kucuk-cekmece-dudak-dolgusu-28`                         | `/tr/blog/kucukcekmece-dudak-dolgusu`     |
| `/blog-goz-alti-isik-dolgusu-halkali-goz-alti-isik-dolgusu-27` | `/tr/blog/goz-alti-isik-dolgusu`          |
| `/blog-suluk-tedavi-fiyatlari-26`                              | `/tr/blog/suluk-tedavisi-fiyatlari`       |
| `/blog-hacamat-kupa-tedavisi-istabul-kupa-tedavisi-25`         | `/tr/blog/hacamat-kupa-tedavisi-istanbul` |
| `/blog-mezoterapi-hakkinda-bilinmeyenler-24`                   | `/tr/blog/mezoterapi-hakkinda`            |
| `/blog-botoks-uygulamasi-hakkinda-bilgiler-23`                 | `/tr/blog/botoks-uygulamasi`              |
| `/blog-dolgu-uygulamalari-hakkinda-bilgiler-22`                | `/tr/blog/dolgu-uygulamalari`             |
| `/blog-h100-genclik-asisi-hakkinda-bilgiler-21`                | `/tr/blog/h100-genclik-asisi`             |

**Sorgu parametreli ve diğer**

- `/blog?sayfa=2` → `/tr/blog?page=2` (`has: [{type: 'query',
key: 'sayfa'}]` ile eşlenir).
- `/konu-kategori-*` → `/tr/blog` (kategori sayfaları içeriksizdi).
- `/` → `/tr` (bu `proxy` tarafından, SPEC-002'de zaten yapılıyor;
  `redirects()` içinde tekrarlanmaz).

Not: Eski adreslerdeki `hacamat-kupa-tedavisi-istabul` yazım
hatası (**istabul**) yeni slug'da düzeltilir. Yönlendirme
kurulduğu için değer kaybı olmaz.

**Yeni slug'lar `content/` frontmatter'ındaki `slug` alanıyla
birebir aynı olmak zorundadır.** Doğrulama script'i bunu kontrol
eder — uyuşmazlık yönlendirmenin 404'e gitmesi demektir.

### 8. `npm run seo:check`

Build sonrası çalışan doğrulama:

1. Her yönlendirme hedefi gerçekten var mı? (301 → 404 zinciri
   en sinsi hatadır.)
2. Yönlendirme zinciri var mı? (A→B→C yasak, A→C olmalı.)
3. Her sayfada tam olarak bir canonical var mı?
4. hreflang karşılıklılığı sağlanıyor mu?
5. Aynı `title` iki sayfada kullanılmış mı?
6. Üretilen JSON-LD geçerli JSON mu ve zorunlu alanları taşıyor
   mu?
7. Sitemap'teki her URL 200 dönüyor mu?
8. `noindex` sayfalar sitemap'te var mı? (olmamalı)

Script `npm run check` zincirine eklenir.

## Acceptance

1. Bir hizmet detay sayfasının HTML'inde: bir canonical, dört
   hreflang + bir `x-default`, geçerli `MedicalProcedure` ve
   `BreadcrumbList` JSON-LD'si bulunuyor.
2. Arapça sayfanın hreflang URL'leri percent-encode edilmiş ve
   mutlak.
3. Dört dilin hreflang setleri karşılıklı — herhangi bir dilden
   başlayıp diğer üçüne ulaşılıyor.
4. `/sitemap.xml` ~140 URL'i alternate'leriyle listeliyor;
   `priority` / `changeFrequency` içermiyor.
5. `/robots.txt` üretimde sitemap'i işaret ediyor; preview
   dağıtımında `Disallow: /` dönüyor.
6. Tablodaki 31 eski URL'in her biri doğru yeni adrese 308 ile
   gidiyor ve hedef 200 dönüyor.
7. `/blog?sayfa=2` → `/tr/blog?page=2` çalışıyor.
8. Hiçbir yönlendirme zinciri yok (tek adımda hedefe).
9. `openingHours` verisi olmadığı için `MedicalClinic` şemasında
   bu alan **yok** — boş veya uydurma değer üretilmemiş.
10. Google Rich Results Test: hizmet, blog ve SSS sayfaları
    hatasız.
11. Sayfa dosyalarında elle yazılmış `<script
type="application/ld+json">` veya `Metadata` nesnesi yok.
12. `npm run check` (lint + typecheck + content:check + seo:check
    - build) temiz geçiyor.

## Notes

- **Yönlendirme haritası bu projenin en kritik parçası.** 31 eski
  URL'in her biri arama sonuçlarında hâlâ duruyor. Biri
  atlanırsa o sayfanın 2022'den beri biriktirdiği değer sıfırlanır.
  Tablo doğrudan canlı siteden çekilmiştir, tahmin içermez.
- **Eski site tek dilliydi**, bu yüzden tüm yönlendirmeler `/tr`'ye
  gider. `/en`, `/ar`, `/ru` sürümleri sıfırdan indekslenecek —
  bunlar için beklenti ilk aydan sonuç değil, 3–6 ay.
- Yeni eklenen sayfaların (Ozon Tedavisi, ekip detayları, yasal
  sayfalar) eski karşılığı yoktur; yönlendirme aranmaz.
- `x-default`'un `tr` olması bilinçli. Alternatif, dil seçim
  sayfası yapıp onu x-default göstermekti; ek bir tıklama katmanı
  ve zayıf bir giriş sayfası demek olurdu.
- Vercel preview'larının indekslenmesi, canlı siteyle birebir
  kopya içerik üretip sıralamayı böler. `robots.ts` içindeki
  `VERCEL_ENV` kontrolü atlanmamalı.
- SPEC-012'de yayın sonrası Search Console'a hem sitemap
  gönderilecek hem de "Değişiklik adresi" aracı **kullanılmayacak**
  (domain aynı kalıyor, yalnızca URL yapısı değişiyor).
