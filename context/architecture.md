# Architecture Context

## Stack

| Layer       | Technology                                          | Role                                                                 |
| ----------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Framework   | Next.js 16.3 (App Router) + React 19.2 + TypeScript | Routing, RSC, statik üretim, metadata API, Turbopack                 |
| Dil / i18n  | next-intl                                           | Locale routing, çeviri sözlükleri, RTL, dile göre slug eşleme        |
| UI          | Tailwind CSS v4 + shadcn/ui (Radix)                 | Tasarım token'ları, akordeon/dialog/sheet gibi erişilebilir primitif |
| İkon        | lucide-react                                        | Stroke tabanlı ikon seti                                             |
| İçerik      | MDX (`next-mdx-remote/rsc`) + JSON                  | Blog ve uzun metin MDX, yapılandırılmış veri JSON                    |
| Frontmatter | gray-matter                                         | MDX başlıklarından meta + SEO alanlarını okuma                       |
| Form        | react-hook-form + zod                               | İstemci doğrulama + sunucu tarafı şema doğrulaması (aynı şema)       |
| Mutasyon    | Server Actions                                      | Randevu ve iletişim formu gönderimi (API route değil)                |
| Mail        | Nodemailer + SMTP                                   | Kliniğe talep maili, kullanıcıya onay maili                          |
| Rate limit  | Upstash Redis + `@upstash/ratelimit`                | Form gönderiminde IP başına kalıcı oran sınırı (Vercel Marketplace)  |
| Görsel      | `next/image` + sharp                                | AVIF/WebP dönüşümü, responsive `sizes`, lazy load                    |
| Analitik    | Vercel Analytics + Speed Insights                   | Trafik ve Core Web Vitals alan verisi                                |
| Dağıtım     | Vercel                                              | Statik + ISR, edge cache, `drmuratirmak.com` domaini                 |

Bağımlılık kuralı: bu tabloda olmayan bir paket, `progress-tracker.md`'ye
gerekçesiyle yazılmadan projeye eklenmez. Animasyon, slider ve lightbox
için önce CSS/Radix çözümü denenir; ağır JS kütüphanesi son çaredir.

## System Boundaries

- `app/[locale]/` — Yalnızca routing, layout ve sayfa kompozisyonu.
  Sayfalar veri **çekmez**, `lib/content` adaptöründen **ister** ve
  `components/` içindeki bölümlere dağıtır. Her route segmenti kendi
  `generateMetadata` fonksiyonunu export eder.
- `components/ui/` — Tasarım sisteminin yapı taşları (Button, Card,
  Accordion, Input, Badge, Container). İçerik veya iş kuralı bilmez,
  yalnızca prop alır.
- `components/shared/` — Siteye özel, birden çok sayfada kullanılan
  bileşenler: Header, Footer, LanguageSwitcher, FloatingActions
  (WhatsApp + Ara), Breadcrumbs, ServiceCard, PostCard, Lightbox.
- `components/sections/` — Sayfa bölümleri (Hero, ServicesGrid,
  WhyUs, ProcessSteps, FaqAccordion, CtaBand, LatestPosts). Tasarım
  PDF'lerindeki bloklarla birebir eşleşir.
- `content/` — Tek gerçek kaynak. **Varlık-önce** düzen: her
  içeriğin klasörü kimliğidir ve dört dil o klasörün içindedir
  (`content/services/botoks-dolgu/{tr,en,ar,ru}.mdx`). Klasör adı
  URL değildir; URL'de görünen slug her dilin frontmatter'ından
  gelir. Kod içermez, sadece içerik ve frontmatter.
- `lib/content/` — İçerik adaptörü. Dosya sistemini okuyan **tek**
  yer. Dışarıya tip güvenli fonksiyonlar verir (`getService`,
  `listServices`, `getPost`, `listPosts`, `getPage`, `getTeam`,
  `getFaq`, `getGallery`). İleride CMS'e geçilirse yalnızca bu
  klasörün içi değişir.
- `lib/seo/` — Metadata, hreflang, canonical ve JSON-LD üreticileri.
  Şema üretimi başka hiçbir yerde elle yazılmaz.
- `lib/i18n/` — Locale tanımları, `routing.ts`, dile göre slug
  haritası ve `localizedHref()` yardımcıları.
- `lib/mail/` — Nodemailer transport'u ve mail şablonları. Tek
  `sendAppointmentRequest()` / `sendContactMessage()` girişi.
- `actions/` — Server Actions. Doğrulama → rate limit → mail →
  sonuç. İş kuralı burada, bileşenlerde değil.
