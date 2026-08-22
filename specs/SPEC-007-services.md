# SPEC-007 — Hizmet listesi ve detay şablonu

**Faz:** 2 — Sayfalar
**Bağımlılık:** SPEC-006
**Sonraki:** SPEC-008 (Blog listesi ve detay şablonu)

## Goal

`03_Hizmetlerimiz.pdf` ve `14_Hizmet_Botoks_Dolgu.pdf`
tasarımlarını inşa etmek: hizmet listesi sayfası ve **tek bir
detay şablonu** — 10 hizmetin tamamı bu şablondan üretilir.

Bu spec bittiğinde `/[locale]/hizmetler` ve
`/[locale]/hizmetler/[slug]` dört dilde çalışıyor, her hizmet
sayfası `MedicalProcedure` + `Service` şeması üretiyor ve tıbbi
sorumluluk reddi kutusu her detay sayfasında görünüyor olmalı.

## Context

- Tasarım: `03_Hizmetlerimiz.pdf` (liste),
  `14_Hizmet_Botoks_Dolgu.pdf` (detay). Bağlayıcı referans.
- `context/ui-context.md` → Layout Patterns (İçerik + sidebar,
  Bilgi/uyarı kutusu, Görsel kart).
- `context/ai-workflow-rules.md` → tıbbi içerik kuralları.
- SPEC-004'ün `serviceSchema` üreticisi (yazıldı, ilk kez burada
  kullanılıyor).
- SPEC-005'in `PageBanner`, `Breadcrumbs`, `CtaBand` bileşenleri
  (yazıldı, ilk kez burada kullanılıyor).
- SPEC-006'nın `ServiceCard` ve `FeatureCard` kartları.

## Scope

- Yeni içerik tipi: `listing` — liste sayfalarının çerçeve metni.
- `serviceFrontmatter`'a `cardTags` alanı.
- Liste sayfası: banner, giriş bloğu, hizmet grid'i, "yaklaşım"
  bölümü, CTA bandı.
- Detay şablonu: banner, MDX gövde, özellik kartları, tıbbi uyarı
  kutusu, sticky sidebar, ilgili bloglar, CTA bandı.
- Yeni bileşenler: `ServiceSidebar`, `QuickAppointmentCard`,
  `MedicalDisclaimer`, `ApproachSection`.
- `generateStaticParams` ile dört dil × tüm hizmet slug'ları.
- `MedicalProcedure` + `Service` + `BreadcrumbList` JSON-LD.

## Out of Scope

- 10 hizmetin içeriğinin yazılması — SPEC-011. Bu spec şablonu
  kurar; şu an `content/services/` altında yalnızca
  `botoks-dolgu` var ve şablon onunla doğrulanır.
- Blog detay sayfası — SPEC-008. İlgili blog bağlantıları
  üretilir ama hedefleri henüz yok.
- Randevu formu — SPEC-010. Sidebar CTA'sı `/appointment`
  sayfasına link verir.

## Implementation

### 1. `listing` içerik tipi

Liste sayfalarının banner'ı ve giriş metni bir yerde durmalı.
Bu, SPEC-008 (blog) ve SPEC-009 (galeri, SSS, ekip) tarafından da
kullanılacağı için genel bir tip olarak kurulur:

```
content/listing/services/{tr,en,ar,ru}.json
content/listing/blog/...        (SPEC-008)
content/listing/gallery/...     (SPEC-009)
```

Ortak taban şema:

```ts
{
  seo: { title, description, ogImage },
  banner: { title, image, imageAlt },
  intro: { eyebrow, title, description }
}
```

`services` anahtarı bunu genişletir:

```ts
approach: {
  eyebrow, title, description,
  steps: { title, description }[]   // tam 4
}
```

`lib/content` → `getListing(key, locale)`. Doğrulama kapısı
(`content:check`) dört dilin varlığını ve şema uyumunu kontrol
eder; `steps` dörtten farklıysa hata verir.

**Neden ayrı tip:** Bu metinler bir hizmete ya da yazıya ait
değil, **sayfaya** ait. `home` gibi yapılandırılmış ve MDX gövdesi
yok. `messages/`'a konursa çevirmen alanı sayfa içeriğiyle
karışır (`architecture.md` → System Boundaries).

### 2. `cardTags` alanı

Tasarımdaki kartlarda başlığın altında noktalarla ayrılmış kısa
bir etiket satırı var: `Dinamik çizgiler • hacim desteği • yüz
oranları`. Bu, `shortDescription` (cümle) ile aynı şey değil.

