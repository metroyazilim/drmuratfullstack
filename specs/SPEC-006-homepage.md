# SPEC-006 — Anasayfa

**Faz:** 2 — Sayfalar
**Bağımlılık:** SPEC-005
**Sonraki:** SPEC-007 (Hizmet listesi ve detay şablonu)

## Goal

`01_Anasayfa.pdf` tasarımını, SPEC-005'te kurulan kabuğun içine
gerçek bileşenlerle inşa etmek. Bu spec bittiğinde anasayfa dört
dilde tasarıma sadık biçimde render oluyor, tüm metinler
`content/` ve `messages/` üzerinden geliyor ve mobil Lighthouse
Performance ≥ 90 oluyor.

Bu, sitenin ilk gerçek sayfası. Burada kurulan bölüm bileşenleri
(`ServiceCard`, `FeatureCard`, `StepCard`, `PostCard`,
`FaqAccordion`) SPEC-007 → SPEC-009 tarafından yeniden
kullanılacak — tek seferlik değil, temel yatırım.

## Context

- Tasarım: `Dr_Murat_Irmak_Folixa_Redesign_34_PDF/01_Anasayfa.pdf`
  (bağlayıcı görsel referans).
- `context/ui-context.md` → Layout Patterns, Colors, Typography,
  Spacing, Motion.
- `context/code-standards.md` → Görseller, SEO, Next.js.
- `context/architecture.md` → `components/sections/` sınırı.
- SPEC-005'te üretilenler: `Container`, `Section`, `SectionLabel`,
  `Button`, `CtaBand`, kabuk.

## Scope

- Yeni içerik tipi: `home` (yapılandırılmış JSON, dört dilde).
- `lib/content` → `getHome(locale)` ve zod şeması.
- Bölüm bileşenleri: `Hero`, `AboutSummary`, `ServicesGrid`,
  `WhyUs`, `ProcessSteps`, `FaqAccordion`, `LatestPosts`.
- Tekrar kullanılacak kartlar: `ServiceCard`, `FeatureCard`,
  `StepCard`, `PostCard`.
- `app/[locale]/page.tsx`'in gerçek anasayfa ile değiştirilmesi.
- Anasayfa metadata'sı ve `WebSite` şeması (SPEC-004 üzerinden).
- Geçici demo sayfanın ve `demo.*` mesaj anahtarlarının silinmesi.

## Out of Scope

- Hizmet ve blog **detay** sayfaları — SPEC-007 / SPEC-008.
  Bu spec'te kartlar var ama tıklandıklarında gidecekleri sayfalar
  henüz yok; bağlantılar doğru üretilir, hedefler sonraki
  spec'lerde gelir.
- Gerçek fotoğraflar — SPEC-011. Yer tutucu kullanılır, **ama**
  dört dilde `alt` metinleri şimdi yazılır.
- Randevu formu — SPEC-010. Hero ve CTA butonları
  `/appointment` sayfasına link verir.
- SSS sayfası — SPEC-009.

## Implementation

### 1. `home` içerik tipi

Anasayfa uzun metin değil, **yapılandırılmış bölüm verisi**
taşıyor (hero başlığı, üç özellik, dört adım, çipler). MDX gövdesi
gerekmiyor; bu yüzden JSON olarak tutulur:

```
content/home/
  tr.json  en.json  ar.json  ru.json
```

Şema (`homeSchema`, zod):

```ts
{
  seo: { title, description, ogImage },
  hero: {
    eyebrow, title, description,
    image, imageAlt,
    primaryCta, secondaryCta,          // etiketler
    doctorCard: { name, title, photo, photoAlt }
  },
  about: {
    eyebrow, title, description,
    chips: string[],                    // 3 adet
    image, imageAlt, ctaLabel
  },
  whyUs: {
    title,
    items: { icon, title, description }[]   // 3 adet
  },
  process: {
    eyebrow, title,
    steps: { title, description }[]      // 4 adet
  },
  faq: { eyebrow, title, image, imageAlt },
  services: { eyebrow, title, ctaLabel },
  blog: { eyebrow, title },
  cta: { image, imageAlt }
}
```

`icon` alanı lucide ikon adıdır ve **kapalı bir listeden** seçilir
(`z.enum`); rastgele string kabul edilmez, aksi halde bileşen
çalışma zamanında kırılır.

`lib/content`'e `getHome(locale)` eklenir. Doğrulama script'i
(`content:check`) dört dosyanın varlığını ve şema uyumunu
kontrol eder; `whyUs.items` üçten, `process.steps` dörtten farklı
olursa hata verir — tasarım bu sayılara göre kurulu.