- `src/messages/` — Arayüz metinleri (buton, etiket, hata mesajı)
  için dil bazlı JSON. `@/messages/*` bu dizine çözülür; kökte ikinci
  bir kopya tutulmaz. Sayfa içeriği buraya **konmaz**.
- `public/images/` — Statik görseller; alt klasörler içerik tipine
  göre (`services/`, `blog/`, `team/`, `gallery/`, `og/`).
- `app/admin/` — İleride kullanılmak üzere ayrılmış boş yuva. Bu
  sürümde route dosyası oluşturulmaz, yalnızca mimaride yeri vardır.

## Routing Model

```
/                       → /tr'ye redirect (308)
/[locale]               → Anasayfa
/[locale]/[page]        → Kurumsal sayfalar (hakkimizda, misyonumuz, ...)
/[locale]/[services]              → Hizmet listesi
/[locale]/[services]/[slug]       → Hizmet detayı
/[locale]/[blog]                  → Blog listesi (?page=, ?kategori=)
/[locale]/[blog]/[slug]           → Blog detayı
/[locale]/[team]/[slug]           → Ekip üyesi detayı
/[locale]/[gallery] | [video]     → Galeriler
/[locale]/[faq] | [appointment] | [contact]
/[locale]/[legal]/[slug]          → KVKK, gizlilik, çerez
```

Köşeli parantezli segment adları (`[services]`, `[blog]`) dile göre
`lib/i18n/slugs.ts` haritasından çözülür; TR'de `hizmetler`, EN'de
`services`, AR'de `الخدمات`, RU'da `uslugi` olarak render edilir.
URL'ler kodda string birleştirilerek üretilmez — daima
`localizedHref(locale, route, params)` kullanılır.

**Arapça slug kararı:** Arapça URL'ler Latin harfe çevrilmez, ana
dilde yazılır (`/ar/الخدمات`). Tarayıcı bunu percent-encode ederek
gösterir; paylaşımdaki görüntü kirliliği bilinçli olarak kabul
edilmiştir çünkü Arapça sorgularda URL–anahtar kelime eşleşmesi
öncelikli. Aynı kural Rusça için geçerli **değildir**: Rusça
slug'lar Latin transliterasyonla yazılır (`/ru/uslugi`) — Rusça
arama sonuçlarında yaygın ve okunabilir olan biçim budur.

Eski site URL'leri `next.config.ts` içindeki `redirects()` ile kalıcı
(308/301) olarak yeni karşılıklarına taşınır. Bu harita
`lib/i18n/legacy-redirects.ts` dosyasında tek yerde tutulur.

## Rendering Strategy

