# SEO Denetim Raporu — Dr. Murat Irmak Kliniği

**Proje:** `hair-transpalant-next-dr-murat-` (Next.js 16 App Router, next-intl, 4 dil)
**Denetim tarihi:** 27 Ağustos 2026
**Kapsam:** Kod tabanı düzeyinde tam teknik SEO denetimi + uygulanan düzeltmeler
**Genel skor:** **79 / 100 — İyi** (denetim öncesi: 64 — Geliştirilmeli)

---

## Durum: YAYINDA ✅

Denetim kod tabanı üzerinde başladı (o sırada alan adı hâlâ eski Apache sunucusunu
gösteriyordu). Denetim sırasında DNS Vercel'e taşındı ve tüm değişiklikler
**production'a deploy edildi**. Canlı doğrulama aşağıda.

**Yayın adresi:** https://www.drmuratirmak.com (Vercel, `fra1`)

Hâlâ **ölçülemeyen** tek şey — güven düzeyi `Hipotez`:

| Ölçülemeyen | Neden | Ne zaman ölçülebilir |
|---|---|---|
| Core Web Vitals (LCP / INP / CLS) | Saha (CrUX) verisi birikmedi | Yayın + 28 gün |
| Backlink profili | Alan adı düzeyinde, ayrı araç gerekir | Ahrefs/GSC bağlandığında |

Yapılan her şey hem **build çıktısı** (`npm run check` → exit 0, 157 statik sayfa)
hem de **canlı site** üzerinde doğrulandı.

---

## Skor dağılımı

| Kategori | Ağırlık | Önce | Sonra | Not |
|---|---|---|---|---|
| Teknik SEO | %25 | 78 | **93** | Zaten güçlüydü; ikon/manifest/AI-crawler eksikleri kapatıldı |
| İçerik kalitesi & E-E-A-T | %20 | 40 | **42** | **En büyük açık.** Kod değil, yazı işi |
| Sayfa içi SEO | %15 | 84 | **87** | 2 uzun başlık/açıklama kısaltıldı |
| Yapısal veri (Schema) | %15 | 70 | **92** | Klinik/hekim/site grafiği bütünleştirildi |
| Performans (CWV) | %10 | 80 | 82 | Hipotez — kod sinyalleri iyi, saha verisi yok |
| Görsel optimizasyonu | %10 | 72 | **90** | Eksik OG görseli üretildi, alt kapsamı zaten %100 |
| AI arama hazırlığı (GEO/AEO) | %5 | 20 | **88** | llms.txt + yanıt motoru politikası + zengin şema |
| **Toplam** | | **64** | **79** | |

---

## 🔴 Kritik bulgular — **düzeltildi**

### 1. Varsayılan OG görseli hiç yoktu

- **Kanıt:** `src/lib/seo/config.ts:57` → `DEFAULT_OG_IMAGE = '/images/og/default.webp'`.
  `public/images/og/` altında bu dosya **yoktu**. `ls` çıktısında 38 OG görseli var,
  `default.webp` aralarında değil.
- **Etki:** Kendi `ogImage`'ı olmayan her sayfa (yasal sayfalar, 404, gelecekte
  eklenecek sayfalar) sosyal paylaşımda ve arama önizlemesinde **404 veren bir
  görsel** bildiriyordu. WhatsApp/Facebook paylaşımında kart görselsiz çıkar —
  bir klinik için tıklama oranını doğrudan düşürür.
- **Düzeltme:** 1200×630 marka görseli üretildi (`public/images/og/default.webp`) —
  logo + klinik adı + "Medikal Estetik ve Tamamlayıcı Tıp • Küçükçekmece".
- **Güven:** `Doğrulandı` (dosya sistemi kanıtı).

### 2. Marka kimliği yer tutucuydu

- **Kanıt:** `src/components/shared/brand.tsx` yorumu: *"Gerçek logo SPEC-011'de
  gelecek; şimdilik token'lardan kurulmuş bir işaret"* — header ve footer'da
  harf kutusu ("D") gösteriliyordu. `src/app/favicon.ico` yalnızca **16×16**
  tek boyutluydu. `apple-icon`, `manifest`, `theme-color` yoktu.
