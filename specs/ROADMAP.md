# Implementation Roadmap

Dr. Murat Irmak Klinik sitesi — 12 spec'lik uygulama planı.

Her spec tek bir iş birimidir ve kendi başına doğrulanabilir.
Bir spec bitmeden sonraki başlamaz. Bitiş tanımı her spec'in
**Acceptance** bölümünde; ek olarak `ai-workflow-rules.md`
içindeki "Before Moving to the Next Unit" listesi her spec için
geçerlidir.

## Bağımlılık zinciri

```
SPEC-001 Kurulum
   └─ SPEC-002 i18n temeli
        ├─ SPEC-003 İçerik katmanı
        │    └─ SPEC-004 SEO katmanı
        │         └─ SPEC-005 Layout kabuğu
        │              ├─ SPEC-006 Anasayfa
        │              ├─ SPEC-007 Hizmetler
        │              ├─ SPEC-008 Blog
        │              ├─ SPEC-009 Kurumsal / ekip / galeri / SSS
        │              └─ SPEC-010 Formlar
        │                   └─ SPEC-011 İçerik doldurma (4 dil)
        │                        └─ SPEC-012 Yayın ve denetim
```

SPEC-006 → SPEC-010 arası, SPEC-005 bittikten sonra teorik olarak
paralel yürütülebilir; ama tek kişilik akışta yukarıdaki sırayla
gidilir — her sayfa tipi bir öncekinin bileşenlerini yeniden
kullanır.

---

## Faz 1 — Temel (SPEC-001 → SPEC-005)

Kod yazılır ama henüz gerçek içerik yoktur. Bu fazın sonunda site
ayakta, dört dilde geziliyor, SEO çıktıları üretiyor ama sayfalar
yer tutucu içerikle dolu.

### SPEC-001 — Proje kurulumu ve tasarım token'ları

**Amaç:** Next.js 16 projesini ayağa kaldırmak, `ui-context.md`
token'larını CSS'e dökmek, klasör iskeletini kurmak.
**Kapsam:** `create-next-app`, TypeScript strict, Tailwind v4
`@theme`, shadcn init, fontlar (Inter + IBM Plex Sans Arabic),
`cn()`, `Container`, `Button`, klasör iskeleti, `next.config.ts`
temel ayarları, lint/format.
**Çıktı:** `npm run dev` ile açılan, token'ları uygulanmış bir
demo sayfa.
**Kapsam dışı:** i18n, içerik, gerçek sayfalar.

### SPEC-002 — i18n temeli

