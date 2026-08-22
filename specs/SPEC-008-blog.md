# SPEC-008 — Blog listesi ve detay şablonu

**Faz:** 2 — Sayfalar
**Bağımlılık:** SPEC-007
**Sonraki:** SPEC-009 (Kurumsal, ekip, galeri, SSS)

## Goal

`10_Blog.pdf` ve `24_Blog_Halkali_Botoks_Merkezi.pdf`
tasarımlarını inşa etmek: blog listesi ve **tek bir yazı
şablonu** — 10 yazının tamamı bu şablondan üretilir.

Bu spec bittiğinde `/[locale]/blog` ve `/[locale]/blog/[slug]`
dört dilde çalışıyor, her yazı `BlogPosting` şeması üretiyor ve
2022 tarihleri korunuyor olmalı.

## Context

- Tasarım: `10_Blog.pdf` (liste),
  `24_Blog_Halkali_Botoks_Merkezi.pdf` (detay).
- `context/project-overview.md` → blog tarih kuralı, iç linkleme
  gereksinimi.
- SPEC-004'ün `postSchema` üreticisi (yazıldı, ilk kez burada
  kullanılıyor).
- SPEC-006'nın `PostCard`'ı, SPEC-007'nin `PageBanner`,
  `MedicalDisclaimer`, `QuickAppointmentCard`, `listing` tipi.

## Tasarımdan üç sapma (gerekçeli)

Tasarımı uygularken üç noktada bilinçli olarak ayrılıyoruz.
Her biri ya bir SEO kuralını ya da `project-overview.md`'deki bir
gereksinimi koruyor.

**1. Detay sayfasında başlık iki kez görünmeyecek.**
Tasarımda yazı başlığı hem banner'da hem içerik alanında
tekrarlanıyor. İkisi de `h1` olursa sayfada iki `h1` olur
(`code-standards.md` ihlali); ikincisi `h2` olursa `h1` ile birebir
aynı metinli bir `h2` üretilir — semantik gürültü. Banner `h1`
kalır, içerik alanı eyebrow + giriş paragrafıyla başlar.

**2. Yazı tarihi gösterilecek.**
Tasarımda tarih yok. Sağlık içeriğinde tarihi gizlemek güven
sorunudur ve Google'ın YMYL değerlendirmesinde tazelik sinyali
beklenir; `BlogPosting` şeması zaten `datePublished` yayınlıyor,
ekranda saklamak tutarsız olur. Detay sayfasında eyebrow
satırında küçük puntoyla gösterilir.

**3. İlgili hizmetler bloğu eklenecek.**
Tasarımda yok, ama `project-overview.md` → SEO açıkça istiyor:
"her blog ilgili hizmet sayfasına anlamlı anchor metniyle link
verir". `relatedServices` frontmatter alanı zaten var; kullanılmazsa
iç linkleme tek yönlü kalır.

## Scope

- `listing/blog` içeriği (dört dilde).
- Blog listesi sayfası: banner, ortalanmış giriş, 2 sütunlu kart
  grid'i, CTA bandı.
- Yazı şablonu: banner, gövde görseli, eyebrow + tarih, giriş,
  MDX gövde, tıbbi uyarı, ilgili hizmetler, sticky sidebar,
  CTA bandı.
- Yeni bileşen: `RecentPostsSidebar`.
- `PostCard`'ın liste düzenine uyarlanması.
- `BlogPosting` + `BreadcrumbList` JSON-LD.
- SPEC-004'teki `?sayfa=` yönlendirmesinin düzeltilmesi.

## Out of Scope

- 10 yazının içeriğinin yazılması — SPEC-011.
- Yorum sistemi — `project-overview.md` → Out of Scope.
- Kategori filtresi ve sayfalama — aşağıda gerekçesi.

## Sayfalama ve kategori kararı

**Sayfalama yok.** Tasarımda sayfalama kontrolü bulunmuyor ve
toplam 10 yazı var; 10 kaydı bölmek kullanıcıya da tarayıcıya da
değer katmaz, `rel=prev/next` sinyalleri Google tarafından zaten
kullanılmıyor.

