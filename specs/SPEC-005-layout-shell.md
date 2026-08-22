# SPEC-005 — Layout kabuğu

**Faz:** 1 — Temel (son parça)
**Bağımlılık:** SPEC-004
**Sonraki:** SPEC-006 (Anasayfa)

## Goal

Her sayfada görünen çerçeveyi kurmak: üst şerit, sticky header,
mobil menü, footer, sabit WhatsApp/Ara butonları, breadcrumb ve
iç sayfa banner'ı.

Bu spec bittiğinde tasarımdaki kabuk dört dilde ve RTL'de doğru
çalışıyor, tüm iletişim bilgileri tek kaynaktan (`clinic.json`)
geliyor ve sonraki sayfa spec'leri yalnızca içerik bölgesini
doldurmakla ilgileniyor olmalı.

## Context

- `context/ui-context.md` → Layout Patterns, Buttons, Colors,
  Border Radius, RTL, Motion.
- `context/code-standards.md` → i18n (mantıksal özellikler),
  Erişilebilirlik, Next.js.
- `context/architecture.md` → `components/shared/` sınırı.
- Tasarım referansı: `01_Anasayfa.pdf` (header + footer) ve
  `14_Hizmet_Botoks_Dolgu.pdf` (iç sayfa banner'ı, breadcrumb,
  CTA bandı, footer alt şeridi).

## Scope

- `TopBar`, `Header`, `MobileMenu`, `Footer`, `FloatingActions`.
- `Breadcrumbs`, `PageBanner`, `CtaBand`.
- Tek navigasyon kaynağı: `lib/navigation.ts`.
- `messages` anahtarlarının dört dilde tamamlanması.
- `[locale]/layout.tsx`'in kabuğu sarması.
- Kabuğu gösteren doğrulama: mevcut geçici sayfalar kabuk içinde
  render olur.
- İki temizlik işi (aşağıda).

## Out of Scope