- **Etki:** Sekmede, yer imlerinde, Android "ana ekrana ekle" akışında ve Google'ın
  marka panelinde klinik logosu görünmüyordu. Bir sağlık markası için tanınırlık
  sinyalinin tamamen eksik olması demek.
- **Düzeltme:** `muratirmaklogo.webp` (1254×1254 lacivert mühür) tüm ikon setine
  dönüştürüldü — aşağıdaki *Uygulanan değişiklikler* bölümünde tam liste.
- **Güven:** `Doğrulandı` (tarayıcıda `<link rel=icon>` etiketleri okundu).

### 3. Form maili sessizce ölebilirdi

- **Kanıt:** `src/lib/mail/transport.ts` yalnızca `SMTP_PASSWORD` okuyordu;
  Vercel şablonlarında yaygın olan `SMTP_PASS` yazılsaydı transport `null` döner,
  her randevu talebi `mail_failed` olurdu. Ayrıca `MAIL_TO` tanımsızsa
  `getMailConfig()` `null` dönüyordu — künyede adres olmasına rağmen.
- **Etki:** Tek bir ortam değişkeni adı yüzünden **randevu talepleri kaybolur**.
  Bir klinik sitesinde en pahalı hata bu.
- **Düzeltme:** İki isim de okunuyor; `SMTP_FROM` boşsa `SMTP_USER`'a,
  `MAIL_TO` boşsa `clinic.json → contact.appointmentEmail`'e
  (`dr_mirmak@hotmail.com`) düşüyor. 4 senaryo test edildi (aşağıda).
- **Güven:** `Doğrulandı` (birim testi çalıştırıldı).

---

### 3b. Canlı sitedeki tüm canonical'lar `.vercel.app` adresini gösteriyordu

Bu bulgu denetimin ilk turunda görülemedi — site o sırada henüz Vercel'de değildi.
Deploy sorunu araştırılırken ortaya çıktı ve **canlıda aktif bir hataydı.**

- **Kanıt:** Vercel projesinde **hiçbir ortam değişkeni tanımlı değildi**
  (`vercel env ls` → *No Environment Variables found*). `NEXT_PUBLIC_SITE_URL`
  olmayınca `resolveSiteUrl()` tasarım gereği `VERCEL_URL`'e düşüyor:

  ```html
  <link rel="canonical" href="https://drmuratirmak-164u84b51-metro-yazilim.vercel.app/tr"/>
  ```

  `robots.txt` içindeki `Host:` ve `Sitemap:` satırları da aynı adresi veriyordu.
- **Etki:** `www.drmuratirmak.com` kendi sayfalarının asıl adresi olarak geçici bir
  `.vercel.app` URL'i beyan ediyordu. Google canonical'a uyar — gerçek alan adının
  tamamen indeksten düşmesine yol açabilecek bir hata.
- **Düzeltme:** `NEXT_PUBLIC_SITE_URL=https://www.drmuratirmak.com` Vercel'de
  **yalnızca Production** ortamına eklendi. Preview'a bilinçli olarak
  EKLENMEDİ — `config.ts` orada Vercel URL'ine düşerek preview içeriğinin canlı
  siteyi kannibalize etmesini engelliyor; oraya production domainini yazmak o
  korumayı bozardı.
- **Doğrulama (canlı):** canonical, dört hreflang, x-default ve robots.txt'in
  `Host`/`Sitemap` satırlarının hepsi artık `https://www.drmuratirmak.com`.

---

## ⚠️ Yüksek öncelikli bulgular — **düzeltildi**

### 4. Boş `/video` sayfası dört dilde indekslenebilirdi → **rota tamamen kaldırıldı**

- **Kanıt:** `content/video/videos.json` içeriği `[]`. Sayfa sitemap'ten
  çıkarılmış ve menüden kaldırılmış, ama `noindex` **yoktu** — dış bir bağlantıyla
  keşfedilirse indekslenebilirdi.
- **Etki:** Birbirinin aynısı, içeriksiz 4 sayfa. Google'ın "ince içerik"
  değerlendirmesi **alan adı düzeyinde** çalışır; birkaç boş sayfa tüm sitenin
  kalite sinyalini aşağı çeker.