Eşik yazılı olsun: **yazı sayısı 24'ü geçerse** sayfalama ayrı bir
iş birimi olarak eklenir.

**Bunun SPEC-004'e etkisi var.** 301 haritasında
`/blog?sayfa=2` → `/tr/blog?page=2` yazıyordu. `?page=2` diye bir
sayfa üretilmeyeceği için bu yönlendirme boşluğa giderdi.
`matchLegacyRedirect` düzeltilir: `/blog?sayfa=N` → `/tr/blog`
(parametre düşürülür). Eski sayfalama sayfalarının korunmaya değer
tekil içeriği yoktu; liste sayfasına toplamak standart pratiktir.

Canonical zaten route'tan üretildiği için sorgu parametreli bir
istek gelse bile canonical `/tr/blog`'u işaret eder — kopya içerik
riski yok.

**Kategori filtresi yok.** Yeni tasarım kaldırmış; eski sitedeki
`konu-kategori-*` sayfaları da zaten içeriksizdi ve SPEC-004'te
`/tr/blog`'a yönlendiriliyor. `category` alanı korunur ve detay
sayfasında etiket olarak gösterilir.

## Implementation

### 1. `listing/blog` içeriği

`content/listing/blog/{tr,en,ar,ru}.json` — `listingBaseSchema`
(banner + intro), `approach` **yok**. `listingSchemas` haritasına
`blog: listingBaseSchema` eklenir ve `getListing` dönüş tipi
anahtara göre daralacak biçimde düzeltilir (şu an her zaman
`ServicesListing` dönüyor — bu spec'te `ListingBase` /
`ServicesListing` ayrımı yapılır).

### 2. Liste sayfası — `/[locale]/blog`

1. `PageBanner` — breadcrumb (`Anasayfa / Blog`), `h1` = `Blog`.
2. **Ortalanmış giriş** — eyebrow (`SAĞLIK & BAKIM`), `h2`,
   açıklama. Hizmet listesinden farklı olarak ortalanmış
   (tasarım).
3. **2 sütunlu kart grid'i** — `listPosts(locale)` tamamı,
   `publishedAt` azalan. Mobilde tek sütun.
4. `CtaBand`.

`PostCard` tasarıma göre güncellenir: solda kare görsel, sağda
etiket + `h3` + iki satırlık özet + "Devamını Oku →". Kart
etiketi tasarımda sabit `BLOG` yazıyor — kategori adı değil.
Etiket `messages` içinden gelir (`blog.cardLabel`).

Anasayfadaki `LatestPosts` aynı kartı kullanır; iki yerde de aynı
görünüm isteniyor.

### 3. Yazı şablonu — `/[locale]/blog/[slug]`

`generateStaticParams`: dört dil × `listSlugs('blog', locale)`.
`getPostBySlug` `null` ise `notFound()`.

**Düzen:**

1. `PageBanner` — üç seviyeli breadcrumb, `h1` = yazı başlığı,
   görsel `heroImage` + `priority`.
