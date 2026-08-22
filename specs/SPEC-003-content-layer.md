# SPEC-003 — İçerik katmanı

**Faz:** 1 — Temel
**Bağımlılık:** SPEC-002
**Sonraki:** SPEC-004 (SEO katmanı)

## Goal

`content/` klasörünün şemasını ve `lib/content` adaptörünü kurmak.
Bu spec bittiğinde: içerik dört dilde dosyadan tip güvenli biçimde
okunabiliyor, her içeriğin dört dildeki karşılığı birbirine bağlı,
eksik çeviri ve eksik/hatalı frontmatter build'i düşürüyor,
anahtar kelime çakışması yakalanıyor olmalı.

Bu katman projenin **tek veri kaynağıdır**. Sayfalar dosya
sistemine asla dokunmaz; ileride admin paneli geldiğinde yalnızca
bu klasörün içi değişir.

## Context

- `context/architecture.md` → System Boundaries (`content/`,
  `lib/content/`), Storage Model, Content Model, Invariant 1 ve 11.
- `context/code-standards.md` → TypeScript, Content ve MDX.
- `context/project-overview.md` → Sayfa envanteri, SEO/anahtar
  kelime haritası kuralı.

## Mimari değişiklik (bu spec ile karara bağlanıyor)

`architecture.md` başlangıçta içeriği `content/{locale}/...`
biçiminde konumlandırıyordu. Bu spec bunu **dil-önce** yerine
**varlık-önce** düzene çeviriyor:

```
content/services/botoks-dolgu/{tr,en,ar,ru}.mdx
```

**Neden:** Dört dilli bir sitede her içeriğin dört dildeki
karşılığının birbirine bağlı olması gerekir — hreflang üretimi,
dil değiştirici ve "eksik çeviri" tespiti bunun üzerine kurulu.
Dil-önce düzende slug'lar dile göre değiştiği için
(`botoks-dolgu` ↔ `botox-fillers` ↔ `الفيلر` ↔ `botoks-filler`)
bu bağ ancak frontmatter'a elle yazılan bir `id` alanıyla
kurulabilir ve o alan yanlış yazıldığında sessizce kırılır.

Varlık-önce düzende **klasör adı kimliktir**; bağ yapısaldır,
yazım hatasıyla kırılamaz ve eksik çeviri `ls` kadar basit bir
kontrolle bulunur (klasörde 4 dosya yoksa eksiktir). Bu,
`architecture.md` → Invariant 11'i ("eksik çeviri ile merge
edilmez") denetlenebilir hale getirir.

`architecture.md` ve `progress-tracker.md` bu karara göre
güncellenir.

## Scope

- `content/` klasör şeması ve klasör kimliği (`id`) sözleşmesi.
- `SeoFrontmatter` ve içerik tipi zod şemaları.
- MDX derleme hattı (`gray-matter` + `next-mdx-remote/rsc`).
- `lib/content` genel API'si (okuma fonksiyonları).
- Dil-arası çeviri çözümleme (`getAlternates`).
- Doğrulama kapısı: eksik çeviri, eksik/hatalı frontmatter,
  anahtar kelime çakışması, slug çakışması.
- MDX bileşen haritası (`Callout`, `Figure`, `Steps`).
- `content/clinic.json` — NAP ve klinik künyesi.
- Her içerik tipinden bir örnek kayıt (dört dilde).

## Out of Scope