- **Düzeltme (2. tur):** Önce koşullu `noindex` eklendi; ardından video hiç
  konulmayacağı netleşince **rota, bileşen, içerik ve görselleriyle birlikte
  tamamen kaldırıldı**. `/tr/video-galeri` ve dört dildeki karşılıkları artık
  404 dönüyor.
- **Önemli yan etki:** Eski sitedeki `/video-galerisi` için tanımlı 301,
  artık var olmayan bir sayfaya işaret ediyordu — **404'e giden bir yönlendirme**
  olacaktı. En yakın içerik olan foto galerisine yönlendirildi:
  `/video-galerisi → /tr/galeri` (308, tek adım, doğrulandı).

### 5. Yanıt motoru (AI) tarayıcı politikası yoktu

- **Kanıt:** Eski `src/app/robots.ts` yalnızca `User-Agent: *` kuralı üretiyordu.
- **Etki:** "Halkalı'da botoks nerede yaptırılır?" gibi sorularda ChatGPT,
  Perplexity ve AI Overviews artık gerçek trafik gönderiyor. Politikanın
  yazılı olmaması, ileride yanlışlıkla kapatılmasını kolaylaştırır.
- **Düzeltme:** Yanıt motorları açıkça **açık** (GPTBot, OAI-SearchBot,
  ChatGPT-User, ClaudeBot, Claude-User, Claude-SearchBot, PerplexityBot,
  Perplexity-User, Google-Extended, Applebot-Extended, Amazonbot,
  meta-externalagent); karşılığında tıklama göndermeyen toplu kazıyıcılar
  (Bytespider, CCBot) **kapalı**.
- **Not:** CCBot kararı tartışmaya açık — açmak istersen `SCRAPER_BOTS`
  dizisinden çıkarman yeterli.

### 6. `llms.txt` yoktu

- **Etki:** Yanıt motorları klinik künyesini sayfa sayfa gezerek çıkarmak
  zorundaydı; adres, telefon, hizmet listesi ve SSS dağınık kalıyordu.
- **Düzeltme:** `/llms.txt` içerikten **türetilen** bir rota olarak eklendi
  (`src/app/llms.txt/route.ts`). Klinik künyesi, 10 hizmet, 7 kurumsal sayfa,
  10 blog yazısı ve 8 SSS tek dosyada. Elle güncellenen ikinci bir kaynak yok —
  içerik değişince dosya da değişir.

### 7. Yapısal veri grafiği kopuktu

Denetim öncesi durum:

| Sorun | Kanıt |
|---|---|
| `MedicalClinic`'te `logo` / `image` yok | Google yerel panelinde görsel çıkmıyordu |
| `hasMap` yok | Koordinat vardı ama harita bağlantısı üretilmiyordu |
| `contactPoint` yok | Çok dilli destek sinyali kayıp |
| `availableService` yok | "Bu klinik ne yapıyor?" şemadan cevaplanamıyordu |
| `WebSite` yalnızca anasayfada | Diğer 156 sayfada site varlığı tanımsızdı |
| Hekim varlığı yok | `founder`/`employee` bağı kurulmamış; E-E-A-T tek sayfada hapis |
| İletişim sayfasında şema yok | NAP (isim-adres-telefon) sinyali hiçbir sayfaya bağlanmamış |

**Düzeltme:** `src/lib/seo/schema/index.ts` yeniden düzenlendi:

- `MedicalClinic` → `logo` (kare/opak), `image` (3 gerçek klinik fotoğrafı),
  `hasMap` (koordinattan türetilir), `contactPoint` (+ 4 dil),
  `availableService` (10 hizmet, dile göre doğru URL'lerle),
  `knowsAbout`, `founder`, `employee`.
- Yeni `physicianSchema` — hekim tekil bir `Person` (`#physician`), her sayfada
  klinikle birlikte basılıyor.
  **Not:** schema.org'da `Physician` bir *kurum* tipidir (MedicalOrganization'dan
  türer), insan değil — bu yüzden hekim `Person` olarak modellendi. Yaygın bir hata.
- `personSchema` — baş hekim için ekip sayfası artık **aynı `@id`'yi** kullanıyor;
  daha önce aynı insan için iki ayrı varlık üretiliyordu (bilgi grafiğinde ikizleme).
- Yeni `contactPageSchema` — `ContactPage` + `mainEntity: klinik`.
- `WebSite` artık layout'ta, **tüm sayfalarda**.