**Neden `messages/` değil:** Bunlar arayüz etiketi değil, sayfa
içeriği. İleride admin panelinden düzenlenecek şey burası;
`messages/` çevirmen alanı olarak kalır (`architecture.md` →
System Boundaries).

### 2. Bölümler

Sıra tasarımdaki gibidir. Her bölüm `components/sections/`
altında, Server Component olarak yazılır.

**`Hero`** — Container içinde `rounded-xl` fotoğraf,
`--overlay-image` katmanı, başlangıç kenarına hizalı içerik:
eyebrow (nokta işaretli), `h1`, açıklama, iki buton (`primary` +
`onImage`). Sağ altta beyaz doktor kartı: yuvarlak fotoğraf, ad,
unvan. `md` altında doktor kartı görselin altına iner.

Hero görseli **sayfanın LCP'sidir** → `priority`. Sayfada başka
hiçbir görsel `priority` almaz.

**`AboutSummary`** — İki sütun. Solda eyebrow + `h2` + paragraf +
üç çip (`--bg-surface` zeminli, `rounded-md`) + koyu buton
(`/about`). Sağda yuvarlatılmış doktor fotoğrafı. `lg` altında tek
sütun, görsel metnin altına.

**`ServicesGrid`** — `--bg-surface` zeminli bölüm. Başlık satırında
eyebrow + `h2`, bitiş kenarında "Tüm Hizmetler" butonu
(`/services`). Altında **6 hizmet** kartı (3×2, `md`'de 2 sütun,
mobilde 1).

`ServiceCard`: fotoğraf üzerine alttan yukarı koyu gradient,
üstünde başlık ve tek satır kısa açıklama. Kartın tamamı
tıklanabilir (`Link` ile sarılı), `h3` başlık taşır.

Hangi 6 hizmet: `listServices(locale)` sonucundan `order`'a göre
ilk 6. Tasarımda 6 kart var; 10 hizmetin tamamı `/services`
sayfasında listelenir.

**`WhyUs`** — Ortalanmış `h2`, altında 3 `FeatureCard`:
`--accent-soft` zeminli kare ikon çipi, `h3`, açıklama. Kenarlıklı
beyaz kart, gölgesiz.

**`ProcessSteps`** — `--bg-tint` zeminli bölüm. Eyebrow + `h2`,
altında 4 `StepCard`: üstte `01`–`04` numarası
(`--accent-primary`), altında başlık ve açıklama. Numara metin
olarak yazılmaz, `index`'ten üretilir ve `aria-hidden` taşır.

**`FaqAccordion`** — İki sütun: solda fotoğraf, sağda eyebrow +
`h2` + akordeon. Radix `accordion` kullanılır (`type="single"`,
`collapsible`). İlk **3** SSS `getFaq(locale)`'den gelir.

Akordeon açık öğede `+` → `−` döner; başlık `--accent-primary`
olur. Klavye ile gezilebilir (Radix sağlar).

**JSON-LD kararı:** Anasayfa `FAQPage` şeması **üretmez**. Aynı
sorular hem anasayfada hem `/faq` sayfasında yayınlanırsa iki
sayfa aynı yapısal veriyle yarışır; `FAQPage` sahipliği
SPEC-009'daki `/faq` sayfasına aittir. Anasayfada akordeon
yalnızca arayüzdür.

**`CtaBand`** — SPEC-005'te yazıldı, burada ilk kez kullanılır.
Görsel ve `alt` `content/home` içinden gelir.

**`LatestPosts`** — Eyebrow + `h2`, altında **4** `PostCard`
(2×2, mobilde 1 sütun). Kart: solda kare görsel, sağda kategori
etiketi (`--accent-primary`, küçük), `h3` başlık, iki satırlık
özet, "Yazıyı Oku →" bağlantısı.

Kaynak: `listPosts(locale)` → `publishedAt`'e göre azalan ilk 4.
Anchor metni başlıktan gelir; "devamı" gibi anlamsız anchor
kullanılmaz (`code-standards.md` → SEO).

### 3. Sayfa dosyası

`app/[locale]/page.tsx`:

- `setRequestLocale(locale)` (statik render korunur).
- `generateMetadata` → `buildMetadata` + `localeUrls('/')`,
  `isHome: true`.
- `WebSite` JSON-LD.
- Bölümler sırayla render edilir; sayfa `<main>` açmaz (kabuk
  açıyor).