**Amaç:** Dört dilin routing, çeviri ve RTL altyapısı.
**Kapsam:** `next-intl` kurulumu, `routing.ts` (`localePrefix:
'always'`, `pathnames` ile dile göre statik yollar), `proxy.ts`
(Next 16'da `middleware.ts` değil), `app/[locale]/layout.tsx`
(`lang` + `dir` + font seçimi), `messages/{tr,en,ar,ru}.json`
iskeleti, `LanguageSwitcher`, kök `/` → `/tr` yönlendirmesi,
`localizedHref` sarmalayıcısı.
**Doğrulama:** Dört dilde de bir demo sayfa açılıyor, Arapça'da
`dir="rtl"` ve Arapça font uygulanıyor, dil değiştirici aynı
sayfanın karşılığına gidiyor.

### SPEC-003 — İçerik katmanı

**Amaç:** `content/` şeması ve `lib/content` adaptörü.
**Kapsam:** Varlık-önce klasör şeması (klasör adı = id), zod
frontmatter şemaları, MDX derleme (`next-mdx-remote/rsc` +
`gray-matter`), `lib/content` API'si, `getAlternates` ile çeviri
çözümleme, `content/clinic.json`, MDX bileşenleri (`Callout`,
`Figure`, `Steps`, `ServiceLink`), ve 8 kontrollü doğrulama
kapısı (`npm run content:check`).
**Doğrulama:** Örnek bir hizmet MDX'i dört dilde okunuyor;
eksik frontmatter veya çakışan anahtar kelime build'i düşürüyor.

### SPEC-004 — SEO katmanı

**Amaç:** Tüm SEO çıktısının tek kaynaktan üretilmesi.
**Kapsam:** `buildMetadata()`, `buildAlternates()` (hreflang +
x-default), `JsonLd` bileşeni ve şema üreticileri
(`MedicalClinic`, `MedicalProcedure`, `BlogPosting`, `FAQPage`,
`BreadcrumbList`, `ImageObject`), `sitemap.ts`, `robots.ts`,
`legacy-redirects.ts` + `next.config.ts` `redirects()`.
**Doğrulama:** Bir sayfanın HTML'inde dört dilli hreflang seti,
canonical ve geçerli JSON-LD var; `/sitemap.xml` dört dili
listeliyor; canlı siteden çıkarılan 31 eski URL'in her biri tek
adımda yeni adresine gidiyor; `npm run seo:check` temiz.

### SPEC-005 — Layout kabuğu

**Amaç:** Her sayfada görünen çerçeve.
**Kapsam:** `TopBar`, `Header` (sticky, desktop menü + mobil
sheet), `Footer` (4 sütun + bülten + yasal linkler),
`FloatingActions` (WhatsApp + Ara), `Breadcrumbs`, `PageBanner`,
`CtaBand`, tek navigasyon kaynağı (`lib/navigation.ts`), skip
link. Ayrıca iki temizlik: ölü `messages/` kopyasının silinmesi
ve geçersiz locale'in doğrudan 404 dönmesi.
**Doğrulama:** Dört dilde ve RTL'de kabuk doğru; float butonlar
her breakpoint'te erişilebilir ve `aria-label` taşıyor.

---

## Faz 2 — Sayfalar (SPEC-006 → SPEC-010)

Tasarımdaki her sayfa tipi gerçek bileşenlerle inşa edilir.

### SPEC-006 — Anasayfa

Hero, hakkımızda özeti, hizmet grid'i (6 kart), "neden biz",
4 adımlı süreç, SSS akordeonu, CTA bandı, son 4 blog yazısı.
Yeni `home` içerik tipi (yapılandırılmış JSON, dört dilde) ve
tekrar kullanılacak kart bileşenleri (`ServiceCard`, `PostCard`,
`FeatureCard`, `StepCard`).
**Doğrulama:** Tasarım PDF'i ile yan yana karşılaştırma; tek `h1`;
tek `priority` görsel; mobil Lighthouse ≥ 90.

### SPEC-007 — Hizmet listesi ve detay şablonu

Liste sayfası (banner, giriş, grid, "yaklaşım" bölümü, CTA),
tek detay şablonu (banner, MDX gövde, özellik kartları, tıbbi
uyarı kutusu, sticky sidebar, ilgili bloglar). Yeni `listing`
içerik tipi ve `cardTags` frontmatter alanı.
**Doğrulama:** Hizmetler dört dilde route üretiyor; dil
değiştirici aynı hizmetin karşılığına gidiyor; olmayan slug 404;
`MedicalProcedure` uydurma alan içermiyor.

### SPEC-008 — Blog listesi ve detay şablonu

Liste (2 sütunlu kart grid'i), tek yazı şablonu (banner, tarihli
meta satırı, MDX gövde, tıbbi uyarı, ilgili hizmetler, sticky
sidebar), `BlogPosting` şeması, orijinal 2022 tarihleri.
**Sayfalama ve kategori filtresi yok** — tasarımda bulunmuyor ve
10 yazı için değer katmıyor; eşik 24 yazı olarak yazıldı.
**Doğrulama:** Yazılar dört dilde açılıyor; `datePublished` 2022;
başlık ekranda iki kez tekrarlanmıyor; `/blog?sayfa=2` →
`/tr/blog` 200 dönüyor.

### SPEC-009 — Kurumsal, ekip, galeri ve SSS sayfaları

Hakkımızda, Misyonumuz, Vizyonumuz, Kalite Politikamız, Ekibimiz

- üye detayları, Resim Galerisi (lightbox), Video Galerisi
  (facade), SSS (`FAQPage`), yasal sayfalar (KVKK, Gizlilik, Çerez).
  **Doğrulama:** Galeri lightbox klavye ile gezilebiliyor; video
  gömme tıklanmadan üçüncü parti script yüklemiyor.

### SPEC-010 — Formlar ve mail

Randevu ve iletişim formları, `lib/schemas`, Server Action
(doğrula → honeypot/süre → oran sınırı → mail), Nodemailer
transport, iki mail şablonu (klinik + kullanıcı onayı), KVKK
onay kutusu, başarı/hata durumları, çerez onay bandı.
**Doğrulama:** Geçerli form mail gönderiyor; geçersiz form sunucuda
reddediliyor; oran sınırı aşımı `rate_limit` dönüyor; Redis kapalıyken
form yine çalışıyor.

---

## Faz 3 — İçerik ve yayın (SPEC-011 → SPEC-012)

### SPEC-011 — İçerik doldurma (4 dil)

Kod yazmaz; yalnızca `content/` ve `public/images/` doldurulur.
Sıra: görsel hattı → TR aktarım → SSS/galeri → yasal → çeviri →
iç linkleme. Eksik: 9 hizmet, 9 blog, 2 yasal metin, 5 SSS,
6 galeri görseli, 3 video, 52 gerçek görsel.
**Doğrulama:** `PENDING_CONTENT` boş; `seo:check` uyarısız;
hiçbir görselde "PLACEHOLDER" damgası yok; `dQw4w9WgXcQ` yok;
blog tarihleri orijinal.

### SPEC-012 — Yayın ve denetim

Vercel projesi, env değişkenleri, domain bağlama, 301 haritasının
canlıda doğrulanması, Search Console + sitemap gönderimi,
Analytics/Speed Insights, Lighthouse ve Rich Results denetimi,
404/500 sayfaları, güvenlik başlıkları.
**Doğrulama:** `project-overview.md` içindeki 11 başarı ölçütünün
tamamı karşılanıyor.

---

## Spec dosya adlandırması

`specs/SPEC-{NNN}-{kebab-slug}.md`

Her spec şu bölümleri taşır: **Goal**, **Context**, **Scope**,
**Out of Scope**, **Implementation**, **Acceptance**, **Notes**.

## Durum

| Spec | Başlık                               | Durum    |
| ---- | ------------------------------------ | -------- |
| 001  | Proje kurulumu ve tasarım token'ları | Uygulandı  |
| 002  | i18n temeli                          | Uygulandı  |
| 003  | İçerik katmanı                       | Uygulandı |
| 004  | SEO katmanı                          | Uygulandı |
| 005  | Layout kabuğu                        | Uygulandı |
| 006  | Anasayfa                             | Uygulandı |
| 007  | Hizmetler                            | Uygulandı |
| 008  | Blog                                 | Uygulandı |
| 009  | Kurumsal / ekip / galeri / SSS       | Uygulandı |
| 010  | Formlar ve mail                      | Uygulandı |
| 011  | İçerik doldurma (4 dil)              | Kısmen uygulandı |
| 012  | Yayın ve denetim                     | A uygulandı, B bekliyor |
