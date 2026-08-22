# Progress Tracker

Bu dosya her anlamlı uygulama değişikliğinden sonra güncellenir.

## Current Phase

- **Faz 3.** SPEC-012'nin kod tarafı (A) tamamlandı. Site teknik
  olarak yayına hazır; hesap tarafı (B) kullanıcı erişimi bekliyor.

## Current Goal

- Klinikten bekleyen 7 kalemi kapatmak, ardından Vercel projesi,
  domain, SMTP ve Search Console adımlarını yürütmek.

## Completed

- Mevcut `drmuratirmak.com` sitesi fetch edildi; anasayfa,
  hizmetler, blog, SSS, randevu ve iletişim sayfalarının metinleri,
  menü yapısı, URL şeması ve iletişim bilgileri çıkarıldı.
- 34 tasarım PDF'i envanterlendi; anasayfa, hizmet detayı ve
  iletişim tasarımları incelendi, renk token'ları piksel
  örneklemesiyle doğrulandı.
- `project-overview.md` — kapsam, sayfa listesi, hedefler, başarı
  ölçütleri.
- `architecture.md` — stack, sistem sınırları, routing modeli,
  render stratejisi, içerik modeli, 14 invariant.
- `code-standards.md` — TypeScript, App Router, i18n, MDX, stil,
  SEO, görsel, Server Action, mail, erişilebilirlik kuralları.
- `ui-context.md` — renk/tipografi/radius token'ları, layout
  desenleri, buton ve form spesifikasyonları, RTL kuralları.
- `ai-workflow-rules.md` — çalışma akışı, içerik ve SEO kuralları,
  korumalı dosyalar.
- `specs/ROADMAP.md` — 12 spec'lik uygulama planı, bağımlılık
  zinciri ve faz ayrımı.
- `specs/SPEC-001-project-setup.md` — proje kurulumu ve tasarım
  token'ları.
- `specs/SPEC-002-i18n-foundation.md` — dört dilin routing, çeviri
  ve RTL altyapısı.
- `specs/SPEC-003-content-layer.md` — içerik şeması, `lib/content`
  adaptörü ve doğrulama kapısı.
- `specs/SPEC-004-seo-layer.md` — metadata, hreflang, JSON-LD,
  sitemap, robots ve 31 girişlik 301 haritası.
- **SPEC-001 → SPEC-004 uygulandı.** Build temiz, tüm sayfalar
  statik üretiliyor, 68 URL'lik sitemap alternate'leriyle çıkıyor,
  31 eski URL tek adımda 308 ile yönleniyor.
- Eski sitenin tüm URL'leri çıkarıldı: 9 hizmet, 10 blog,
  10 kurumsal/sistem sayfası + sayfalama parametresi.
- **SPEC-001 uygulandı:** Next.js 16.3 + React 19.2 + TypeScript strict
  projesi kuruldu, Tailwind v4 `@theme` renk/tipografi/radius token'ları
  uygulandı, `src/lib/fonts.ts` (Inter + IBM Plex Sans Arabic),
  `src/lib/utils/cn.ts`, `Container`, `Section`, `SectionLabel`,
  `Button` (primary, secondary, onImage, ghost) bileşenleri ayağa
  kaldırıldı.
- **SPEC-002 uygulandı:** `next-intl@4.13.7` kuruldu, `src/i18n/routing.ts`
  ile 4 dil (TR, EN, AR, RU) ve 12 statik yol tanımlandı, Next 16 `src/proxy.ts`
  ile locale yönlendirmesi kuruldu, `src/i18n/navigation.ts` ve `localizedHref`
  oluşturuldu, `app/[locale]/layout.tsx` (RTL, font seçimi, statik üretim),
  `LanguageSwitcher` bileşeni ve geçici i18n doğrulama sayfası eklendi.
  `next/link` doğrudan importu ESLint ile kısıtlandı. Dört dilde statik HTML
  üretimi `npm run check` ile doğrulandı.