- Varsayılan: tüm içerik sayfaları **build sırasında statik** üretilir
  (`generateStaticParams` ile dört dil × tüm slug'lar).
- İçerik dosyadan geldiği için ISR'a bugün ihtiyaç yok; içerik
  değişimi yeni deploy demektir. CMS'e geçildiğinde `revalidate`
  bu katmanda açılır.
- İstemci bileşeni yalnızca gerçek etkileşim için: mobil menü, dil
  değiştirici, SSS akordeonu, galeri lightbox, formlar, float
  butonların görünürlük durumu.
- Video gömmeleri tıklanana kadar yalnızca kapak görseli yükler
  (facade pattern) — üçüncü parti script LCP'yi bozmaz.

## Storage Model

- **Repo dosya sistemi (`content/`)** — Sitenin tüm içeriği: sayfa
  metinleri, hizmetler, blog yazıları, ekip, SSS, galeri manifest'i,
  klinik künyesi (`clinic.json`), SEO frontmatter'ı. Versiyonlanır,
  review edilebilir, geri alınabilir. Uzun metin MDX, listelenen
  kısa kayıtlar (SSS, galeri, video) JSON tutulur.
- **`public/images/`** — Tüm görsel varlıklar. Dosya adları slug
  biçiminde ve anahtar kelimelidir; yeniden adlandırma bir SEO
  kararıdır, keyfi değiştirilmez.
- **`messages/*.json`** — Yalnızca arayüz metinleri.
- **Upstash Redis (Vercel Marketplace)** — Yalnızca oran sınırı
  sayaçları. Anahtar: hash'lenmiş IP + form tipi, TTL ile kendini
  temizler. İçerik, form verisi veya kişisel veri **buraya yazılmaz**.
- **İçerik veritabanı yok.** Form gönderimleri sunucuda saklanmaz,
  yalnızca e-posta olarak iletilir. Bu bilinçli bir karardır: hasta
  verisi tutulmadığı için KVKK yükümlülüğü minimumda kalır.
- **Ortam değişkenleri (Vercel)** — SMTP bilgileri, alıcı e-posta,
  site URL'i, analitik anahtarları. Repoda asla bulunmaz.

## Content Model

Her içerik dosyası aşağıdaki SEO frontmatter'ını taşımak zorundadır:

```yaml
title: # <title> ve h1 için temel
description: # meta description, 150-160 karakter
slug: # dile özel URL parçası
primaryKeyword: # sayfanın tek birincil anahtar kelimesi
secondaryKeywords: [] # 2-3 destekleyici kelime
ogImage: # /images/og/... benzersiz görsel
publishedAt: # blog için orijinal tarih (değiştirilmez)
updatedAt: # içerik güncellenince yenilenir
relatedServices: [] # iç linkleme için
relatedPosts: []
```

Birincil anahtar kelimeler proje genelinde benzersizdir; çakışma
build sırasında hata verir (kanibalizasyon koruması).

## Auth and Access Model

- Bu sürümde kimlik doğrulama **yoktur**. Site tamamen kamuya açıktır.
- Yazma yolu tek bir yerdedir: Server Action ile form gönderimi.
  Bu yol kimlik değil, **kötüye kullanım** koruması ile güvenlidir:
  zod şeması, honeypot alanı, minimum doldurma süresi kontrolü ve
  Upstash Redis üzerinde kalıcı IP oran sınırı (örn. 5 gönderim /
  saat / IP). IP ham haliyle saklanmaz, hash'lenerek anahtar
  üretilir ve TTL sonunda silinir.
- İleride admin paneli eklendiğinde: `app/admin/` altında ayrı bir
  layout, middleware ile korunan segment ve `lib/content`'in yazma
  yeteneği kazanmış bir sürümü. Bugünkü kod bu geçişi engelleyecek
  hiçbir varsayım yapmaz.

## Invariants

1. Sayfa bileşenleri dosya sistemine doğrudan erişmez. `fs` ve
   `path` importu yalnızca `lib/content/` içinde bulunabilir.
2. Kullanıcıya görünen hiçbir metin bileşene sabit yazılmaz —
   arayüz metni `messages/`, içerik `content/` üzerinden gelir.
   Bu kural dört dilin de eksiksiz kalmasını garanti eder.
3. Her route segmenti `generateMetadata` export eder; canonical ve
   dört dilli `hreflang` alternatifleri `lib/seo` üzerinden üretilir,
   elle yazılmaz.
4. Her sayfada tam olarak bir `h1` bulunur ve başlık seviyeleri
   atlanmaz.
5. Hiçbir `<img>` etiketi kullanılmaz; tüm görseller `next/image`
   iledir ve `alt` prop'u zorunludur, boş string kabul edilmez.
6. Sunucuya gelen hiçbir veri zod ile doğrulanmadan işlenmez; mail
   gönderimi doğrulama başarılı olmadan tetiklenmez.
7. Gizli bilgi (SMTP şifresi, Redis token'ı, alıcı adres) yalnızca
   sunucu tarafında okunur; `NEXT_PUBLIC_` öneki hiçbir gizli değere
   verilmez.
8. Dahili bağlantılar `localizedHref()` üzerinden üretilir; elle
   `/tr/hizmetler` gibi string yazılmaz.
9. Varsayılan Server Component'tir. `"use client"` yalnızca tarayıcı
   etkileşimi zorunlu olduğunda ve mümkün olan en yaprak bileşende
   kullanılır.
10. Veri mutasyonu Server Action ile yapılır; bu proje için `app/api/`
    altında route handler yazılmaz.
11. Bir dile içerik eklenirken diğer üç dilde karşılığı aynı commit
    içinde eklenir; eksik çeviri ile merge edilmez. Bu yapısal
    olarak denetlenir: her varlık klasöründe tam olarak dört dosya
    bulunur.
12. Eski bir URL kaldırılırsa `legacy-redirects.ts` içine karşılığı
    aynı anda eklenir — hiçbir eski adres 404 dönmez.
13. Redis yalnızca oran sınırı için kullanılır. Form içeriği, kişisel
    veri veya içerik önbelleği Redis'e yazılmaz.
14. Redis erişilemezse form gönderimi **engellenmez**; oran sınırı
    atlanır ve olay loglanır. Altyapı arızası hastanın randevu
    talebini düşürmez.
