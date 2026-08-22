# SPEC-009 — Kurumsal, ekip, galeri, SSS ve yasal sayfalar

**Faz:** 2 — Sayfalar (son parça)
**Bağımlılık:** SPEC-008
**Sonraki:** SPEC-010 (Formlar ve mail)

## Goal

Kalan tüm içerik sayfalarını inşa etmek: dört kurumsal sayfa,
ekip listesi ve üye detayları, resim ve video galerileri, SSS ve
üç yasal sayfa.

Bu spec bittiğinde `/appointment` ve `/contact` dışındaki her
sayfa dört dilde çalışıyor olmalı — yani site, formlar hariç
gezilebilir durumda.

## Context

- Tasarımlar: `02_Hakkimizda.pdf` (kurumsal şablon),
  `05_Ekibimiz.pdf` (ekip listesi), `07_Resim_Galerisi.pdf`,
  `11_Sik_Sorulan_Sorular.pdf`. Bunlar incelendi.
- **İncelenmedi:** `09_Video_Galerisi.pdf`, `33_Ekip_Melisa_K.pdf`,
  `34_Ekip_Esra_B.pdf`, `04_Misyonumuz.pdf`, `06_Vizyonumuz.pdf`,
  `08_Kalite_Politikamiz.pdf`. Uygulama sırasında bunlar açılıp
  şablonların karşıladığı doğrulanacak; karşılamıyorsa spec
  güncellenecek.
- SPEC-005/006/007'nin bileşenleri: `PageBanner`, `FeatureCard`,
  `CtaBand`, `MedicalDisclaimer`, `listing` tipi.

## Scope

- `listing` anahtarları: `team`, `gallery`, `video`, `faq`.
- Kurumsal şablon (4 sayfa) + opsiyonel yapılandırılmış bloklar.
- Ekip listesi + üye detay şablonu.
- Resim galerisi + lightbox.
- Video galerisi + YouTube facade.
- SSS sayfası — **`FAQPage` şemasının sahibi**.
- Yasal şablon (KVKK, gizlilik, çerez).
- Yeni bileşenler: `TeamCard`, `Timeline`, `GalleryGrid`,
  `Lightbox`, `VideoGrid`, `VideoFacade`, `FaqList`.

## Out of Scope

- İçeriğin yazılması — SPEC-011.
- Randevu ve iletişim sayfaları — SPEC-010.
- Çerez onay bandı — SPEC-010 (çerez **politikası sayfası** burada,
  onay bandı formlarla birlikte).

## Implementation

### 1. Kurumsal şablon — `/[locale]/[about|mission|vision|quality]`

Tasarım 02'de üç blok var ve hepsi her kurumsal sayfada
bulunmuyor. Bu yüzden `pageFrontmatter` **opsiyonel** alanlarla
genişletilir; blok yalnızca alan doluysa render edilir:

```yaml
sidebarImage:      # opsiyonel — sağdaki portre/görsel
sidebarImageAlt:
approach:          # opsiyonel — 3 özellik kartı
  eyebrow:
  title:
  items: [{ icon, title, description }]   # tam 3
timeline:          # opsiyonel — "Eğitimden klinik pratiğe"
  eyebrow:
  title:
  rows: [{ label, description }]
```

Düzen:

1. `PageBanner` — breadcrumb + `h1` = sayfa başlığı.
2. **İki sütun** — solda eyebrow + `h2` + MDX gövdesi + "Randevu
   Al" butonu; sağda `sidebarImage` (varsa). Görsel yoksa metin
   tam genişlik.
3. `approach` varsa: `--bg-surface` zeminli bölüm, ortalanmış
   eyebrow + `h2`, altında 3 `FeatureCard`.
4. `timeline` varsa: eyebrow + `h2`, altında satırlar. Her satır
   başlangıç kenarında `--accent-primary` renkli etiket (`1984`,
   `2001–07`, `GETAT`), yanında açıklama; satırlar
   `--border-default` çizgiyle ayrılır. Semantik olarak `<dl>` /
   `<dt>` / `<dd>` kullanılır — bu bir tanım listesidir, tablo
   değil.
5. `CtaBand`.

Aynı şablon `legal/[slug]` için de kullanılır; yasal sayfalarda
opsiyonel blokların hiçbiri dolu olmaz, yalnızca MDX gövdesi
render edilir.

