# Code Standards

## General

- Modüller küçük ve tek amaçlı olur. Bir dosya tek bir şeyi yapar;
  bir bileşen tek bir görsel bloktan sorumludur.
- Kök neden düzeltilir, üstüne katman atılmaz. Bir stil bozuksa
  `!important` veya negatif margin ile örtülmez; token veya layout
  düzeltilir.
- İlgisiz işler tek bileşende karışmaz: veri okuma, i18n çözümleme,
  SEO üretimi ve sunum ayrı katmanlardadır.
- Ölü kod, kullanılmayan import ve yorum satırına alınmış blok
  commit edilmez.
- Yorumlar "ne" değil "neden" anlatır. Tasarımdan sapan bilinçli
  bir karar varsa yorumla gerekçelendirilir.
- Dosya, klasör, değişken ve fonksiyon adları **İngilizce**;
  kullanıcıya görünen tüm metinler `content/` veya `messages/`
  içinde ve **çevrilmiş** olur.

## TypeScript

- `strict: true` zorunlu. `strictNullChecks` kapatılmaz.
- `any` yasak. Dış kaynaktan gelen bilinmeyen veri `unknown` olarak
  alınır ve zod ile daraltılır.
- Tip zorlaması (`as`) yalnızca zod `parse` sonrası veya kaçınılmaz
  DOM durumlarında; her `as` kullanımı bir yorumla gerekçelendirilir.
- İçerik tipleri tek yerde tanımlanır: `lib/content/types.ts`
  (`Service`, `Post`, `TeamMember`, `Page`, `FaqItem`, `GalleryItem`,
  `SeoFrontmatter`). Bileşenler bu tipleri import eder, kendi
  kopyasını yazmaz.
- Prop tipleri `type` ile, ayrı tanımlanır ve export edilmez —
  yalnızca dışarıdan kullanılacaksa export edilir.
- Fonksiyonların dönüş tipi, tip çıkarımı belirsizse açıkça yazılır.
- Enum kullanılmaz; `as const` nesneleri ve union tipler tercih
  edilir (`type Locale = 'tr' | 'en' | 'ar' | 'ru'`).

## Next.js (App Router)

- Varsayılan Server Component. `"use client"` yalnızca tarayıcı
  etkileşimi gerektiğinde ve **mümkün olan en yaprak bileşende**
  eklenir. Bir sayfayı client yapmak için tek bir buton yeterli
  değildir — buton ayrı client bileşenine çıkarılır.
- Veri mutasyonu **Server Action** ile yapılır. Bu projede
  `app/api/` altında route handler yazılmaz.
- Her route segmenti `generateMetadata` export eder. Metadata
  nesnesi elle kurulmaz; `buildMetadata()` yardımcısı kullanılır.
- Dinamik route'lar `generateStaticParams` ile dört dil × tüm
  slug'lar için önceden üretilir.
- `params` ve `searchParams` `Promise`'tir; `await` edilerek okunur.
- Bulunamayan içerik için `notFound()` çağrılır; boş sayfa veya
  yer tutucu render edilmez.
- `loading.tsx` ve `error.tsx` her ana segment için tanımlanır.
- İstemcide `useEffect` ile veri çekilmez; veri sunucuda çözülür ve
  prop olarak iner.
- `next.config.ts` içinde `images.formats` AVIF/WebP açık, harici
  görsel host'ları açıkça beyaz listelenir.

## Site language and routes

- Public site yalnızca Türkçe yayınlanır; ayrı locale routing, dil
  değiştirici veya RTL katmanı bulunmaz.
- Arayüz metinleri `src/messages/tr.json` içindedir; anahtarlar nokta
  ile bölümlenir (`nav.services`, `form.appointment.submit`).
- Sayfa/blog içeriği mesaj dosyalarına konmaz; `content/` ve CMS
  adaptöründen okunur.
- Dahili bağlantılar `@/lib/site-routes` içindeki canonical `Link`
  wrapper'ı üzerinden verilir; admin URL'leri public route'larla
  karıştırılmaz.
- Türkçe metinlerde tarih ve sayı biçimlendirmesi `tr-TR` ile yapılır.
- RTL'e özel sınıflar ve çoklu dil completeness kontrolleri public
  rendering için kullanılmaz.

## Content ve MDX

- Her içerik dosyası `SeoFrontmatter` şemasına uymak zorundadır;
  `lib/content` okuma sırasında zod ile doğrular, eksik alan varsa
  build **başarısız olur**.