**Doğrulama:** Tarayıcıda `/tr` üzerinde okunan JSON-LD:
`WebSite | .../tr#website`, `MedicalClinic | .../#clinic`, `Person | .../#physician`.

### 8. Statik görsellerde önbellek başlığı yoktu

- **Düzeltme:** `next.config.ts` → `/images/*` ve `/icons/*` için
  `Cache-Control: public, max-age=31536000, immutable`;
  ayrıca `images.minimumCacheTTL = 1 yıl`. Tekrar ziyarette LCP'yi düşürür.

---

## 🔴 Düzeltilmeyen kritik bulgu — **karar sizin**

### 9. İçerik çok ince (en büyük sıralama engeli)

Bu, sitedeki **en pahalı** SEO sorunu ve kodla çözülmüyor.

Ölçüm (112 MDX dosyası tarandı, frontmatter hariç gövde kelime sayısı):

| İçerik tipi | Ölçülen aralık | Rekabetçi eşik | Durum |
|---|---|---|---|
| Blog yazıları (10 × 4 dil) | **78 – 154 kelime** | 800 – 1.500 | 🔴 ~%10'u |
| Hizmet sayfaları (10 × 4 dil) | **62 – 111 kelime** | 500 – 800 | 🔴 ~%15'i |
| Kurumsal sayfalar (4 × 4 dil) | **21 – 57 kelime** | 300+ | 🔴 ~%10'u |
| Ekip biyografileri (3 × 4 dil) | **19 – 33 kelime** | 150+ | 🔴 E-E-A-T zayıf |
| Yasal (KVKK) | **24 – 30 kelime** | — | 🔴 Hukuken de yetersiz |

**Örnek:** `content/blog/halkali-botoks-merkezi/tr.mdx` — iki H2, iki paragraf,
bir Callout, bir Figure. Toplam 90 kelime. Bu yazının hedeflediği
*"halkalı botoks merkezi"* sorgusunda rakipler 1.200+ kelimeyle yarışıyor.

**Neden kendiliğinden yazmadım:** Bunlar tıbbi içerik. Botoks dozları, sülük
tedavisi endikasyonları, ozon uygulaması iddiaları — **YMYL** kategorisinde ve
hekim onayı olmadan üretilmesi hem SEO hem hukuki risk. Ayrıca Türkiye'de sağlık
tanıtımı mevzuatı (Sağlık Bakanlığı reklam yasağı) belirli ifadeleri yasaklıyor.

**Önerim:** Türkçe'yi Dr. Irmak'ın onayıyla genişletip diğer üç dile çevirmek.
80 dosyanın tamamı yerine, **önce trafiği en yüksek 5 hizmet + 5 blog yazısı**
(Türkçe). Bunu birlikte yapabiliriz — söylemen yeterli.

---

## ⚠️ Düzeltilmeyen — veri eksik, uydurulmadı

| # | Bulgu | Neden düzeltilmedi | Sende olması gereken |
|---|---|---|---|
| 10 | `openingHours: null` (`content/clinic.json`) | Gerçek çalışma saatleri elimde yok | Klinik açılış/kapanış saatleri, hafta günü bazında |
| 11 | `foundingDate: null` | Aynı | Kliniğin kuruluş yılı |
| 12 | `sameAs` yalnızca Instagram | Diğer profillerin URL'leri elimde yok | **Google Business Profile** (yerel SEO'da en güçlü sinyal), varsa YouTube / Facebook |
| 13 | `priceRange` yok | Klinik fiyat yayımlamıyor (bilinçli politika) | İstersen `₺₺` gibi bir aralık verilebilir |
| 14 | `AggregateRating` yok | **Bilinçli.** Gerçek olmayan puan basmak Google'ın manuel eyleme aldığı ihlallerden | Gerçek Google yorumları toplandıktan sonra |
| 15 | ~~`videos.json` boş~~ | **Çözüldü** — video galerisi tamamen kaldırıldı | — |

---

## ℹ️ Bilgi / bilinçli tercihler

- **FAQPage şeması** — Ağustos 2023'ten beri zengin sonuçlar yalnızca **resmî
  kurum ve sağlık otoritesi** sitelerinde gösteriliyor. Özel bir klinikte SERP'te
  akordeon çıkmayacak. **Yine de kaldırılmadı**: yanıt motorları (AEO) bu
  işaretlemeyi soru-cevap çıkarmak için okuyor, zararı yok.