- **SPEC-003 uygulandı:** Varlık-önce `content/` şeması kuruldu,
  `src/lib/content/schemas.ts` zod şemaları ve `types.ts` tanımlandı,
  `gray-matter` + `next-mdx-remote/rsc` okuma hattı ve `src/lib/content/index.ts`
  genel API'si (`listServices`, `getServiceBySlug`, `getAlternates`, `getClinic` vb.)
  yazıldı, MDX bileşenleri (`Callout`, `Figure`, `Steps`, `Step`) oluşturuldu,
  `scripts/validate-content.ts` 8 kontrollü doğrulama kapısı kuruldu (`npm run content:check`),
  `fs` importu `src/lib/content` dışına kapatıldı, örnek kayıtlar 4 dilde eklendi.

- `specs/SPEC-005-layout-shell.md` — layout kabuğu, navigasyon
  kaynağı, float aksiyonlar ve iki temizlik işi.

- **SPEC-005 uygulandı.** TopBar, sticky Header (açılır menüler +
  aktif route vurgusu), Radix tabanlı mobil menü, dört sütunlu
  Footer, float WhatsApp/Ara butonları, Breadcrumbs, PageBanner,
  CtaBand, SkipLink ve tek navigasyon kaynağı. Mesaj anahtarları
  dört dilde 64'e çıktı ve setler eşit.

- `specs/SPEC-006-homepage.md` — anasayfa bölümleri, `home` içerik
  tipi ve tekrar kullanılacak kart bileşenleri.

- `specs/SPEC-007-services.md` — hizmet listesi ve tek detay
  şablonu, `listing` içerik tipi, `cardTags` alanı.

- `specs/SPEC-008-blog.md` — blog listesi ve yazı şablonu;
  sayfalama/kategori kararı ve `?sayfa=` yönlendirme düzeltmesi.

- `specs/SPEC-009-corporate-team-gallery-faq.md` — kalan altı
  sayfa tipi; ekip monogramı, galeri lightbox, video facade,
  FAQPage sahipliği.

- **SPEC-009 uygulandı.** Kurumsal şablon (opsiyonel approach/
  timeline blokları), ekip listesi + detay (fotoğrafsız üyeler için
  monogram), resim galerisi + lightbox, video galerisi + YouTube
  facade, SSS (FAQPage sahibi), yasal şablon. Misyon/vizyon/kalite
  metinleri canlı siteden alındı; Melisa K. ve Esra B. eklendi.

- `specs/SPEC-010-forms-and-mail.md` — iki form, Server Action
  hattı, Nodemailer, oran sınırı, KVKK onayı, harita facade'ı.

- **SPEC-010 uygulandı.** Randevu ve iletişim formları, ortak zod
  şemaları, iki Server Action (doğrula → honeypot → süre → oran
  sınırı → mail), Nodemailer, Upstash oran sınırı, KVKK onayı (her
  iki formda), harita facade'ı, çerez bilgilendirme bandı.

- `specs/SPEC-011-content-population.md` — içerik doldurma planı,
  görsel hattı, çeviri sırası ve kapatma ölçütleri.

- **SPEC-011 kısmen uygulandı.** 9 yeni hizmet + 9 yeni blog
  (dört dilde, canlı siteden aktarılan metinlerle), 19 gerçek
  fotoğraf indirilip slug'lanarak WebP'ye çevrildi, 46 yer tutucu
  gerçek görselle değiştirildi, iç linkleme kuruldu,
  `PENDING_CONTENT` boşaltıldı, `seo:check` uyarısız geçiyor.

- **SPEC-012 (A) uygulandı.** Markalı 404 (dört dile giden
  bağlantılar + telefon), `error.tsx`, locale altı catch-all,
  5 güvenlik başlığı, Vercel Analytics + Speed Insights,
  `.env.example`. Lighthouse ölçüldü ve font optimizasyonu yapıldı.