**Tıbbi uyarı kutusu kurumsal ve yasal sayfalarda
gösterilmez** — orada tedavi anlatılmıyor.

### 2. Ekip listesi — `/[locale]/ekibimiz`

1. `PageBanner`.
2. Ortalanmış giriş (eyebrow `EKİP` + `h2` + açıklama).
3. **3 sütunlu kart grid'i** — `TeamCard`.
4. `--bg-surface` zeminli 3 `FeatureCard` bölümü
   (`listing/team` içindeki `approach`).
5. `CtaBand`.

**`TeamCard` ve fotoğrafsız üyeler:** Tasarımda Melisa K. ve
Esra B. için fotoğraf yok; yerine `--accent-soft` zeminli, iri
harflerle **baş harf monogramı** (`MK`, `EB`) kullanılıyor.

Bu tasarlanmış bir çözüm, eksiklik değil — ve
`progress-tracker.md`'deki "ekip fotoğrafları var mı?" açık
sorusunu kapatıyor: fotoğraf gelene kadar monogram kullanılır,
sayfa eksik görünmez.

Bu yüzden `teamFrontmatter`'da `photo` ve `photoAlt`
**opsiyonel** hale gelir. Monogram `name` alanından üretilir
(ilk iki kelimenin baş harfleri), `aria-hidden` taşır ve kartın
erişilebilir adı `name`'den gelir.

Kartın tamamı üye detayına bağlanır.

### 3. Ekip üye detayı — `/[locale]/ekibimiz/[slug]`

`generateStaticParams`: dört dil × `listSlugs('team', locale)`.

Düzen: `PageBanner` (breadcrumb + `h1` = üye adı) → iki sütun
(solda fotoğraf/monogram, sağda unvan + MDX biyografi) →
`CtaBand`.