- Anasayfa bölümleri (hero, hizmet grid'i, süreç) — SPEC-006.
- Bülten formunun **çalışması** — SPEC-010. Bu spec'te yalnızca
  görsel yapısı kurulur ve gönderim düğmesi `disabled` bırakılır;
  hiçbir şey yapmayan sahte bir form yayınlanmaz.
- Gerçek logo ve fotoğraflar — SPEC-011. Yer tutucu kullanılır ama
  `alt` metinleri şimdiden dört dilde yazılır.

## Temizlik işleri (bu spec kapsamında)

### 1. Çift `messages` dizini

`src/i18n/request.ts` mesajları `@/messages/{locale}.json` ile
okuyor; `@/*` → `./src/*` olduğu için gerçek kaynak
**`src/messages/`**. Kökteki `messages/` dizini birebir kopya ve
**hiç okunmuyor** — er geç ayrışıp "çeviriyi değiştirdim ama
değişmedi" hatasına yol açar.

Yapılacak: kökteki `messages/` silinir, `architecture.md` → System
Boundaries `src/messages/` olarak düzeltilir.

### 2. Geçersiz locale 404 dönmüyor

`/de` şu an `/tr/de`'ye yönlenip orada 404 veriyor. SPEC-002'nin
kabul kriteri doğrudan 404 diyordu.

Yapılacak: `proxy.ts` içinde, ilk yol parçası iki harfli ama
desteklenen bir locale değilse (`/de`, `/fr`, `/es`) yönlendirme
yapılmaz; istek olduğu gibi geçirilir ve `not-found` yakalar.
Bu, olmayan diller için yanlış yönlendirme sinyali üretmeyi
engeller.

## Implementation

### 1. Navigasyon kaynağı

`src/lib/navigation.ts` — menü yapısı tek yerde tanımlanır;
Header, MobileMenu ve Footer aynı diziyi okur.

```ts
export const mainNav = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'services', href: '/services' },
  {
    key: 'corporate',
    children: [
      { key: 'mission', href: '/mission' },
      { key: 'vision', href: '/vision' },
      { key: 'quality', href: '/quality' },
      { key: 'team', href: '/team' },
    ],
  },
  { key: 'media', children: [
      { key: 'gallery', href: '/gallery' },
      { key: 'video', href: '/video' },
  ]},
  { key: 'blog', href: '/blog' },
  { key: 'contact', href: '/contact' },
] as const;
```

`key` bir `messages` anahtarıdır, etiketin kendisi değil. `href`
next-intl'in tipli route'udur; `Link` bunu locale'e göre çözer.

Footer sütunları (`footerNav`) ayrı tanımlanır — tasarımda
"Kurumsal", "Hızlı Linkler" ve "İletişim" sütunları header
menüsüyle birebir aynı değil.

### 2. `TopBar`

- Server Component. Zemin `bg-inverse`, yükseklik ~36px.
- Başlangıç kenarında klinik sloganı, bitiş kenarında telefon ve
  e-posta (`clinic.json`'dan; kodda sabit numara yok).
- `md` altında `hidden`.
- Telefon `<bdi>` ile sarılır, `tel:` linki `clinic.contact.phone`
  (E.164) kullanır, görünen metin `phoneFormatted`.

### 3. `Header`

- Server Component; içindeki mobil menü ve dil değiştirici ayrı
  client bileşenleridir (`code-standards.md` → en yaprak bileşen).
- `sticky top-0 z-50`, beyaz zemin, altında `border-default` çizgi.
- Sol: logo + "Dr. Murat Irmak" kelime markası (`Link href="/"`).
- Orta/sağ: `mainNav`; alt menülü öğeler Radix `dropdown-menu`.
- Sağ uç: `LanguageSwitcher` + dolu mavi "Randevu Al" butonu.
- `lg` altında menü gizlenir, hamburger görünür.
- Aktif route vurgulanır: `usePathname` ile karşılaştırma yapan
  küçük bir client bileşeni; aktif öğe `aria-current="page"`.
- Sayfanın en başına **atlama bağlantısı** (`skip link`) konur:
  odaklanınca görünür, `#main-content`'e gider.

### 4. `MobileMenu`

- Client bileşeni; Radix `sheet` (veya `dialog`) üzerine.
- Tam ekran, başlangıç kenarından açılır (RTL'de otomatik ayna).
- Odak tuzağı, `Esc` ile kapanma, açıkken `body` kaydırması kilitli.
- İçinde: `mainNav`, dil değiştirici, "Randevu Al", telefon ve
  WhatsApp bağlantıları.
- Tetikleyici butonda `aria-label` (`a11y.menu`) ve
  `aria-expanded`.

### 5. `Footer`

- Zemin `bg-inverse`, metin `text-inverse`.
- Dört sütun (`lg`), iki sütun (`md`), tek sütun (mobil):
  1. Marka: logo, kısa tanıtım (`clinic.description`), bülten
     alanı.
  2. Kurumsal: Hakkımızda, Misyonumuz, Vizyonumuz, Kalite
     Politikamız, Ekibimiz.
  3. Hızlı Linkler: Hizmetlerimiz, Resim Galerisi, Video Galerisi,
     Blog, SSS.
  4. İletişim: telefon, e-posta, adres (`clinic.json`).
- Alt şerit: `border-inverse` ayırıcı, başlangıçta telif
  (`© {yıl} Dr. Murat Irmak`), bitişte KVKK / Gizlilik / Çerezler
  bağlantıları (`/legal/[slug]`).
- Telif yılı `new Date().getFullYear()` ile üretilir; statik
  sayfalarda build yılına sabitlenir — bu kabul edilebilir, yılda
  bir deploy zaten oluyor.
- Bülten alanı: etiketli input + `disabled` buton. Butonun
  `title`/`aria-description`'ı "yakında" bilgisini verir.
  SPEC-010'da etkinleştirilir.

### 6. `FloatingActions`

- Client bileşeni (kaydırma durumuna göre görünürlük).
- Sabit, bitiş kenarında alt köşe (`fixed bottom-6 end-6`) — RTL'de
  otomatik sol alt.
- İki yuvarlak buton, dikey: WhatsApp (yeşil marka rengi — tek
  renk istisnası, `ui-context.md`'de belgeli) ve Ara (mavi).
- WhatsApp linki: `https://wa.me/{numara}?text={dile göre mesaj}`.
  Mesaj `messages` içinden gelir, dört dilde yazılır.
- Her ikisinde `aria-label` zorunlu (`a11y.whatsapp`, `a11y.phone`).
- Mobilde alt güvenli alanın üstünde durur
  (`pb-[env(safe-area-inset-bottom)]`).
- `print:hidden`.
- `prefers-reduced-motion` altında giriş animasyonu yok.

### 7. `Breadcrumbs`

- Server Component; `{ name, href }[]` alır.
- Görsel breadcrumb ile SPEC-004'ün `breadcrumbSchema`'sı **aynı
  diziden** üretilir — ekranda görünen ile JSON-LD'de yazan
  ayrışamaz.
- Ayırıcı `/`, RTL'de yön otomatik.
- Son öğe bağlantı değildir, `aria-current="page"` taşır.
- `<nav aria-label>` ile sarılır.

### 8. `PageBanner`

- İç sayfaların üst bloğu: container içinde `rounded-xl` fotoğraf,
  `--overlay-image` koyu katman, ortada breadcrumb + `h1`.
- Görsel `next/image` + `fill` + `priority` (sayfanın LCP'si).
- `alt` zorunlu; dekoratif değildir çünkü sayfanın konusunu
  gösterir.
- Yükseklik: mobilde ~220px, `md`'den itibaren ~300px — anasayfa
  hero'sundan belirgin kısa.

### 9. `CtaBand`

- Koyu overlay'li fotoğraf, ortada eyebrow + başlık + açıklama +
  dolu mavi buton, `rounded-xl`.
- Başlık ve açıklama prop; varsayılan metin `messages`'tan.
- Hizmet ve blog sayfalarının sonunda tekrar kullanılır.

### 10. Layout birleştirme

`app/[locale]/layout.tsx`:

```tsx
<body>
  <JsonLd data={clinicSchema(locale)} />
  <NextIntlClientProvider>
    <SkipLink />
    <TopBar />
    <Header />
    <main id="main-content">{children}</main>
    <Footer />
    <FloatingActions />
  </NextIntlClientProvider>
</body>
```

Sayfa dosyaları kendi `<main>`'ini açmaz; yalnızca içerik döner.
Mevcut geçici sayfalardaki `<main>` sarmalayıcıları kaldırılır.

### 11. `messages` genişletmesi

Eklenecek anahtar grupları (dört dilde birden):

```
nav.corporate, nav.media, nav.mission, nav.vision, nav.quality, nav.video
header.appointmentCta, header.skipToContent
footer.aboutTitle, footer.corporate, footer.quickLinks, footer.contact,
footer.newsletterTitle, footer.newsletterPlaceholder,
footer.newsletterSoon, footer.copyright, footer.rights
legal.kvkk, legal.privacy, legal.cookies
cta.eyebrow, cta.title, cta.description, cta.button
whatsapp.message
a11y.breadcrumb, a11y.footerNav, a11y.skipLink
```

Arapça ve Rusça karşılıklar tahmin edilerek değil, anlamı
korunarak yazılır; belirsiz kalan terim
`progress-tracker.md`'ye gözden geçirme notu olarak düşülür.

## Acceptance

1. Dört dilde de kabuk render oluyor; Arapça'da header, footer,
   breadcrumb ve float butonlar aynalanmış durumda.
2. Telefon, WhatsApp, e-posta ve adres **yalnızca**
   `clinic.json`'dan geliyor; `grep -rE "0542|drmuratirmak\.com"
   src/components` sonuç döndürmüyor.
3. Float butonlar her breakpoint'te görünür ve tıklanabilir;
   ikisinde de `aria-label` var; `tel:` ve `wa.me` doğru numaraya
   gidiyor.
4. Mobil menü klavye ile açılıp kapanıyor, `Esc` kapatıyor, odak
   menü içinde kalıyor, kapanınca tetikleyiciye dönüyor.
5. Skip link `Tab` ile odaklanınca görünüyor ve `#main-content`'e
   atlıyor.
6. Breadcrumb'ın ekrandaki hâli ile JSON-LD'si birebir aynı
   diziden üretiliyor.
7. Aktif menü öğesi `aria-current="page"` taşıyor.
8. Kökteki `messages/` dizini silinmiş; `architecture.md`
   `src/messages/` diyor.
9. `/de` doğrudan 404 dönüyor — `/tr/de`'ye yönlenmiyor.
10. Dört `messages` dosyası aynı anahtar setine sahip.
11. `npm run check` temiz geçiyor.
12. Mobil ve masaüstünde tasarım PDF'leriyle görsel karşılaştırma
    yapıldı; header yüksekliği, footer sütun düzeni ve renk
    token'ları eşleşiyor.

## Notes

- **Bu spec'in değeri tekrar kullanımda.** Kabuk doğru kurulursa
  SPEC-006 → SPEC-010 yalnızca içerik bölgesiyle ilgilenir. Kabuk
  yanlış kurulursa altı sayfa spec'inde tekrar tekrar düzeltilir.
- Header sticky olduğu için `scroll-margin-top` iç bağlantılarda
  ayarlanmalı; yoksa `#` hedefleri header'ın altında kalır.
- Float butonlar ile mobil menü aynı anda açık olduğunda z-index
  çakışması olmamalı: menü `z-50` üstü, float `z-40`.
- WhatsApp yeşili (`#25D366`) `ui-context.md`'deki "tek vurgu
  rengi" kuralının bilinçli tek istisnasıdır; token olarak
  `--color-brand-whatsapp` adıyla tanımlanır ki başka yerde
  kullanılamasın.
- Bülten formu SPEC-010'a kadar `disabled`. Çalışmayan bir forma
  e-posta girdiren bir site, güven kaybının en ucuz yoludur.