- **Scroll reveal efektleri eklendi** (kullanıcı isteği). Kartlar ve
  bölümler görüş alanına girince yönlü olarak beliriyor. `Reveal`
  server component + tek `IntersectionObserver`; yalnızca `transform`
  ve `opacity` animasyonu. CLS 0 korundu, hero animasyona alınmadı.
  `ui-context.md` → Motion bu karara göre güncellendi.

## In Progress

- **SPEC-011 kalan kalemler** — klinik kararı bekliyor (aşağıda).

- SPEC-004 — yazıldı, uygulama bekliyor.

## Next Up

Ayrıntılı plan: `specs/ROADMAP.md`.

1. ~~**SPEC-001 — Proje kurulumu:** Next.js 16 + TypeScript strict +
   Tailwind v4 `@theme` + shadcn init, klasör iskeleti, fontlar,
   temel bileşenler.~~ _(Tamamlandı)_
2. ~~**SPEC-002 — i18n temeli:** next-intl kurulumu, dört locale,
   `routing.ts` + `proxy.ts`, RTL, dil değiştirici, kök redirect.~~
   _(Tamamlandı)_
3. ~~**SPEC-003 — İçerik katmanı:** varlık-önce `content/` şeması,
   zod frontmatter doğrulama, `lib/content` adaptörü, çeviri
   çözümleme, 8 kontrollü doğrulama kapısı.~~ _(Tamamlandı)_
4. **SPEC-004 — SEO katmanı:** `buildMetadata`, hreflang/canonical
   üreticisi, JSON-LD şemaları, `sitemap.ts`, `robots.ts`,
   31 girişlik `legacy-redirects.ts`, `seo:check`. _(spec yazıldı)_
5. **SPEC-005 — Layout kabuğu:** üst şerit, header, mobil menü,
   footer, float WhatsApp/Ara butonları, `Container`, breadcrumb.
6. **SPEC-006 — Anasayfa** (tüm bölümleriyle).
7. **SPEC-007 — Hizmet listesi + detay şablonu** (10 hizmet).
8. **SPEC-008 — Blog listesi + detay şablonu** (10 yazı).
9. **SPEC-009 — Kurumsal, ekip, galeri, SSS sayfaları.**
10. **SPEC-010 — Formlar:** randevu + iletişim, zod şemaları,
    Server Action, Nodemailer, Upstash rate limit, KVKK onayı.
11. **SPEC-011 — İçerik doldurma:** TR içerik aktarımı, ardından
    EN/AR/RU çevirileri.
12. **SPEC-012 — Yayın:** Vercel projesi, env değişkenleri, domain,
    301 doğrulaması, Search Console, Lighthouse denetimi.

## Ölçüm Sonuçları

**Lighthouse (mobil, production build, 2026-08-22):**

| Sayfa | Perf | Erişilebilirlik | En İyi Uygulama | SEO |
| --- | --- | --- | --- | --- |
| Anasayfa | 89 | 96 | 96 | 100 |
| Hizmet detayı | 91 | 96 | 96 | 100 |
| Blog detayı | 91 | 96 | 96 | 100 |
| Anasayfa (AR) | 89 | 96 | 96 | 100 |

CLS 0, TBT 10 ms, FCP 1.1 s. Kalan tek darboğaz LCP (~3.6–3.8 s).

**Font optimizasyonu:** Arapça fontu dört ağırlıkla ve önyüklemeyle
her dilde iniyordu (7 dosya / 289 KB). `preload: false` + iki ağırlık
ile 3 dosya / 150 KB'a düştü; Lighthouse 83 → 89, LCP 4.8s → 3.8s.

Kiril alt kümesini ayrı çağrıya bölmek **denendi ve geri alındı**:
tarayıcı iki aileyi birden indirdi, 89 → 84'e düştü. Ölçüm olmadan
"iyileştirme" yapılmamalı.