- `primaryKeyword` proje genelinde benzersizdir; çakışma build
  hatasıdır.
- `description` 150–160 karakter aralığında olur; kısa veya uzun
  olması build'de uyarı üretir.
- Blog `publishedAt` değeri bir kez yazılır, sonradan
  değiştirilmez. İçerik güncellendiğinde `updatedAt` yenilenir.
- MDX içinde ham HTML kullanılmaz; ihtiyaç duyulan her yapı için
  MDX bileşeni tanımlanır (`<Callout>`, `<Figure>`, `<Steps>`).
- MDX içinde `h1` kullanılmaz — sayfanın `h1`'i başlıktan gelir.
  İçerik `h2` ile başlar.
- Görsel referansları `<Figure>` bileşeni ile verilir; `src`, `alt`
  ve `caption` zorunludur.

## Styling

- Tailwind v4; renk, boşluk ve yarıçap değerleri `ui-context.md`
  içinde tanımlı CSS custom property token'larından gelir.
  Bileşende hardcoded hex (`#2563eb`), rgb veya keyfi piksel
  değeri (`w-[437px]`) kullanılmaz.
- Keyfi değer (`[...]`) yalnızca tasarımda gerçekten tekil olan ve
  token'a girmeyi hak etmeyen ölçüler için; her kullanım yorumla
  gerekçelendirilir.
- Sınıf sırası tutarlı: layout → boyut → boşluk → tipografi →
  renk → efekt → durum (`hover:`, `focus-visible:`) → responsive.
- Koşullu sınıflar `cn()` yardımcısı ile birleştirilir; şablon
  literal ile string birleştirme yapılmaz.
- Bileşen varyantları `cva` ile tanımlanır, `if/else` ile sınıf
  seçilmez.
- Mobil öncelikli yazılır; `sm:` `md:` `lg:` ile büyütülür.
- Global CSS yalnızca token tanımı, font yüklemesi ve reset içerir;
  bileşene özel kural global dosyaya yazılmaz.

## SEO

- Metadata, canonical, hreflang ve JSON-LD **yalnızca** `lib/seo`
  içindeki üreticilerden çıkar. Sayfa dosyasında elle `<script
type="application/ld+json">` yazılmaz; `<JsonLd>` bileşeni
  kullanılır.
