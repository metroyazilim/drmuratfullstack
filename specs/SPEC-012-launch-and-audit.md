# SPEC-012 — Yayın ve denetim

**Faz:** 3 — İçerik ve yayın (son)
**Bağımlılık:** SPEC-011
**Sonraki:** —

## Goal

Siteyi yayına hazır hale getirmek, Vercel'e almak ve
`project-overview.md` içindeki 11 başarı ölçütünü canlı ortamda
doğrulamak.

Bu spec iki parçadan oluşur ve ikisi farklı şeyler gerektirir:

- **A — Kod tarafı:** hata sayfaları, güvenlik başlıkları,
  analitik, env şablonu, son denetim. Hesap erişimi gerektirmez,
  bu spec'te tamamlanır.
- **B — Hesap tarafı:** Vercel projesi, domain, SMTP, Upstash,
  Search Console. **Kullanıcının hesaplarına erişim gerektirir**
  ve onsuz tamamlanamaz.

## Context

- `context/project-overview.md` → Success Criteria (11 madde).
- `context/progress-tracker.md` → Klinik Kararı Bekleyenler,
  Bilinen Teknik Borç.
- SPEC-004 → `robots.ts` preview koruması, 301 haritası.
- SPEC-010 → SMTP ve Upstash env değişkenleri.

## A — Kod tarafı (bu spec'te tamamlanır)

### 1. Hata sayfaları

Şu an `not-found.tsx` ve `error.tsx` **yok**; Next.js'in varsayılan
sayfası görünüyor — kullanıcı 404'e düştüğünde markayı da, siteye
dönüş yolunu da kaybediyor.

- `app/not-found.tsx` — markalı 404: logo, dört dile giden
  bağlantılar ve telefon numarası.
- `app/[locale]/error.tsx` — client bileşeni, "tekrar dene"
  butonu, hata detayı **gösterilmez** (yalnızca loglanır).
- `app/[locale]/[...rest]/page.tsx` — locale altındaki eşleşmeyen
  yolları yakalar ve 404 döndürür.

**Kısıt (uygulamada ortaya çıktı):** 404 sayfası site kabuğunun
(header/footer/float butonlar) İÇİNDE render edilemiyor. Sebep:
kök `app/layout.tsx` `<html>`/`<body>` üretmiyor — onları
`[locale]/layout.tsx` üretiyor, çünkü `lang` ve `dir` locale'e
bağlı. `notFound()` tetiklendiğinde Next geçerli bir belge kabuğu
bulamıyor ve kendi hata belgesini kullanıyor. Bu, next-intl'in
bilinen bir kısıtı.

Bu yüzden 404 kendi belgesini üretiyor ve markayı, mesajı ve
dönüş yollarını kendisi taşıyor. Kullanıcı açısından sorun
çözülüyor; tam kabuk ise elde edilemiyor.

### 2. Güvenlik başlıkları

`next.config.ts` içinde `headers()`:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` — klinik sitesi hiçbir yere
  gömülmüyor.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**CSP bilinçli olarak eklenmiyor.** Doğru kurulmamış bir CSP,
Next.js'in inline script'lerini ve YouTube facade'ını kırar;
yanlış kurulmuş CSP hiç CSP'den kötüdür. Ayrı bir iş birimi
olarak, `report-only` modda başlatılarak eklenmelidir.

### 3. Analitik

`@vercel/analytics` ve `@vercel/speed-insights` kök layout'a
eklenir. İkisi de **çerezsizdir** — bu yüzden SPEC-010'daki çerez
bandı bilgilendirme olarak kalır, onay kapısına yükseltilmez.

Üçüncü parti bir analitik (GA4 vb.) eklenirse **çerez bandı onay
kapısına dönüştürülmelidir**; bu not spec'te kalır.

### 4. `.env.example`

Gerekli tüm değişkenler, açıklamalarıyla ve **gerçek değer
içermeden** şablon dosyaya yazılır:

```
NEXT_PUBLIC_SITE_URL
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM
MAIL_TO
UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
```

`.env*` dosyalarının `.gitignore` içinde olduğu doğrulanır.

### 5. Son denetim

- `npm run check` temiz.
- Mobil Lighthouse: anasayfa, hizmet detayı, blog detayı.
- Dört dilde bir sayfada hreflang, canonical ve JSON-LD kontrolü.
- 30 eski URL'in tek adımda 200'e gitmesi (SPEC-011'de doğrulandı,
  tekrarlanır).
- `robots.txt` preview'da `Disallow: /`, üretimde sitemap'i
  işaret ediyor.

## B — Hesap tarafı (kullanıcı erişimi gerekir)

Bu adımlar **yapılamadı** ve kullanıcının hesaplarına erişim
olmadan yapılamaz. Sırasıyla:

1. **Vercel projesi** — repo bağlanır, framework preset Next.js.
2. **Ortam değişkenleri** — yukarıdaki liste Vercel'e girilir.
   `NEXT_PUBLIC_SITE_URL=https://www.drmuratirmak.com`.