`serviceFrontmatter`'a eklenir:

```yaml
cardTags:
  - 'Dinamik çizgiler'
  - 'hacim desteği'
  - 'yüz oranları'
```

Şema: `z.array(z.string().min(2)).min(2).max(3)`.

`ServiceCard` güncellenir: `shortDescription` yerine `cardTags`
noktalarla birleştirilerek gösterilir. Ayırıcı nokta CSS ile
üretilir (`::before`), metne yazılmaz — çeviri dosyasına
tipografik işaret sızmasın.

`ServiceCard` SPEC-006'da anasayfada da kullanıldığı için bu
değişiklik oraya da yansır; tasarımın iki yerinde de aynı görünüm
isteniyor, dolayısıyla istenen davranış budur.

### 3. Liste sayfası — `/[locale]/hizmetler`

Sıra tasarımdaki gibi:

1. **`PageBanner`** — görsel + overlay, breadcrumb
   (`Anasayfa / Hizmetlerimiz`) ve `h1` (`Hizmetlerimiz`).
   `h1` banner'dadır; giriş bloğunun başlığı `h2`'dir.
2. **Giriş bloğu** — eyebrow (`UYGULAMALAR`), `h2`, açıklama
   paragrafı. `listing/services` içinden.
3. **Hizmet grid'i** — 3 sütun (`lg`), 2 (`md`), 1 (mobil).
   `listServices(locale)` sonucunun **tamamı** (`order`'a göre).
   Tasarımda 9 kart var; Ozon Tedavisi eklendiğinde 10 olacak ve
   grid kendiliğinden akacak.
4. **`ApproachSection`** — `--bg-surface` zeminli. İki sütun:
   solda eyebrow + `h2` + paragraf, sağda 2×2 dört mini kart
   (`01`–`04` numarası `--accent-soft` zeminli kare çipte,
   yanında başlık ve tek satır açıklama).

   Bu, anasayfanın `ProcessSteps`'inden **farklı bir düzendir**
   (orada 4 kart yan yana, tint zemin). Ayrı bileşen olarak
   yazılır; `StepCard` zorlanarak yeniden kullanılmaz.
5. **`CtaBand`**.

Metadata: `buildMetadata` + `localeUrls('/services')`.
JSON-LD: `BreadcrumbList`. Liste sayfası `Service` şeması
üretmez — tekil hizmet şemaları detay sayfalarına aittir.

### 4. Detay şablonu — `/[locale]/hizmetler/[slug]`

**Route çözümü:**

- `generateStaticParams`: dört dil × `listSlugs('services', locale)`.
- Sayfa `getServiceBySlug(locale, slug)` çağırır; `null` ise
  `notFound()`.

**Düzen** (tasarım 14):

1. **`PageBanner`** — üç seviyeli breadcrumb
   (`Anasayfa / Hizmetlerimiz / Botoks & Dolgu`) ve `h1` =
   hizmet başlığı. Görsel `heroImage`, `priority`.
2. **İki sütun** (`lg`'de `2fr / 1fr`, altında tek sütun):

   **Sol — içerik:**
   - Büyük görsel (`heroImage` değil, gövde görseli — MDX içinden
     `<Figure>` ile gelir).
   - Eyebrow `HİZMET DETAYI`.
   - MDX gövdesi: `h2` başlıklar, paragraflar (`Botoks & Dolgu
     nedir?`, `Nasıl planlanır?`, `Uygulama sonrası`).
   - **Özellik kartları** — `features` alanından 2×2 grid.
     `FeatureCard` kullanılır ama ikon yerine tik işareti (`Check`)
     çipi; `FeatureCard`'a `icon` opsiyonel hale getirilip
     varsayılan `Check` yapılır.
   - **`MedicalDisclaimer`** — `Callout` üzerine kurulu, `--bg-tint`
     zemin + `border-s-4`. Metni `messages` içinden gelir, her
     hizmet için ayrı yazılmaz.

   **Sağ — sticky sidebar** (`lg:sticky lg:top-24`):
   - **`ServiceSidebar`** — tüm hizmetlerin listesi; aktif olan
     `--accent-primary` ve kalın, `aria-current="page"`.
   - **`QuickAppointmentCard`** — başlık, telefon, e-posta
     (`clinic.json`), dolu mavi "Randevu Al" butonu.
3. **İlgili bloglar** — `relatedPosts` doluysa `PostCard` ile
   listelenir. Boşsa bölüm hiç render edilmez.
4. **`CtaBand`**.

**Tek `h1` kuralı:** `h1` yalnızca banner'da. MDX gövdesi `h2` ile
başlar (`code-standards.md` zaten `h1` yasağını koyuyor,
`content:check` denetliyor).

### 5. JSON-LD

`serviceSchema(service, url)` iki şema döner (SPEC-004'te
yazıldı): `MedicalProcedure` ve `Service`. İkisi de `<JsonLd>` ile
basılır, `BreadcrumbList` üçüncü olarak eklenir.

`MedicalProcedure`'ın `howPerformed`, `preparation`, `followup`
alanları **yalnızca frontmatter'da varsa** üretilir. Bu alanlar
tıbbi iddia taşır; boş bırakmak uydurmaktan iyidir
(`ai-workflow-rules.md`). Bu spec'te frontmatter'a opsiyonel
olarak eklenirler, doldurulmaları SPEC-011'de hekim onayına
bağlıdır.

### 6. Tıbbi sorumluluk reddi

Her hizmet detay sayfasında **zorunlu**. Metin dört dilde
`messages` altında `disclaimer.medical` anahtarında durur:

> Tıbbi uygulamalarda uygunluk kişiden kişiye değişir. Bu sayfa
> genel bilgilendirme amaçlıdır; tanı ve tedavi için hekim
> değerlendirmesi gerekir.

Şablona gömülüdür, içerik yazarının eklemesine bırakılmaz —
unutulabilecek bir şey değil (`ui-context.md` → İçerik Kuralı).

## Acceptance

1. `/tr/hizmetler`, `/en/services`, `/ar/الخدمات`, `/ru/uslugi`
   açılıyor ve mevcut hizmetleri listeliyor.
2. Hizmet detayı dört dilde açılıyor; dil değiştirici detay
   sayfasında **aynı hizmetin** diğer dildeki slug'ına gidiyor
   (SPEC-003 `getAlternates` üzerinden).
3. Olmayan slug (`/tr/hizmetler/yok-boyle`) 404 dönüyor.
4. Detay sayfasında tam olarak bir `h1` var (banner'da).
5. Sayfa `MedicalProcedure`, `Service` ve `BreadcrumbList`
   şemalarını üretiyor; `MedicalProcedure` uydurma alan
   içermiyor.
6. Sidebar'da aktif hizmet vurgulanmış ve `aria-current="page"`
   taşıyor; `lg`'de sticky, altında normal akışta.
7. Tıbbi sorumluluk reddi kutusu her detay sayfasında görünüyor
   ve dört dilde çevrilmiş.
8. Kart etiketleri (`cardTags`) noktalarla ayrılmış görünüyor;
   ayırıcı işaret içerik dosyasında **yazılı değil**.
9. `relatedPosts` boş olan bir hizmette "ilgili bloglar" bölümü
   hiç render edilmiyor (boş başlık kalmıyor).
10. Arapça'da sidebar, breadcrumb ve kart grid'i aynalanmış.
11. `content/listing/services/*.json` dört dilde mevcut ve
    şemadan geçiyor.
12. Mobil Lighthouse (detay sayfası): Performance ≥ 90,
    Accessibility ≥ 95, SEO = 100.
13. Tasarım PDF'leri ile karşılaştırma yapıldı.
14. `npm run check` temiz geçiyor.

## Notes

- **Bu spec'in ürünü tek bir şablon.** 10 hizmet için 10 sayfa
  yazılmaz; içerik `content/services/{id}/{locale}.mdx`
  dosyalarına gelir ve şablon onları render eder. SPEC-011 yalnızca
  içerik ekler, kod eklemez.
- `ServiceCard`'ın `cardTags`'e geçişi anasayfayı da etkiler —
  bilinçli. İki tasarımda da aynı kart görünüyor; iki farklı kart
  bileşeni tutmak ayrışmaya davetiye olur.
- `ApproachSection`'ı `ProcessSteps` ile birleştirme çekiciliğine
  direnilmeli: düzenleri (2 sütun vs 4 sütun), zeminleri (surface
  vs tint) ve numara stilleri farklı. Tek bileşene sıkıştırmak
  varyant bayrakları üretir ve ikisini de bozar.
- Sticky sidebar'ın `top` değeri header yüksekliğiyle uyumlu
  olmalı (`lg:top-24`); yoksa sidebar header'ın altında kalır.
- 10 hizmetin `order` değerleri ve hangi 6'sının anasayfada
  çıkacağı içerik kararıdır — `progress-tracker.md` → İçerik
  Onayı Bekleyenler.