- Veri okumaları sunucuda: `getHome`, `listServices`, `listPosts`,
  `getFaq`.

Tek `h1` kuralı: `h1` yalnızca `Hero` içinde. Diğer tüm bölüm
başlıkları `h2`, kart başlıkları `h3`.

### 4. Temizlik

- `src/app/[locale]/page.tsx` içindeki SPEC-002 demo içeriği
  tamamen kaldırılır.
- `messages/*.json` içindeki `demo.*` grubu dört dilden silinir.
- `src/app/[locale]/services/page.tsx` **bu spec'te
  değiştirilmez** (SPEC-007'nin işi), ama demo başlıklarını
  `demo.*`'tan aldığı için o anahtarlar oraya taşınır ya da
  geçici sayfa `nav.*` anahtarlarıyla yeniden yazılır.

### 5. Performans

- Hero dışındaki tüm görseller lazy.
- `ServiceCard` ve `PostCard` görsellerinde doğru `sizes`
  (`(max-width: 768px) 100vw, 33vw` / `50vw`).
- Radix `accordion` tek client bileşenidir; bölümün geri kalanı
  sunucuda kalır — akordeon `FaqAccordion` içinde en yaprak
  parçadır.
- Bölüm girişlerinde kaydırma animasyonu **yok** (CLS ve LCP
  önceliği, `ui-context.md` → Motion).

## Acceptance

1. Dört dilde anasayfa açılıyor; tüm bölümler tasarımdaki sırada.
2. Arapça'da bütün bölümler aynalanmış; hero içeriği sağa hizalı,
   çipler ve kart grid'i doğru akıyor.
3. Sayfada tam olarak **bir** `h1` var ve o `Hero` içinde.
4. Hero görseli `priority`, diğer tüm görseller lazy — sayfada
   birden fazla `priority` yok.
5. Hiçbir bileşende sabit metin yok; tüm metinler `content/home`
   veya `messages` üzerinden geliyor.
6. Hizmet grid'i 6 kart gösteriyor ve "Tüm Hizmetler" `/services`
   sayfasına gidiyor; kart bağlantıları dile göre doğru slug
   üretiyor.
7. Blog bölümü en yeni 4 yazıyı `publishedAt` sırasına göre
   gösteriyor.
8. SSS akordeonu klavye ile açılıp kapanıyor; açık öğe
   `aria-expanded="true"` taşıyor.
9. Anasayfa `FAQPage` şeması üretmiyor; `WebSite` ve
   `MedicalClinic` üretiyor.
10. `demo.*` mesaj anahtarları dört dilden de silinmiş; geçici
    demo içeriği kalmamış.
11. `content/home/*.json` dört dilde mevcut ve şemadan geçiyor;
    bir dil silindiğinde `content:check` hata veriyor.
12. Mobil Lighthouse: Performance ≥ 90, Accessibility ≥ 95,
    SEO = 100.
13. Tasarım PDF'i ile yan yana karşılaştırma yapıldı; bölüm
    sırası, zemin renkleri ve kart düzenleri eşleşiyor.
14. `npm run check` temiz geçiyor.

## Notes

- **Kart bileşenleri bu spec'in kalıcı ürünü.** `ServiceCard`
  SPEC-007'de, `PostCard` SPEC-008'de, `FeatureCard` hizmet
  detaylarında tekrar kullanılacak. Anasayfaya özel yazılırlarsa
  üç spec sonra üç kopya olur.
- Yer tutucu görseller kullanılacak ama `alt` metinleri **şimdi**
  ve dört dilde yazılacak. SPEC-011'de görsel değişince `alt`
  gözden geçirilir; boş bırakılıp sonra doldurulmaz, çünkü
  "sonra" gelmez.
- Tasarımdaki hero başlığı ve açıklaması mevcut sitede yok — yeni
  metin. Türkçesi tasarımdaki metinden alınır, diğer üç dil
  çevrilir. Tıbbi iddia içermediği için hekim onayı gerektirmez;
  ancak `whyUs` ve `process` metinleri süreç anlatıyor, bunlar
  `progress-tracker.md`'ye **klinik onayı önerilir** notuyla
  düşülür.
- Doktor kartındaki unvan `clinic.json`'daki `doctor.title` ile
  tutarlı olmalı; iki yerde farklı unvan yazması güven kaybettirir.
- 6 hizmet kartı `order` alanına göre seçildiği için, hangi altı
  hizmetin öne çıkacağı bir **içerik kararıdır**, kod kararı
  değil. SPEC-011'de klinikle netleştirilir.