3. **Domain** — `drmuratirmak.com` ve `www` Vercel'e yönlendirilir.
   DNS geçişi sırasında eski site erişilebilir kalmalı.
4. **SMTP** — bilgiler girilince randevu formu **canlıda test
   edilir**: klinik maili ve kullanıcı onay maili gerçekten
   ulaşıyor mu? (SPEC-010 kabul kriteri 2 burada koşulur.)
5. **Upstash Redis** — bağlanır, oran sınırı test edilir
   (6. gönderim `rate_limit` dönmeli).
6. **Search Console** — domain doğrulanır, `sitemap.xml`
   gönderilir. "Adres değişikliği" aracı **kullanılmaz** (domain
   aynı, yalnızca URL yapısı değişiyor).
7. **Canlı 301 doğrulaması** — 30 eski URL canlıda tek tek
   kontrol edilir.

## Yayın öncesi kapatılması gerekenler

Bunlar `progress-tracker.md`'de duruyor ve **yayını bloke eder**:

1. **Hasta fotoğrafları** — galeri şu an stok görsellerle dolu.
   Klinik yazılı rıza belgeleyene kadar gerçek hasta fotoğrafı
   eklenmez.
2. **Yasal metinler** — `privacy` ve `cookies` yok. KVKK var.
   Form verisi toplayan bir site için gizlilik metni gerekir.
3. **Ozon Tedavisi** — `noindex`; hekim onayı gelince açılır.
4. **Video galerisi** — menü ve sitemap dışı; gerçek YouTube
   kimlikleri gelince geri açılır.
5. **Çalışma saatleri** — `MedicalClinic` şemasında `openingHours`
   üretilmiyor. Yerel SEO için önemli.
6. **Bülten formu** — footer'da `disabled`. Ya kurulmalı ya
   kaldırılmalı.
7. **Görsel telifi** — stok görsellerin lisans durumu.

## Acceptance

**A bölümü:**

1. 404 sayfası markalı, dört dile giden bağlantıları ve telefon
   numarasını taşıyor; locale altındaki eşleşmeyen yollar 404
   döndürüyor. (Tam kabuk, yukarıdaki kısıt nedeniyle mümkün değil.)
2. Güvenlik başlıkları yanıtta görünüyor.
3. Analitik paketleri kurulu ve kök layout'a bağlı.
4. `.env.example` mevcut ve gerçek sır içermiyor.
5. `npm run check` temiz.
6. Mobil Lighthouse ölçüldü ve raporlandı.

**B bölümü:** Kullanıcı hesap erişimi sağladıktan sonra
koşulacak; bu spec'te **açıkça yapılmadı** olarak işaretlenir.

## Notes

- **A bitince site teknik olarak yayına hazırdır**, ama "Yayın
  öncesi kapatılması gerekenler" listesi boşalmadan yayına
  çıkılmamalıdır. Özellikle 1 ve 2 hukuki risk taşır.
- CSP'nin atlanması bilinçli. Eklenecekse `report-only` ile
  başlanmalı ve en az bir hafta rapor izlenmelidir.
- Lighthouse ölçümü yerel dev sunucusunda değil, **production
  build** üzerinde yapılmalıdır; dev modu gerçekçi olmayan
  düşük skorlar üretir.