2. **İki sütun** (`lg`: `2fr / 1fr`):

   **Sol:**
   - Gövde görseli (`heroImage`, `rounded-lg`).
   - Eyebrow satırı: `BLOG • {category}` + tarih.
     Tarih `next-intl` formatter'ı ile locale'e göre biçimlenir;
     `<time dateTime={publishedAt}>` içinde verilir.
     `updatedAt` varsa "güncellendi" bilgisi de gösterilir.
   - Giriş paragrafı (`description`).
   - MDX gövdesi (`h2` başlıklar).
   - `MedicalDisclaimer`.
   - **İlgili hizmetler** — `relatedServices` id'lerinden çözülür,
     anchor metni hizmet başlığıdır. Boşsa bölüm render edilmez.

   **Sağ — sticky sidebar:**
   - `RecentPostsSidebar` — son 6 yazı, aktif olan vurgulu ve
     `aria-current="page"`.
   - `QuickAppointmentCard` (SPEC-007'de yazıldı).

     Tasarımda blog sidebar'ındaki randevu kartı hizmet
     sayfasındakinden biraz farklı (telefon/e-posta yok). İki ayrı
     kart tutmak yerine aynısı kullanılır — detay sayfaları
     arasında tutarlılık, iki kartın zamanla ayrışmasına yeğdir.
3. `CtaBand`.

### 4. `BlogPosting` şeması

SPEC-004'teki `postSchema` kullanılır. Kritik alanlar:

- `datePublished` — **orijinal 2022 tarihi**, asla değiştirilmez.
- `dateModified` — `updatedAt` varsa o, yoksa `publishedAt`.
- `author` — `Person`, frontmatter'dan.
- `publisher` — `MedicalClinic` `@id` referansı.
- `inLanguage` — locale.

`BreadcrumbList` ikinci şema olarak eklenir.

### 5. `messages` genişletmesi

```
blog.cardLabel        → "BLOG"
blog.publishedOn      → "{date} tarihinde yayınlandı"
blog.updatedOn        → "{date} tarihinde güncellendi"
blog.relatedServices  → "İlgili hizmetler"
blog.recentPosts      → "Son Yazılar"
```

Dört dilde birden eklenir.

### 6. Görseller

Liste banner'ı ve OG görseli için yer tutucu üretilir
(`/images/blog/blog-banner.webp`, `/images/og/blog.webp`),
"PLACEHOLDER — SPEC-011" damgalı.

## Acceptance

1. `/tr/blog`, `/en/blog`, `/ar/المدونة`, `/ru/blog` açılıyor ve
   yazıları `publishedAt` azalan sırada listeliyor.
2. Yazı detayı dört dilde açılıyor; dil değiştirici **aynı
   yazının** diğer dildeki slug'ına gidiyor.
3. Olmayan slug 404 dönüyor.
4. Detay sayfasında tam olarak bir `h1` var ve başlık ekranda
   iki kez tekrarlanmıyor.
5. `BlogPosting` şemasında `datePublished` 2022 tarihini
   gösteriyor; `dateModified` ondan küçük değil.
6. Tarih ekranda `<time dateTime>` ile ve locale'e göre biçimli
   görünüyor.
7. `relatedServices` dolu olan yazıda ilgili hizmetler bloğu
   çıkıyor ve anchor metni hizmet başlığı; boş olanda blok hiç
   render edilmiyor.
8. Sidebar'daki son yazılar listesinde aktif yazı vurgulu ve
   `aria-current="page"` taşıyor.
9. `/blog?sayfa=2` → `/tr/blog` (parametresiz) yönleniyor ve hedef
   200 dönüyor.
10. Tıbbi uyarı kutusu her yazıda bir kez görünüyor.
11. Arapça'da sidebar, breadcrumb ve kart grid'i aynalanmış.
12. `npm run check` temiz geçiyor.

## Notes

- **Sayfalama eşiği (24 yazı) yazılı olsun ki karar unutulmasın.**
  Bugün 10 yazı için sayfalama yazmak, kullanılmayan kod ve
  bakılması gereken bir yüzey demek.
- `?sayfa=` yönlendirmesinin düzeltilmesi SPEC-004'e dokunuyor;
  `legacy-redirects.ts` ve `validate-seo.ts` birlikte güncellenir,
  aksi halde kapı "hedef yok" hatası verir.
- Blog kart etiketinin sabit `BLOG` olması tasarım kararı. Kategori
  bilgisi detay sayfasında gösterilir; kartta kategori göstermek
  tasarımdan sapma olurdu.
- `getListing`'in dönüş tipi şu an tek anahtara göre sabit. İkinci
  anahtar eklenirken tipin anahtara göre daralması gerekiyor;
  bu düzeltme atlanırsa blog listesi `approach` alanı bekler ve
  çalışma zamanında patlar.