JSON-LD: `Person` (SPEC-004'te yazıldı) + `BreadcrumbList`.
`Person.image` yalnızca fotoğraf varsa üretilir.

**Uygulamada `33_Ekip_Melisa_K.pdf` ve `34_Ekip_Esra_B.pdf`
açılıp bu düzenin karşıladığı doğrulanacak.**

### 4. Resim galerisi — `/[locale]/galeri`

1. `PageBanner`.
2. Ortalanmış giriş.
3. **Grid** — tasarımda karo boyutları değişken (bazı görseller
   iki satır/sütun kaplıyor). `images.json`'a opsiyonel `span`
   alanı eklenir (`'wide' | 'tall' | undefined`) ve CSS grid ile
   uygulanır. Alan yoksa normal karo.
   Her karonun başlangıç-alt köşesinde beyaz etiket çipi
   (`images.json` içindeki `label`, dile göre `alt.{locale}.json`
   üzerinden çevrilir).
4. `CtaBand`.

**Lightbox** — client bileşeni, Radix `dialog` üzerine:
- Karoya tıklanınca büyük görsel açılır.
- `Esc` kapatır, ok tuşları önceki/sonraki, odak tuzağı Radix'ten.
- Başlık olarak görselin `alt` metni okunur.
- Tek bir `dialog` örneği kullanılır; her karo için ayrı modal
  render edilmez.

JSON-LD: her görsel için `ImageObject` (SPEC-004'te yazıldı),
tek bir `@graph` dizisi olarak basılır.

### 5. Video galerisi — `/[locale]/video-galeri`

Aynı grid düzeni; karo içeriği kapak görseli + ortada oynat
düğmesi.

**Facade zorunlu** (`project-overview.md`): tıklanana kadar
YouTube'a **hiçbir istek gitmez**. Karo yalnızca yerel kapak
görselini gösterir; tıklanınca `dialog` içinde
`youtube-nocookie.com` iframe'i yüklenir.

Oynat düğmesi `<button>`'dır ve `aria-label` taşır
(`video.play` + video başlığı).

`videos.json` YouTube kimliğini ve kapak görselini tutar;
başlık/açıklama `meta.{locale}.json` içinde.

### 6. SSS — `/[locale]/sss`

Tasarım 11:

1. `PageBanner`.
2. **İki sütun** — solda eyebrow (`MERAK EDİLENLER`) + `h2` +
   açıklama + görsel; sağda numaralı soru listesi (`01`–`08`).
3. `CtaBand`.

**Akordeon davranışı:** Tasarımda tüm cevaplar görünür durumda.
`type="multiple"` ve tüm öğeler varsayılan olarak **açık**
render edilir (yine de kapatılabilir). Gerekçe: Google, yapısal
verideki içeriğin kullanıcıya da görünür olmasını bekliyor;
varsayılan kapalı bir akordeon bu beklentiyi zorlar.

**Bu sayfa `FAQPage` şemasının tek sahibidir** — SPEC-006'da
anasayfanın şema üretmemesi kararlaştırılmıştı. `getFaq(locale)`
tamamı kullanılır.

### 7. `listing` genişletmesi

`listingSchemas`'a dört anahtar eklenir:

- `team` → taban + `approach` (3 özellik)
- `gallery` → taban
- `video` → taban
- `faq` → taban + `intro.image` / `intro.imageAlt`

`ListingResultMap` buna göre genişletilir; SPEC-008'de kurulan
anahtar-daraltma yapısı korunur.

### 8. `messages` genişletmesi

```
team.role, team.viewProfile
gallery.label, gallery.close, gallery.previous, gallery.next
video.play, video.close
faq.number
a11y.lightbox, a11y.videoDialog
```

Dört dilde birden.

## Acceptance

1. Dört kurumsal sayfa, ekip listesi, iki galeri, SSS ve üç yasal
   sayfa dört dilde açılıyor.
2. Her sayfada tam olarak bir `h1` (banner'da).
3. Fotoğrafı olmayan ekip üyesi monogramla görünüyor; kartın
   erişilebilir adı kişinin adı, monogram `aria-hidden`.
4. `Person` şeması fotoğrafsız üyede `image` alanı üretmiyor.
5. Lightbox klavye ile açılıp kapanıyor; `Esc` kapatıyor, ok
   tuşları geziniyor, odak modal içinde kalıyor.
6. Video karosuna tıklanmadan önce ağ sekmesinde
   `youtube.com` / `ytimg.com` isteği **yok**; tıklandıktan
   sonra `youtube-nocookie.com` yükleniyor.
7. SSS sayfası `FAQPage` şeması üretiyor ve tüm sorular ekranda
   görünür durumda; anasayfa hâlâ `FAQPage` üretmiyor.
8. Galeri `ImageObject` şeması üretiyor ve her görselin `alt`
   metni dört dilde dolu.
9. Kurumsal sayfada `timeline` bloğu `<dl>` semantiğiyle
   render ediliyor.
10. Yasal sayfalarda tıbbi uyarı kutusu **yok**.
11. Arapça'da grid, timeline ve lightbox okları aynalanmış.
12. `09`, `33`, `34`, `04`, `06`, `08` numaralı tasarımlar açılıp
    şablonlarla karşılaştırıldı; sapma varsa spec güncellendi.
13. `npm run check` temiz geçiyor.

## Notes

- **Monogram kararı bir açık soruyu kapatıyor.** Ekip
  fotoğraflarının olup olmadığı SPEC-001'den beri bekliyordu;
  tasarım zaten fotoğrafsız durumu çözmüş. Fotoğraf sonradan
  gelirse yalnızca frontmatter'a eklenir, kod değişmez.
- **Video facade'ı pazarlık konusu değil.** Gömülü YouTube
  iframe'i sayfa başına ~500KB ve üçüncü parti çerez getirir;
  LCP hedefini (≥ 90) tek başına düşürür ve çerez onayı
  gerektirir.
- Galeri `span` alanı tasarımdaki değişken karo boyutlarını
  taklit etmek için. Alan opsiyonel olduğu için içerik editörü
  hiç kullanmazsa düzgün bir eşit-karo grid'i çıkar — bozulmaz.
- SSS'nin varsayılan açık olması, akordeonun anasayfadaki
  davranışından farklı (orada varsayılan kapalı). İki farklı
  bağlam, iki farklı doğru davranış; aynı bileşen `defaultOpen`
  prop'uyla ikisini de karşılar.
- Bu spec altı sayfa tipini birden kapsıyor ve
  `ai-workflow-rules.md`'nin "tek iş birimi" kuralını zorluyor.
  Uygulama sırasında sırayla ilerlenir ve her tip bitince
  ayrı doğrulanır: kurumsal → ekip → galeri → video → SSS →
  yasal.