## Bilinen Teknik Borç

- **Eski sitede 27 gerçek fotoğraf var** (`trex/assets/img/`),
  1024×576–2193×567 boyutlarında; hero ve kart kullanımına yeterli.
  Dosya adları anlamsız sayılar — SPEC-011'de slug'lanacak.
  **Telif durumu hâlâ açık:** klinik doğrulayana kadar yalnızca
  kliniğin kendi sitesinde yayında olan görseller kullanılır.

- **Mail gönderimi canlı doğrulanmadı.** SMTP bilgileri yok; form
  şu an doğru biçimde `mail_failed` dönüyor ve kullanıcıya
  "telefonla ulaşın" diyor (sahte başarı YOK). Bilgiler gelince
  SPEC-012'de gerçek gönderim test edilmeli.
- **Upstash oran sınırı canlı doğrulanmadı.** Yapılandırılmamış
  olduğu için sınır atlanıyor (bilinçli davranış). SPEC-012'de
  Redis bağlanınca sınır testi yapılmalı.

- **`content/video/videos.json` içindeki örnek YouTube kimliği
  `dQw4w9WgXcQ`** — bu meşhur bir şaka videosu. SPEC-011'de gerçek
  video kimlikleriyle değiştirilmeli; yayına giderse itibar kaybı.
- **`privacy` ve `cookies` yasal sayfaları yok.** Footer artık
  yalnızca var olan yasal sayfaları listeliyor (404 üretmiyor), ama
  KVKK dışındaki iki metin SPEC-011'de yazılmalı ve **hukuk onayı**
  gerektirir.

- **Tüm görseller yer tutucu** ve üzerlerinde "PLACEHOLDER —
  SPEC-011" yazıyor; yanlışlıkla yayına çıkarsa fark edilsin diye
  bilinçli olarak işaretli. SPEC-011'de gerçekleriyle değişecek.

- **Kökteki `messages/` dizini hâlâ duruyor.** `src/messages/`'ın
  birebir okunmayan kopyası (`@/*` → `./src/*`); silme izni
  verilmediği için elde kaldı. Tek komutla temizlenir:
  `rm -r /Users/berat/anton/drmuratirmak/messages`
