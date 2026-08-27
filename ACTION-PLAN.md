# SEO Aksiyon Planı — Dr. Murat Irmak Kliniği

Detaylı bulgular ve kanıtlar: [`FULL-AUDIT-REPORT.md`](./FULL-AUDIT-REPORT.md)
Tarih: 27 Ağustos 2026

---

## ✅ Tamamlandı (bu oturumda uygulandı)

| # | İş | Etki |
|---|---|---|
| 1 | Eksik varsayılan OG görseli üretildi | Paylaşım kartları artık görselsiz çıkmıyor |
| 2 | Logo → tam ikon seti (favicon/apple/manifest/maskable) | Marka tanınırlığı, PWA, sekme ikonu |
| 2b | Hero başlık/açıklaması kısaltıldı (4 dil) | Masaüstünde açıklama 3 → 2 satır; H1 artık "medikal estetik" anahtar kelimesini taşıyor |
| 3 | Header + footer'da gerçek logo | Yer tutucu "D" kutusu kaldırıldı |
| 4 | SMTP: `SMTP_PASS` desteği + FROM/TO geri düşüşleri | Randevu talebi kaybolma riski kapandı |
| 5 | Yapısal veri grafiği (klinik + hekim + site + iletişim) | Yerel SEO ve bilgi paneli sinyalleri |
| 6 | `/llms.txt` | ChatGPT / Perplexity / AI Overviews görünürlüğü |
| 7 | robots.txt AI tarayıcı politikası | Yanıt motorlarına açık, kazıyıcılara kapalı |
| 8 | `/video` galerisi **tamamen kaldırıldı** (rota, bileşen, içerik, görseller) + `/video-galerisi` 301'i `/tr/galeri`'ye yönlendirildi | 4 ince sayfa gitti, 301 artık 404'e gitmiyor |
| 9 | Statik görsellerde 1 yıllık `immutable` önbellek | Tekrar ziyarette LCP |
| 10 | 2 uzun başlık/açıklama kısaltıldı | SERP'te kırpılma önlendi |
| 11 | **`NEXT_PUBLIC_SITE_URL` Vercel'e eklendi** | Canlıdaki tüm canonical/hreflang `.vercel.app` yerine gerçek alan adını gösteriyor |
| 12 | **Vercel deploy blokajı çözüldü** | Commit yazarı Vercel hesabıyla eşleştirildi; push → otomatik deploy artık çalışıyor |
| 13 | **Production'a deploy edildi ve canlı doğrulandı** | Tüm değişiklikler https://www.drmuratirmak.com adresinde yayında |

---

## 🔴 P0 — Yayına çıkmadan önce (bugün)

### 1. Vercel ortam değişkenlerini doldur

Panelde **Project Settings → Environment Variables** (Production + Preview):

```
SMTP_HOST      = smtp-mail.outlook.com        # Hotmail/Outlook için
SMTP_PORT      = 587                          # 587 → STARTTLS, 465 → SSL
SMTP_USER      = <gönderen hesabın adresi>
SMTP_PASS      = <uygulama parolası>
SMTP_FROM      = <SMTP_USER ile aynı olmalı>
MAIL_TO        = dr_mirmak@hotmail.com
NEXT_PUBLIC_SITE_URL = https://www.drmuratirmak.com
```

> ⚠️ **Hotmail/Outlook uyarısı:** Microsoft, kişisel hesaplarda temel SMTP
> kimlik doğrulamasını büyük ölçüde kapattı. `dr_mirmak@hotmail.com` üzerinden
> **gönderim** çalışmayabilir. Öneri: gönderim için ayrı bir SMTP sağlayıcısı
> (Resend, Brevo, SendGrid — hepsinin ücretsiz kademesi var) kullan,
> **alıcı** olarak `dr_mirmak@hotmail.com` kalsın. Kod bunu zaten destekliyor:
> `SMTP_FROM` gönderen, `MAIL_TO` alıcı — ikisi farklı olabilir.
>
> Ayrıca kendi alan adından gönderim yapılacaksa **SPF + DKIM** kaydı şart;
> yoksa mailler spam'e düşer.