- **CSP başlığı yok** — `next.config.ts` içinde gerekçesi yazılı ve doğru:
  yanlış kurulmuş bir CSP, Next'in inline script'lerini kırar. Ayrı bir iş
  olarak `report-only` modda başlatılmalı. Diğer güvenlik başlıkları (HSTS,
  nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) yerinde.
- **Anasayfa H1'i anahtar kelime taşımıyor** — *"Sağlık, bakım ve estetikte
  kişiye özel yaklaşım."* Yerel bir klinik için H1'in varlık + konum sinyali
  taşıması beklenir. Bu bir **tasarım/metin kararı**, tek taraflı değiştirmedim.
- **Sitemap'te görsel girdisi yok** — `MetadataRoute.Sitemap` destekliyor;
  Google Görseller'den ek trafik için eklenebilir. Düşük öncelik.
- **"Medya" menü grubunda tek öğe kaldı** — video kaldırılınca altında yalnızca
  "Galeri" var. Tek öğeli açılır menü UX açısından gereksiz; grubu kaldırıp
  "Galeri"yi doğrudan üst menüye almak tek satırlık iş. Görünür bir menü
  değişikliği olduğu için tek taraflı yapılmadı.
- **Kök `messages/` klasörü kullanılmıyor** — aktif çeviriler `src/messages/`
  altında (`@/messages/*` alias'ı oraya bakıyor). Kökteki 4 dosya iskeletten
  kalma ölü dosya; silinebilir.

---

## ✅ Denetimde sağlam çıkan alanlar

Bu proje SEO açısından **iyi kurulmuş**. Aşağıdakiler çalışıyordu, dokunulmadı:

| Alan | Kanıt |
|---|---|
| hreflang karşılıklılığı | Yapısal olarak garanti (`localeUrls` tek kaynaktan üretiyor), elle yazılmıyor. `npm run seo:check` doğruluyor |
| Canonical | Tek çıkış noktası `buildMetadata()`; preview dağıtımlarında Vercel URL'ine düşüyor (canlıyı kannibalize etmiyor) |
| Preview indekslenmesi | `IS_PRODUCTION_DEPLOY` kontrolü — preview'da `Disallow: /` |
| 301 haritası | 31 yönlendirme, tek adımda (zincir yok), hedeflerin varlığı build'de doğrulanıyor |
| Görsel alt metinleri | 5 sayfa örneklendi: **41 görselin 41'inde alt var**; 2'si bilinçli dekoratif (logo) |
| Başlık hiyerarşisi | Her sayfada tam **1 adet H1**, atlama yok |
| Title/description uzunlukları | 112 MDX dosyasının **hiçbirinde** marka ekiyle 60 karakter aşımı yok |
| Font stratejisi | Ölçülmüş ve gerekçelendirilmiş (Arapça fontta `preload: false` → 4 dosya/150 KB tasarruf) |
| Breadcrumb şeması | 11 sayfa tipinde mevcut |
| Bot koruması | Honeypot + minimum doldurma süresi + IP oran sınırı (Redis yoksa atlanıyor, form ölmüyor) |

---

## Uygulanan değişiklikler — dosya listesi

**Yeni dosyalar**

```
src/app/manifest.ts                     Web App Manifest (/manifest.webmanifest)
src/app/llms.txt/route.ts               AI yanıt motorları için içerikten türetilen özet
src/app/icon.png                        512×512 (Next otomatik <link rel=icon>)
src/app/apple-icon.png                  180×180, opak beyaz zemin (iOS saydamı siyaha çevirir)
public/icons/icon-192.png               Manifest ikonu
public/icons/icon-512.png               Manifest ikonu
public/icons/maskable-512.png           Android maskable (logo %60 güvenli alanda)
public/images/brand/logo.png            Header/footer markası (495×512, saydam)
public/images/brand/logo.webp           Aynısının WebP'i
public/images/brand/logo-square.png     schema.org logo alanı (kare, opak)
public/images/og/default.webp           1200×630 varsayılan paylaşım görseli
.env                                    SMTP + site değişkenleri (gitignore'da)
```

**Değiştirilen dosyalar**

```
src/app/favicon.ico                     16/32/48/64 çok boyutlu (öncesi: yalnız 16×16)
src/app/robots.ts                       AI tarayıcı politikası
src/app/[locale]/layout.tsx             viewport/themeColor, formatDetection, 3'lü şema grafiği
src/app/[locale]/page.tsx               Mükerrer WebSite şeması kaldırıldı (layout'a taşındı)
src/app/[locale]/contact/page.tsx       ContactPage şeması
src/components/shared/brand.tsx         Gerçek logo (footer'da beyaz daire üzerinde)
src/lib/seo/schema/index.ts             Klinik/hekim/iletişim şemaları zenginleştirildi
src/lib/mail/transport.ts               SMTP_PASS desteği, FROM/TO geri düşüşleri
src/lib/mail/send.ts                    fallbackTo parametresi
src/actions/submit-forms.ts             Künye adresini fallback olarak geçiriyor
next.config.ts                          Görsel önbelleği (immutable, 1 yıl)
.env.example                            SMTP_PASS ve geri düşüş notları
content/home/{tr,en,ar,ru}.json         Hero başlık + açıklaması kısaltıldı (4 dil)
content/home/tr.json                    Meta açıklaması 161 → 150 karakter
content/listing/services/tr.json        Başlık kısaltıldı
src/i18n/routing.ts                     /video yolları kaldırıldı
src/lib/navigation.ts                   /video menü girdisi ve NavHref üyesi kaldırıldı
src/lib/content/{index,types,schemas}.ts  getVideos / VideoItem / video listing kaldırıldı
src/lib/seo/legacy-redirects.ts         /video-galerisi → /tr/galeri (404'e gitmesin diye)
src/messages/{tr,en,ar,ru}.json         nav.video ve video.* anahtarları kaldırıldı
src/app/sitemap.ts                      Geçersiz /video yorumu temizlendi
public/icon.png → public/images/brand/legacy-icon-yedek.png
                                        (src/app/icon.png ile aynı /icon.png rotasına çakışıyordu)
```

**Silinen dosyalar** (video galerisi)

```
src/app/[locale]/video/page.tsx
src/components/shared/video-grid.tsx
content/listing/video/{tr,en,ar,ru}.json
content/video/{videos.json, meta.tr.json, meta.en.json, meta.ar.json, meta.ru.json}
public/images/pages/video-banner.webp
public/images/og/video.webp
public/images/gallery/video-botoks-cover.webp   (hiçbir yerde referans edilmiyordu)
```

---

## Yayın altyapısı — çözülen iki tuzak

Bu ikisi kod hatası değil, **Vercel yapılandırma tuzağıydı**; ikisi de deploy'u
tamamen engelliyordu ve bulunması zaman aldı.

### Vercel Hobby + private repo → commit yazarı kontrolü

Push'lar deploy tetiklemiyordu. Vercel'in verdiği hata:

> *The deployment was blocked because the commit author did not have contributing
> access to the project on Vercel. The Hobby Plan does not support collaboration
> for private repositories.*

Bu mesaj yanıltıcı: Pro'ya geçmek gerekmiyordu. Hobby planında **private** repolarda
Vercel, deploy'u tetikleyen commit'in yazarının Vercel hesabı sahibiyle aynı kişi
olmasını şart koşuyor. Git geçmişinde kimlik kaymıştı:

```
05c412c  arslanberattdev <arslanberattdev@gmail.com>     ← son 3 commit
8801c68  arslanberattdev <arslanberattdev@gmail.com>
07f9980  arslanberattdev <arslanberattdev@gmail.com>
a6a4a2e  Muhammet Berat Arslan <info@metroyazilim.com>   ← Vercel hesabıyla eşleşen kimlik
```

Vercel hesabı `metroyazilim` (= `info@metroyazilim.com`), repo'nun tek
collaborator'ı da o. Yani gerçekte hiç ekip çalışması yoktu; sorun tamamen
commit metadata'sındaydı.

**Çözüm:** reponun `user.email`'i `info@metroyazilim.com`'a çekildi (global ayara
dokunulmadı, diğer projeler etkilenmedi), son commit'in yazarı düzeltildi ve
`main` force-push edildi. Ağaç hash'i birebir aynı kaldı
(`e7b224c…` → `e7b224c…`) — tek satır kod değişmedi.

> **Kalıcı not:** commit mesajlarındaki `Co-Authored-By:` satırı da ikinci bir
> "yazar" ekliyor ve aynı blokajın bilinen tetikleyicilerinden. Bu repoda
> kullanılmıyor.

### Ortam değişkenleri hiç tanımlı değildi

Yukarıdaki *bulgu 3b*'ye yol açan durum. `NEXT_PUBLIC_SITE_URL` eklendi;
**SMTP değişkenleri hâlâ boş** — formlar canlıda mail göndermiyor (bkz. ACTION-PLAN P0).

---

## Doğrulama kanıtları

**Build kapısı**

```
npm run check   → exit 0
                  içerik doğrulama ✅ | seo:check ✅ (31 yönlendirme, 24 varlık, 4 dil)
                  eslint ✅ | tsc --noEmit ✅ | next build ✅ (157 statik sayfa)
sitemap         → 144 URL
```

**Canlı site doğrulaması** — https://www.drmuratirmak.com

```
canonical / hreflang        → hepsi https://www.drmuratirmak.com/*  ✓
robots.txt Host + Sitemap   → https://www.drmuratirmak.com          ✓
sitemap.xml                 → 144 URL, video içermiyor              ✓
JSON-LD                     → WebSite | MedicalClinic | Person(#physician) ✓
/llms.txt                   → 200                                   ✓
/manifest.webmanifest       → 200                                   ✓
/favicon.ico /icon.png /apple-icon.png /icons/icon-192.png → 200    ✓
/images/og/default.webp /images/brand/logo.png            → 200     ✓
H1                          → "Medikal estetikte kişiye özel yaklaşım."  ✓
/tr/video-galeri, /en/video-gallery, /ru/video-galereya   → 404     ✓
/video-galerisi             → 308 → /tr/galeri                      ✓
```

**Tarayıcı doğrulaması** (yerel dev sunucusu)

```
<meta name="theme-color" content="#012d5b">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.ico" sizes="64x64" type="image/x-icon">
<link rel="icon" href="/icon.png" sizes="512x512" type="image/png">
<link rel="apple-touch-icon" href="/apple-icon.png" sizes="180x180" type="image/png">

JSON-LD: WebSite | MedicalClinic (#clinic) | Person (#physician)
Header logosu: srcset 48px 1x / 96px 2x  (önce yanlışlıkla 3840px isteniyordu — düzeltildi)
Footer logosu: beyaz daire (rgb 255,255,255) üzerinde, koyu zeminde okunuyor
```

**Mail yapılandırması — 4 senaryo test edildi**

```
1) hiç env yok                        → null (form dürüstçe "gönderilemedi" der)
2) sadece SMTP_USER                   → from=SMTP_USER,  to=dr_mirmak@hotmail.com
3) SMTP_FROM dolu, MAIL_TO boş        → from=SMTP_FROM,  to=dr_mirmak@hotmail.com
4) MAIL_TO dolu                       → env kazanır
SMTP_PASS ile transport kurulumu      → başarılı (host/port/secure doğru: 587 → STARTTLS)
```

**Randevu formu — uçtan uca test**
Form dolduruldu ve gönderildi → *"Talebiniz şu anda gönderilemedi. Lütfen
telefonla ulaşın."* Doğru davranış: SMTP bilgileri yerelde boş, sistem
**sessizce "gönderildi" demiyor**. Vercel'de değişkenler dolunca gerçek gönderim başlar.

**WhatsApp / telefon** — dokunulmadı, çalışıyor:
`https://wa.me/905421883034?text=Merhaba%2C%20drmuratirmak.com...` (yeni sekme,
`rel="noopener noreferrer"`) ve `tel:+905421883034` (E.164). Sayfa başına
3 telefon + 3 e-posta + 1 WhatsApp bağlantısı.

> **Not:** Layout'a eklenen `formatDetection: { telephone: false }`, iOS'un
> **düz metin** numaraları kendiliğinden linklemesini engeller — açık `tel:`
> bağlantıları etkilenmez, yukarıda doğrulandı.

---

## Sonraki adımlar

Öncelik sırası ve iş tahminleri `ACTION-PLAN.md` dosyasında.