- ~~`/de` doğrudan 404 dönmüyor~~ → SPEC-005'te düzeltildi.
- `seo:check` 8 kontrolün 6'sını yapıyor; canlı HTTP gerektiren
  ikisi (sitemap URL'leri 200 mü, sayfa başına tek canonical)
  SPEC-012'ye bırakıldı.
- `PENDING_CONTENT` listesi (17 sayfa) SPEC-011'de boşalmalı;
  boşalmadan yayına çıkılırsa o 301'ler 404'e gider.

## Klinik Kararı Bekleyenler

- **HASTA FOTOĞRAFLARI YAYINLANMADI.** Eski sitedeki 24 galeri
  fotoğrafının çoğu tanınabilir hastaları gösteriyor: uygulama
  anındaki yüzler, göz/yüz öncesi-sonrası kareleri, hastalarla
  çekilmiş selfie'ler. Sağlık verisi KVKK'da **özel nitelikli
  kişisel veri**dir ve yayını açık rıza gerektirir; rızanın varlığı
  doğrulanamadı. Galeri şu an yalnızca stok uygulama görselleriyle
  dolu. Klinik yazılı rızaları belgelerse fotoğraflar eklenebilir.
- **Ekip fotoğrafları kullanılmadı.** `projeler/` klasöründeki iki
  portrenin Melisa K.'ye mi Esra B.'ye mi ait olduğu bilinmiyor;
  yanlış isme fotoğraf koymak gerçek bir zarar. Monogramlar
  duruyor (tasarımın kendi çözümü).
- **Video galerisi menüden ve sitemap'ten çıkarıldı.** İçerikteki
  tek video kimliği bilinen bir şaka videosuydu (kaldırıldı).
  Gerçek YouTube kimlikleri gelince `videos.json` doldurulup
  `navigation.ts` ve `sitemap.ts` içindeki iki yorum satırı
  geri açılır.
- **Ozon Tedavisi sayfası `noindex`.** Metin, kliniğin kendi
  anasayfa ifadelerinden nötr biçimde yazıldı; anasayfadaki güçlü
  fayda iddiaları (beyin fonksiyonu, depresyon vb.) **bilinçli
  olarak alınmadı**. Hekim onayı gelince `noindex` kaldırılır.
- **Yasal metinler (`privacy`, `cookies`) yazılmadı.** Hukuki metin
  uydurulmaz; klinikten mevcut metin ya da hukuk onaylı taslak
  gerekir. Footer şu an yalnızca KVKK'yı gösteriyor.

- **Bülten formu:** SPEC-005'te footer'a görsel olarak eklendi ve
  `disabled` bırakıldı. SPEC-010 onu etkinleştirmiyor — çalışan bir
  bülten abone listesi saklamayı, çift onayı ve abonelikten çıkma
  bağlantısını gerektirir; bu da "veri saklamıyoruz" mimari
  kararıyla çelişir. Ya tam kurulmalı ya footer'dan kaldırılmalı.

## İçerik Onayı Bekleyenler

- Ozon Tedavisi hizmet metni — **hekim onayı** gerekir.
- Anasayfa `whyUs` ve `process` metinleri (klinik süreci
  anlatıyor) — **klinik onayı önerilir**.
- Anasayfada öne çıkacak 6 hizmetin seçimi bir içerik kararıdır
  (`order` alanı); klinikle netleştirilecek.

## Open Questions

1. **PRP** ve **H100 Gençlik Aşısı** ayrı hizmet sayfası olacak mı,
   yoksa mevcut hizmet metinlerinin içinde mi kalacak?
2. ~~Ekip üyelerinin fotoğrafı mevcut mu?~~ → **Çözüldü:**
   tasarım fotoğrafsız üyeler için baş harf monogramı kullanıyor
   (`MK`, `EB`). Fotoğraf sonradan gelirse yalnızca frontmatter'a
   eklenir. Tam ad ve unvan bilgisi hâlâ gerekli.
3. Google Business Profile, Search Console ve Analytics erişimleri
   kimde?
4. SMTP bilgileri (host, port, kullanıcı, şifre) — beklemede. Mail
   katmanı env ile soyutlanarak yazılacak, bilgi gelince yalnızca
   `.env` doldurulacak.
5. Mevcut görsellerin telif durumu — kliniğe mi ait, stok mu?
6. Klinik çalışma saatleri (JSON-LD `openingHours` için gerekli).
7. Ozon Tedavisi sayfası için hekim onaylı metin.

## Architecture Decisions

- **İçerik dosya tabanlı (MDX + JSON), `lib/content` adaptörü
  arkasında.** Sunucu ve admin paneli bugün yok; adaptör sayesinde
  ileride CMS'e geçiş sayfa kodunu değiştirmeden yapılabilir.
- **Tüm diller URL prefix'li, `tr` varsayılan.** hreflang ve
  x-default kurgusunun en az kırılgan hali; next-intl ile en temiz
  çalışan yapı.
- **Arapça slug'lar ana dilde, Rusça slug'lar Latin
  transliterasyonla.** Arapça'da URL–anahtar kelime eşleşmesi
  percent-encoding çirkinliğine tercih edildi (kullanıcı kararı);
  Rusça'da yaygın pratik Latin slug.
- **Blog yazıları orijinal 2022 tarihleriyle.** `datePublished`
  değiştirilmez; tarih manipülasyonu güven ve E-E-A-T riski.
- **Server Action, API route değil.** Tek yazma yolu var; ayrı
  route handler katmanı gereksiz yüzey açardı.
- **Veritabanı yok, form verisi saklanmıyor.** Hasta verisi
  tutulmadığı için KVKK yükümlülüğü minimumda kalıyor.
- **Upstash Redis yalnızca oran sınırı için.** Sunucusuz ortamda
  bellek içi sayaç instance başına çalıştığı için güvenilmez;
  Redis erişilemezse form **engellenmez**, sınır atlanır.
- **Nodemailer + mevcut SMTP.** Kullanıcı kararı; ek servis
  bağımlılığı ve domain doğrulama adımı istenmedi.
- **Karanlık mod yok.** Tasarım seti tek temalı.
- **Statik üretim, ISR yok.** İçerik repoda olduğu için içerik
  değişimi zaten yeni deploy demek.
- **Next.js 16.3 + React 19.2.** Kurulum sırasında güncel stabil
  sürüm buydu; sürümler caret olmadan sabitlenir, yükseltme ayrı
  bir iş birimidir. Next 16 farkları: Turbopack varsayılan,
  `next lint` kaldırıldı, `middleware.ts` → `proxy.ts` (nodejs
  runtime, edge yok), senkron `params`/`cookies()` kaldırıldı,
  ESLint flat config, `images.qualities` varsayılanı `[75]`.
  Kod yazarken `node_modules/next/dist/docs/` kaynak alınır;
  eğitim verisindeki Next 15 kalıpları uygulanmaz.
- **İçerik varlık-önce konumlanır: `content/{tip}/{id}/{locale}.mdx`.**
  Dil-önce düzende dört dilin birbirine bağı frontmatter'a elle
  yazılan bir `id` alanına kalıyor ve yazım hatasıyla sessizce
  kırılıyordu. Klasör adı kimlik olunca bağ yapısal hale geliyor,
  eksik çeviri dosya sayısıyla tespit ediliyor ve hreflang üretimi
  güvenilir oluyor. İlişkiler slug ile değil id ile kurulur.
- **Dile göre statik slug'lar next-intl `pathnames` ile.** Ayrı bir
  slug haritası yazmak yerine kütüphanenin kendi mekanizması
  kullanılır; içerik slug'ları (blog/hizmet) ayrıca frontmatter'dan
  çözülür.

## Session Notes

- Proje kökü: `/Users/berat/anton/drmuratirmak/`. Context dosyaları
  `context/`, spec'ler `specs/` altında. Next.js uygulaması aynı
  kökte kurulacak.
- Tasarım PDF'leri metin katmanı içermiyor — hepsi tam sayfa görsel
  export (1440px genişlik). İnceleme görsel olarak yapılmalı;
  `pdftotext` işe yaramaz, `pdfimages -png` ile açılabilir.
- Doğrulanmış klinik bilgileri `project-overview.md` içindeki
  **Reference Data** bölümünde.
- Renk token'ları tasarımdan örneklendi: vurgu `#3372E6`, koyu
  `#141615`, gri yüzey `#F6F7F9`, mavi yüzey `#F1F5FE`, kenarlık
  `#E3E6EB`, ikincil metin `#5D6162`.
- Eski URL'lerin **tam listesi** `specs/SPEC-004-seo-layer.md`
  içindeki tabloda; canlı siteden `/hizmetler`, `/blog` ve
  `/blog?sayfa=2` çekilerek doğrulandı. 31 giriş: 10 kurumsal/
  sistem, 10 hizmet (liste dahil), 11 blog (liste dahil), artı
  `?sayfa=` parametresi ve `konu-kategori-*`.
- Eski site tek dilli olduğu için tüm yönlendirmeler `/tr` altına
  gider; EN/AR/RU sıfırdan indekslenecek.
- Eski adresteki `hacamat-kupa-tedavisi-istabul` yazım hatası yeni
  slug'da düzeltiliyor (`...-istanbul`), yönlendirme kurulu.