- Her sayfada tam olarak bir `h1`. Başlık seviyeleri atlanmaz
  (`h2`'den sonra `h4` gelmez).
- Başlık etiketi stil için kullanılmaz; görsel boyut sınıfla
  ayarlanır, semantik seviye içerik hiyerarşisine göre seçilir.
- Her sayfanın `title`'ı benzersiz ve 60 karakterin altındadır;
  şablon: `{sayfa başlığı} | Dr. Murat Irmak Kliniği`.
- Dış bağlantılar `rel="noopener noreferrer"`, ticari/güvenilmeyen
  olanlar ayrıca `rel="nofollow"` taşır.
- İç bağlantılarda anchor metni açıklayıcıdır; "buraya tıklayın",
  "devamı" gibi anlamsız anchor kullanılmaz — "Mezoterapi
  uygulamasını inceleyin" gibi yazılır.
- `sitemap.ts` ve `robots.ts` Next.js'in dosya tabanlı API'leri ile
  üretilir; statik XML dosyası elle tutulmaz.

## Görseller

- `<img>` yasak. Tüm görseller `next/image` ile render edilir.
- `alt` zorunlu ve anlamlıdır. Boş string yalnızca gerçekten
  dekoratif görsellerde ve `aria-hidden` ile birlikte kullanılır.
- `alt` metni dile göre çevrilir ve sayfanın hedef anahtar
  kelimesini doğal biçimde içerir. Kelime yığını (`botoks halkalı
botoks istanbul botoks fiyat`) yasaktır.
- Dosya adı slug biçiminde, küçük harf, tireli ve anahtar
  kelimelidir: `halkali-botoks-uygulamasi.webp`. `IMG_2381.jpg`,
  `resim1.png` gibi adlar repoya girmez.
- Her `next/image` çağrısında `sizes` doğru tanımlanır; sabit
  boyutlu olmayan görsellerde `fill` + `object-cover` kullanılır.
- Sayfanın LCP görselinde `priority` verilir; sayfada yalnızca bir
  görsel `priority` alır.
- Her sayfanın OG görseli benzersizdir ve 1200×630'dur.

## Server Actions ve Formlar

- Server Action'lar `actions/` altında, dosya başında
  `"use server"` ile tanımlanır.
- Her action ilk satırda girdiyi zod ile doğrular. Doğrulama
  geçmeden hiçbir yan etki (mail, Redis yazımı) tetiklenmez.
- Aynı zod şeması istemcide `react-hook-form` ile de kullanılır —
  şema `lib/schemas/` içinde tek kaynaktır, kopyalanmaz.
- Action'lar tutarlı bir sonuç şekli döner:
  `{ ok: true } | { ok: false; error: 'validation' | 'rate_limit' |
'mail_failed'; fieldErrors?: Record<string, string> }`.
  İstemci bu koda göre çevrilmiş mesajı `messages/` içinden gösterir;
  sunucudan kullanıcıya ham hata metni dönmez.
- Sıra sabittir: doğrula → honeypot ve süre kontrolü → oran sınırı
  → mail gönder → sonuç dön.
- Hata durumunda `console.error` ile sunucuda loglanır; kullanıcıya
  teknik detay (SMTP hatası, stack trace) sızdırılmaz.
- Form gönderimi sırasında buton `disabled` ve durum göstergeli
  olur; çift gönderim engellenir.

## Mail

- Nodemailer transport'u modül seviyesinde bir kez kurulur ve
  yeniden kullanılır; her istekte yeniden yaratılmaz.
- Alıcı adres, gönderen adres ve SMTP bilgileri yalnızca env'den
  okunur; kodda sabit e-posta adresi bulunmaz.
- İki mail gider: kliniğe talep detayı, kullanıcıya onay. Kullanıcı
  maili gönderilemezse klinik maili yine de gitmiş sayılır ve akış
  başarılı döner.
- Mail gövdesi hem HTML hem düz metin sürümü içerir.
- Kullanıcı girdisi mail gövdesine kaçışlanarak yazılır; HTML
  enjeksiyonuna açık şekilde birleştirilmez.

## Erişilebilirlik

- Tüm etkileşimli öğeler klavye ile erişilebilir ve görünür bir
  `focus-visible` halkasına sahiptir.
- Yalnızca ikon içeren butonlarda `aria-label` zorunludur (float
  WhatsApp ve arama butonları dahil).
- Form alanları `<label>` ile ilişkilendirilir; placeholder etiket
  yerine geçmez.
- Hata mesajları `aria-describedby` ile alana bağlanır ve
  `role="alert"` ile duyurulur.
- Metin/arka plan kontrastı en az 4.5:1.
- Modal ve mobil menüde odak tuzağı kurulur, `Esc` ile kapanır.

## File Organization

- `app/[locale]/` — route segmentleri, layout, `generateMetadata`.
- `components/ui/` — jenerik tasarım sistemi bileşenleri.
- `components/shared/` — siteye özel, çok sayfada kullanılan
  bileşenler.
- `components/sections/` — sayfa blokları (Hero, ServicesGrid, ...).
- `content/{tr,en,ar,ru}/` — MDX ve JSON içerik.
- `lib/content/` — içerik adaptörü; `fs` importuna izin verilen tek
  yer.
- `lib/seo/` — metadata, hreflang, JSON-LD üreticileri.
- `lib/i18n/` — locale config, slug haritası, `localizedHref`,
  legacy redirect haritası.
- `lib/mail/` — transport ve şablonlar.
- `lib/schemas/` — zod şemaları (istemci ve sunucu ortak).
- `lib/utils/` — `cn()` ve saf yardımcılar.
- `actions/` — Server Actions.
- `messages/` — arayüz metni JSON'ları.
- `public/images/{services,blog,team,gallery,og}/` — görseller.

## Adlandırma

- Bileşen dosyaları `PascalCase.tsx` (`ServiceCard.tsx`).
- Yardımcı ve config dosyaları `kebab-case.ts` (`localized-href.ts`).
- İçerik dosyaları slug adıyla (`halkali-botoks-merkezi.mdx`).
- Bileşen adı görevini söyler; `Wrapper`, `Container2`, `NewCard`
  gibi adlar kullanılmaz.
- Boolean prop'lar `is`/`has`/`should` ile başlar.

## Commit ve Doğrulama

- Her commit öncesi `npm run build`, `npm run lint` ve
  `npx tsc --noEmit` temiz geçer.
- Commit mesajı Conventional Commits: `feat:`, `fix:`, `content:`,
  `seo:`, `chore:`.
- İçerik commit'i ile kod commit'i ayrılır.
- Bir iş bitince `progress-tracker.md` aynı commit içinde güncellenir.