**Doğrulama:** Yayından sonra `/tr/randevu-al` formunu doldur.
"Talebiniz alındı" görüyorsan çalışıyor; "gönderilemedi" görüyorsan SMTP hatalı
(Vercel Functions loglarında `[mail]` satırına bak).

### 2. Upstash Redis bağla (opsiyonel ama önerilir)

`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`. Boş bırakılırsa oran
sınırı atlanır ve form çalışmaya devam eder — ama spam koruması olmaz.

### 3. ~~DNS'i Vercel'e yönlendir~~ ✅ TAMAMLANDI

Alan adı Vercel'e taşındı, yeni site yayında, 31 adet 301 devrede.

### 4. Google Search Console — **sıradaki iş**

- Alan adını doğrula (4 dil için tek mülk yeter, hreflang'i GSC kendisi çözer)
- `sitemap.xml` gönder (144 URL — canlıda doğrulandı)
- **URL Denetimi** ile eski 3–5 URL'i test et → 301'ler tek adımda mı gidiyor?
- "Kapsam" raporunda ilk hafta 404 patlaması olup olmadığını izle
- ⚠️ Site bir süre `.vercel.app` canonical'larıyla yayındaydı. Eğer o dönemde
  indekslendiyse, GSC'de gerçek alan adının yeniden taranmasını iste

---

## 🟠 P1 — İlk hafta

### 5. Google Business Profile'ı bağla — *yerel SEO'da en yüksek getirili tek iş*

Bir semt kliniği için Google Haritalar paketi, organik sıralamadan **daha çok**
hasta getirir. Yapılacaklar:

1. GBP kaydını oluştur/talep et (Küçükçekmece Halkalı adresi)
2. NAP bilgisini siteyle **birebir aynı** yaz — `content/clinic.json` ile
   harf harf eşleşmeli (Google tutarsızlığı güven kaybı sayıyor)
3. GBP URL'ini `content/clinic.json → social` altına ekle
   → şemadaki `sameAs` alanına kendiliğinden girer

### 6. Klinik künyesini tamamla (`content/clinic.json`)

Şu anda `null` olan ve **uydurulmayan** alanlar:

```jsonc
"openingHours": [                    // ← gerçek çalışma saatleri
  { "days": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
    "opens": "09:00", "closes": "19:00" },
  { "days": ["Saturday"], "opens": "10:00", "closes": "16:00" }
],
"foundingDate": "20XX"               // ← kliniğin kuruluş yılı
```

Şema kodu bu alanları **zaten okuyor** — doldurduğun anda
`openingHoursSpecification` üretilmeye başlar. Kod değişikliği gerekmez.

Bu, Google'ın yerel panelinde "Açık / Kapalı" rozetini açan veri.

### 7. Sosyal profilleri ekle

`content/clinic.json → social` altına varsa YouTube, Facebook, GBP.
Şu anda yalnızca Instagram var — `sameAs` ne kadar zenginse varlık doğrulaması
o kadar güçlü.

---

## 🔴 P2 — İçerik genişletme (en büyük iş, en büyük getiri)

**Sorun:** Blog yazıları 78–154 kelime, hizmet sayfaları 62–111 kelime.
Rekabetçi eşiğin **%10–15'i** kadar. Bu, sitenin sıralamamasının ana sebebi.

**Neden ben yazmadım:** Tıbbi içerik (YMYL). Botoks dozu, sülük endikasyonu,
ozon uygulaması iddiaları hekim onayı olmadan üretilmemeli — hem Google
kalite değerlendirmesi hem Sağlık Bakanlığı tanıtım mevzuatı açısından risk.

**Önerilen sıra** (hepsini birden değil):

| Aşama | Kapsam | Hedef | Tahmini iş |
|---|---|---|---|
| 2a | Türkçe **5 hizmet** sayfası (botoks-dolgu, mezoterapi, kupa, sülük, cilt bakımı) | 500–800 kelime | 1 hafta |
| 2b | Türkçe **5 blog** yazısı (en yüksek arama hacimli olanlar) | 800–1.200 kelime | 1–2 hafta |
| 2c | Ekip biyografileri — özellikle Dr. Irmak | 150–300 kelime, eğitim + sertifika + deneyim yılı | 1 gün |
| 2d | Onaylanan Türkçe metinlerin EN/AR/RU çevirisi | — | 1 hafta |
| 2e | Kalan 5 hizmet + 5 blog | — | 2–3 hafta |

**2c özellikle önemli:** Dr. Irmak'ın biyografisi şu anda **28 kelime**.
Aralık 2025'ten beri E-E-A-T *tüm* rekabetçi sorgularda uygulanıyor ve bir
sağlık sitesinde otoritenin taşıyıcısı hekimin kimliğidir. Mezuniyet, sertifikalar,
üyelikler, deneyim yılı — hepsi doğrulanabilir sinyal. Bu, kelime başına
en yüksek getirili içerik işi.

**KVKK sayfası (24–30 kelime)** ayrıca hukuken de yetersiz — bunu bir hukukçuya
yazdırmak gerekiyor, SEO işi değil.

> Türkçe genişletmeyi birlikte yapabiliriz — hangi 5 hizmetle başlayacağını
> söylemen yeterli. Ben taslağı yazarım, Dr. Irmak tıbbi doğruluğu onaylar.

---

## 🟡 P3 — Yayın sonrası, sırayla

| # | İş | Not |
|---|---|---|
| 8 | **Core Web Vitals ölçümü** | Yayın + 28 gün sonra CrUX verisi oluşur. Kod sinyalleri iyi (AVIF/WebP, ölçülmüş font stratejisi, immutable önbellek) ama saha verisi olmadan iddia edilemez |
| 9 | **CSP başlığı** | `next.config.ts` içinde gerekçesi yazılı. `report-only` modda başlat, **en az 1 hafta** raporu izle, sonra zorunlu kıl. Aceleye gelirse Next'in inline script'lerini kırar |
| 10 | **"Medya" menü grubu** | Video kaldırılınca altında tek öğe (Galeri) kaldı. Grubu kaldırıp "Galeri"yi üst menüye almak tek satır — `src/lib/navigation.ts`. Görünür menü değişikliği olduğu için sana bırakıldı |
| 11 | **Anasayfa H1'inde konum sinyali** | Hero kısaltılırken H1 *"Medikal estetikte kişiye özel yaklaşım."* oldu — artık anahtar kelime taşıyor ama **konum** (Küçükçekmece/Halkalı) hâlâ yok. Yerel arama için eklenebilir; metin kararı |
| 12 | **Sitemap'e görsel girdileri** | Google Görseller'den ek trafik. `MetadataRoute.Sitemap` destekliyor. Düşük öncelik |
| 13 | **Gerçek hasta yorumları** | `AggregateRating` şeması ancak gerçek yorumlarla eklenmeli. Uydurma puan Google'ın manuel eylem aldığı ihlallerden — **asla** yapma |
| 14 | **CCBot kararı** | Şu anda kapalı. Açmak istersen `src/app/robots.ts` → `SCRAPER_BOTS` dizisinden çıkar |

---

## Beklenmemesi gerekenler

Dürüst olmak gerekirse:

- **FAQPage zengin sonucu çıkmayacak.** Ağustos 2023'ten beri yalnızca resmî
  kurum ve sağlık otoritesi sitelerinde gösteriliyor. Şema yine de duruyor
  çünkü yanıt motorları okuyor — ama SERP'te akordeon bekleme.
- **Teknik SEO tek başına sıralama getirmez.** Bu sitenin teknik altyapısı
  şu an 93/100 — sektör ortalamasının çok üstünde. Sıralamayı tutan şey
  içeriğin inceliği ve alan adı otoritesi. P2 yapılmadan P0/P1'in getirisi sınırlı kalır.
- **İlk 2–3 ay hareket beklemeyin.** Yeni bir teknik altyapı + 301 geçişi sonrası
  Google'ın yeniden değerlendirmesi zaman alır. Geçişte geçici düşüş normaldir.