- Metadata/JSON-LD üretimi — SPEC-004 (bu katman veriyi verir,
  SEO'yu üretmez).
- Sayfa bileşenleri ve şablonlar — SPEC-006+.
- Gerçek içeriğin doldurulması — SPEC-011. Burada yalnızca yapıyı
  doğrulayan örnek kayıtlar olur.
- Görsellerin indirilmesi/optimize edilmesi — SPEC-011.

## Implementation

### 1. Klasör şeması

```
content/
  clinic.json                     # NAP, telefon, e-posta, sosyal, saatler
  services/
    botoks-dolgu/                 # klasör adı = id (dilden bağımsız)
      tr.mdx  en.mdx  ar.mdx  ru.mdx
    ozon-tedavisi/
      ...
  blog/
    halkali-botoks-merkezi/
      tr.mdx  en.mdx  ar.mdx  ru.mdx
  team/
    murat-irmak/  melisa-k/  esra-b/
  pages/
    about/  mission/  vision/  quality/
  legal/
    kvkk/  privacy/  cookies/
  faq/
    tr.json  en.json  ar.json  ru.json
  gallery/
    images.json                   # dilden bağımsız dosya listesi
    alt.tr.json  alt.en.json  alt.ar.json  alt.ru.json
  video/
    videos.json
    meta.tr.json  ...
```

**Kimlik kuralı:** Klasör adı `id`'dir, Latin harfli ve
kebab-case'dir, **hiçbir zaman URL olarak kullanılmaz**. URL'de
görünen slug her dilin kendi frontmatter'ından gelir.

**Galeri/SSS neden JSON:** Uzun metin değil, listelenen kısa
kayıtlar. MDX derleme maliyetine girmeye değmez.

**`alt` metinleri neden ayrı dosyada:** Görsel listesi dilden
bağımsız (aynı dosyalar), `alt` metinleri dile bağlı. Ayırmak,
bir görsel eklendiğinde dört dilde `alt` yazılmasını zorunlu
kılar — `project-overview.md`'deki görsel SEO kuralının
denetlenebilir hali.

### 2. Frontmatter şeması

`src/lib/content/schemas.ts`:

```ts
const seoFrontmatter = z.object({
  title: z.string().min(10).max(70),
  description: z.string().min(120).max(165),
  slug: z.string().min(1),
  primaryKeyword: z.string().min(2),
  secondaryKeywords: z.array(z.string()).min(1).max(4),
  ogImage: z.string().startsWith('/images/og/'),
  heroImage: z.string().startsWith('/images/'),
  heroImageAlt: z.string().min(10),
  noindex: z.boolean().default(false),
});
```

Tip bazlı genişletmeler:

- `serviceFrontmatter` — `+ shortDescription`, `+ cardImage`,
  `+ cardImageAlt`, `+ order` (listedeki sıra),
  `+ relatedPosts: string[]` (blog **id**'leri),
  `+ features: {title, description}[]` (özellik kartları).
- `postFrontmatter` — `+ publishedAt` (ISO tarih, `.datetime()`),
  `+ updatedAt`, `+ category`, `+ relatedServices: string[]`,
  `+ author` (varsayılan: Dr. Murat Irmak).
- `teamFrontmatter` — `+ name`, `+ role`, `+ photo`, `+ photoAlt`,
  `+ order`.
- `pageFrontmatter` — sadece temel şema.
- `legalFrontmatter` — `+ noindex` varsayılanı `false` ama
  `robots: 'noindex'` isteğe bağlı; yasal sayfalar indekslenir.

**İlişkiler `id` ile kurulur, slug ile değil.** `relatedPosts:
['halkali-botoks-merkezi']` dört dilde de çalışır; slug yazılsaydı
yalnızca tek dilde çözülürdü.

`slug` alanı için ek kural: Arapça slug'larda Arap harfleri
serbesttir; diğer dillerde `/^[a-z0-9-]+$/` zorunludur (Rusça
transliterasyon kararı gereği).

### 3. Okuma hattı

`src/lib/content/` içinde ve **yalnızca burada** `node:fs`
kullanılır (`architecture.md` → Invariant 1). Lint kuralı:
`no-restricted-imports` ile `fs`/`node:fs`/`path` importu bu
klasör dışında hata verir.

Akış:

1. `gray-matter` ile dosya ayrıştırılır.
2. Frontmatter ilgili zod şemasıyla `parse` edilir — hata
   fırlatır, `safeParse` ile yutulmaz. Hata mesajı dosya yolunu
   içerir (`content/services/botoks-dolgu/ar.mdx: description
çok kısa (98 karakter, en az 120)`).
3. Gövde `next-mdx-remote/rsc` ile derlenir ve MDX bileşen
   haritası uygulanır.
4. Sonuç `React.cache()` ile istek başına, modül seviyesinde
   `Map` ile build boyunca bellekte tutulur — aynı dosya iki kez
   okunmaz.

### 4. Genel API

`src/lib/content/index.ts` dışarıya yalnızca şunları verir:

```ts
// Listeler
listServices(locale): ServiceSummary[]        // order'a göre sıralı
listPosts(locale, opts?): { items, total, totalPages }
listTeam(locale): TeamSummary[]
getFaq(locale): FaqItem[]
getGallery(locale): GalleryItem[]
getVideos(locale): VideoItem[]

// Tekil kayıtlar — URL'den gelen slug ile
getServiceBySlug(locale, slug): Service | null
getPostBySlug(locale, slug): Post | null
getTeamMemberBySlug(locale, slug): TeamMember | null
getPage(locale, key): Page | null
getLegal(locale, slug): Legal | null

// Kimlikten — ilişkiler ve çeviriler için
getServiceById(locale, id): Service | null
getPostById(locale, id): Post | null

// Route üretimi ve SEO
listSlugs(type, locale): string[]             // generateStaticParams
getAlternates(type, id): Record<Locale, string>   // hreflang
resolveIdBySlug(type, locale, slug): string | null

// Künye
getClinic(): Clinic
```

`ServiceSummary` liste için gereken alanları taşır (başlık, kısa
açıklama, kart görseli, slug); tam gövde yalnızca `getService*`
ile derlenir. Liste sayfaları 10 MDX gövdesini boşuna derlemez.

Dönüş tipi `null` olan fonksiyonlarda sayfa `notFound()` çağırır
(`code-standards.md` → Next.js).

### 5. Çeviri çözümleme

`getAlternates('services', 'botoks-dolgu')` →
`{ tr: 'botoks-dolgu', en: 'botox-fillers', ar: 'الفيلر',
   ru: 'botoks-filler' }`

Bu, SPEC-004'ün hreflang üreticisinin ve `LanguageSwitcher`'ın
detay sayfalarındaki davranışının temelidir. SPEC-002'de dil
değiştirici yalnızca statik yollarda çalışıyordu; bu fonksiyonla
detay sayfalarında da doğru karşılığa gidecek.

### 6. Doğrulama kapısı

`scripts/validate-content.ts` — `npm run content:check` ile
çalışır ve `npm run check` zincirine eklenir. Kontroller:

1. **Eksik çeviri:** Her varlık klasöründe tam olarak dört dosya
   (`tr|en|ar|ru`.mdx) var mı?
2. **Frontmatter:** Her dosya kendi zod şemasından geçiyor mu?
3. **Anahtar kelime çakışması:** `primaryKeyword` aynı dil
   içinde iki kez geçiyor mu? (Kanibalizasyon koruması.)
4. **Slug çakışması:** Aynı dil ve aynı içerik tipinde iki slug
   aynı mı?
5. **İlişki bütünlüğü:** `relatedPosts` / `relatedServices`
   içindeki her `id` gerçekten var mı?
6. **Görsel varlığı:** `heroImage`, `cardImage`, `ogImage`,
   `photo` yolları `public/` altında gerçekten duruyor mu?
7. **Galeri `alt` bütünlüğü:** `images.json` içindeki her dosya
   için dört dilde `alt` metni var mı?
8. **Tarih tutarlılığı:** `updatedAt >= publishedAt`;
   `publishedAt` gelecekte değil.

Hepsi hata olarak raporlanır ve script sıfırdan farklı kodla
çıkar. Rapor **tüm** hataları listeler, ilkinde durmaz — 34
sayfa × 4 dilde tek tek build koşturmak işkencedir.

`description` uzunluğu şemada zorunlu (120–165); bu bir uyarı
değil hatadır — `project-overview.md`'de "150-160 karakter" yazan
hedef, pratikte biraz esneklik gerektirdiği için aralık
genişletilmiştir.

### 7. MDX bileşenleri

`src/components/mdx/` altında, `lib/content` tarafından haritaya
bağlanır:

- `<Callout variant="info" | "warning">` — `--bg-tint` zemin,
  `border-s-4` `--accent-primary`. Tıbbi sorumluluk reddi bununla
  verilir.
- `<Figure src alt caption?>` — `next/image` sarmalayıcısı;
  `alt` zorunlu, boş string tip düzeyinde reddedilir.
- `<Steps>` / `<Step title>` — numaralı süreç listesi.
- `<ServiceLink id>` / `<PostLink id>` — id ile iç link; anchor
  metnini hedefin başlığından alır, böylece "buraya tıklayın"
  anchor'ı yazmak imkânsızlaşır.

Varsayılan HTML elementleri de haritalanır: `h2`/`h3` tipografi
ölçeğine bağlanır, `a` next-intl `Link`'ine, `img` **hata
fırlatır** (MDX içinde ham görsel yasak, `<Figure>` kullanılır).

MDX içinde `h1` bulunursa doğrulama hatası verir
(`code-standards.md` → Content ve MDX).

### 8. `content/clinic.json`

Tek künye kaynağı: ad, yasal ad, adres (sokak, ilçe, il, posta
kodu, ülke), coğrafi koordinat, telefon, WhatsApp numarası,
e-postalar, sosyal hesaplar, çalışma saatleri, kuruluş yılı.

Kullanıcıya görünen serbest metinler (örn. adres etiketi) dile
göre `clinic.{locale}.json` içinde override edilebilir; sayısal
ve teknik veriler tek dosyada kalır.

Bu dosya footer, iletişim sayfası, float butonlar ve SPEC-004'ün
`MedicalClinic` şeması tarafından kullanılır — telefon numarası
projede başka hiçbir yere yazılmaz.

**Not:** Çalışma saatleri henüz bilinmiyor
(`progress-tracker.md` → Open Questions #6). Alan şemada zorunlu
tanımlanır ama örnek kayıt `null` bırakılır ve
`MedicalClinic` şemasında `openingHours` yalnızca doluysa
üretilir. Uydurulmaz.

### 9. Örnek kayıtlar

Yapıyı uçtan uca doğrulamak için, her tipten **bir** kayıt dört
dilde oluşturulur:

- `services/botoks-dolgu/` — mevcut siteden alınan TR metin +
  üç çeviri.
- `blog/halkali-botoks-merkezi/`
- `team/murat-irmak/`
- `pages/about/`
- `legal/kvkk/`
- `faq/*.json` — üç soru.
- `gallery/` — üç görsel + dört dilde `alt`.

Görseller SPEC-011'e kadar yer tutucu olabilir ama **dosya adı
kuralına uyar** (slug + anahtar kelime) ve `public/` altında
gerçekten bulunur — yoksa doğrulama kapısı #6 hata verir.

## Acceptance

1. `getServiceBySlug('tr', 'botoks-dolgu')` ve
   `getServiceBySlug('en', <en slug>)` aynı içeriğin iki dilini
   döndürüyor.
2. `getAlternates('services', 'botoks-dolgu')` dört dilin
   slug'ını veriyor.
3. Bir dilin dosyası silindiğinde `npm run content:check` "eksik
   çeviri" hatası veriyor.
4. `description` 100 karaktere düşürüldüğünde dosya yolunu içeren
   net bir hata çıkıyor.
5. İki hizmete aynı `primaryKeyword` verildiğinde doğrulama
   çakışmayı yakalıyor.
6. `relatedPosts` içine olmayan bir `id` yazıldığında hata
   çıkıyor.
7. Frontmatter'da olmayan bir görsel yolu verildiğinde hata
   çıkıyor.
8. `lib/content` dışında `fs` import eden bir dosya lint'ten
   geçmiyor.
9. MDX içinde `<img>` veya `h1` kullanıldığında hata çıkıyor.
10. `listServices('tr')` MDX gövdelerini derlemiyor (liste
    sayfası için gereksiz iş yapılmıyor).
11. Doğrulama script'i ilk hatada durmuyor, tüm hataları
    listeliyor.
12. `npm run check` temiz geçiyor.

## Notes

- **Bu spec'in asıl ürünü doğrulama kapısıdır.** Okuma
  fonksiyonlarını yazmak kolay; 34 sayfa × 4 dil dolarken
  hataları yakalayacak olan kapı olmadan SPEC-011 kontrolden
  çıkar. Kapı olmazsa eksik `alt`, çakışan anahtar kelime ve
  kırık ilişki canlıya kadar gider.
- Klasör-kimlik kararı geri dönülmesi pahalı bir karardır; içerik
  doldurulmadan **şimdi** sabitlenmesi bilinçlidir.
- `next-mdx-remote/rsc` yerine `@next/mdx` (dosya tabanlı MDX
  route'ları) tercih edilmedi: içerik route değil **veri**;
  dört dilde slug'ı değişen kayıtlar dosya tabanlı route'a
  oturmaz.
- Build performansı: 35 varlık × 4 dil = ~140 MDX dosyası.
  Liste sayfalarında gövde derlenmediği için build süresi
  sorun olmamalı; olursa `listSlugs` ve summary okumaları
  frontmatter-only moda alınır (gövdeyi hiç okumaz).
- İçerik dosyaları `ai-workflow-rules.md` → Protected Files
  kapsamındadır: `publishedAt` alanı bir kez yazılır, sonra
  değiştirilmez.
