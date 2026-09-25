# Dr. Murat Irmak Klinik — Kurumsal Web Sitesi

## Overview

Dr. Murat Irmak Kliniği (Küçükçekmece / Halkalı, İstanbul) için medikal
estetik ve tamamlayıcı tıp hizmetlerini tanıtan, çok dilli ve arama
motoru odaklı bir kurumsal web sitesi. Mevcut `drmuratirmak.com`
sitesi 2022 yapımı, jQuery/Bootstrap tabanlı statik bir PHP sitedir;
mobil performansı, semantik yapısı ve SEO altyapısı yetersizdir ve tek
dillidir (TR).

Bu proje, mevcut sitenin **tüm içeriğini koruyarak** onu Next.js App
Router üzerinde yeniden inşa eder; elimizdeki 34 sayfalık yeni tasarım
setini (Folixa esintili, açık temalı, mavi vurgulu) birebir uygular;
Türkçe, İngilizce, Arapça ve Rusça olmak üzere dört dilde yayınlar.
Hedef kitle, İstanbul Avrupa Yakası'nda estetik/tamamlayıcı tıp
uygulaması arayan yerel hastalar ile Arapça ve Rusça konuşan sağlık
turizmi hastalarıdır.

Sitenin çözdüğü problem: klinik bugün organik aramada görünmüyor,
yabancı hastaya ulaşamıyor ve randevu talebi yalnızca telefondan
geliyor. Yeni site; teknik SEO, çok dilli içerik ve her ekranda erişilir
WhatsApp / Ara / Randevu aksiyonlarıyla bu üç boşluğu kapatır.

## Goals

1. **Organik görünürlük:** Yayına alındıktan sonraki 3 ay içinde
   "halkalı botoks", "küçükçekmece dolgu", "hacamat istanbul" gibi
   yerel niyetli sorgularda ilk sayfa hedefi. Ölçüm: Google Search
   Console impression + ortalama pozisyon.
2. **Performans:** Tüm şablon sayfalarda mobil Lighthouse
   Performance ≥ 90, Accessibility ≥ 95, SEO = 100; Core Web Vitals
   alan verisinde LCP < 2.5s, INP < 200ms, CLS < 0.1.
3. **Dört dilde tam içerik:** TR/EN/AR/RU dillerinde 34 sayfanın
   tamamı dolu; her sayfada karşılıklı `hreflang` ve `x-default`
   doğru kurulu; Arapça'da tam RTL desteği.
4. **Dönüşüm:** Her sayfada üç aksiyon her zaman bir tık uzakta —
   WhatsApp, tıkla-ara, randevu formu. Randevu formu gönderimi
   kliniğin e-postasına ulaşır ve kullanıcıya onay maili gider.
5. **Devredilebilirlik:** İçerik dosya tabanlı ve tek bir veri katmanı
   arkasında; ileride admin paneli eklendiğinde sayfa kodu
   değişmeden veri kaynağı değiştirilebilir.

## Core User Flow

1. Kullanıcı arama motorundan bir hizmet veya blog sayfasına düşer
   (dili tarayıcı/ülke tercihine göre `/tr`, `/en`, `/ar`, `/ru`
   altındadır).
2. Hizmetin ne olduğunu, kime uygulandığını, süreci ve sık sorulan
   soruları okur.
3. Sayfa içi CTA'lardan veya her zaman ekranda duran float
   butonlardan birini seçer: WhatsApp'tan yaz, hemen ara, ya da
   randevu formunu aç.
4. Randevu formunu doldurur (ad, telefon, e-posta, ilgilendiği
   hizmet, tercih ettiği tarih/saat aralığı, mesaj, KVKK onayı).
5. Form gönderilir; klinik e-posta kutusuna talep düşer, kullanıcıya
   otomatik onay maili gider, ekranda teşekkür durumu gösterilir.
6. Klinik hastayı telefonla arayarak randevuyu kesinleştirir.

## Features

### Sayfalar ve İçerik (34 tasarım)

- **Anasayfa:** hero, hakkımızda özeti, hizmet grid'i, "neden biz"
  üç sütun, 4 adımlı süreç, SSS akordeonu, randevu CTA bandı, son
  blog yazıları, footer bülten alanı.
- **Kurumsal:** Hakkımızda, Misyonumuz, Vizyonumuz, Kalite
  Politikamız.
- **Ekibimiz:** ekip listesi + kişi detay sayfaları (Melisa K.,
  Esra B.) ve Dr. Murat Irmak profili.
- **Hizmetler:** liste sayfası + 10 hizmet detay sayfası — Botoks &
  Dolgu, Bölgesel Zayıflama, Mezoterapi, Leke Tedavisi, Kupa
  Tedavisi (Hacamat), Tıbbi Sülük Tedavisi (Hirudoterapi),
  Hydrafacial Cilt Bakımı, Dermapen, Cilt Bakımı, **Ozon Tedavisi**
  (yeni — mevcut sitede detay sayfası yok, içerik anasayfa
  metinlerinden ve blog birikiminden üretilecek).
- **Blog:** liste (sayfalama + kategori filtresi) + 10 yazı detayı.
  Yazılar **orijinal yayın tarihleriyle** (2022) yayınlanır;
  JSON-LD'de `datePublished` orijinal tarih, `dateModified` içerik
  güncellendiğinde yenilenir. Tarih geriye çekilmez, uydurulmaz.
- **Galeriler:** Resim Galerisi (lightbox), Video Galerisi
  (YouTube gömme, tıklanana kadar yalnızca kapak görseli yüklenir).
- **Destek sayfaları:** Sık Sorulan Sorular, Randevu Al, İletişim
  (adres, harita, telefon, e-postalar, form).
- **Yasal:** KVKK Aydınlatma Metni, Gizlilik Politikası, Çerez
  Politikası (yeni; mevcut sitede yok, form toplama için gerekli).

### Dil

- Public site yalnızca Türkçe yayınlanır.
- URL'ler locale prefix kullanmaz; canonical yollar doğrudan
  `/hakkimizda`, `/hizmetler`, `/blog` gibi Türkçe route'lardır.
- Admin paneli `/manage` altında public route'lardan bağımsız çalışır.

### SEO

- Sayfa bazlı `generateMetadata`: benzersiz title, description,
  canonical, OG/Twitter kartları.
- Her sayfa için dört dile karşılıklı `hreflang` + `x-default`.
- JSON-LD şemaları: `MedicalClinic` / `LocalBusiness` (NAP, açılış
  saatleri, coğrafi konum), hizmetler için `MedicalProcedure`,
  bloglar için `BlogPosting` + `Author`, SSS için `FAQPage`,
  tüm iç sayfalarda `BreadcrumbList`.
- Dil bazlı `sitemap.xml` (hreflang alternate'leri dahil) ve
  `robots.txt`.
- Semantik başlık hiyerarşisi: sayfa başına tek `h1`, atlanmayan
  `h2`/`h3` zinciri, anahtar kelime başlıkta doğal biçimde geçer.
- **Görsel SEO (her görsel için zorunlu):**
  - Dosya adı anahtar kelimeli ve slug biçiminde
    (`halkali-botoks-uygulamasi.webp`, `IMG_2381.jpg` değil).
  - `alt` metni dile göre çevrilir, görseli gerçekten tarif eder ve
    sayfanın hedef anahtar kelimesini doğal biçimde içerir; boş,
    kopyala-yapıştır veya kelime yığını `alt` kabul edilmez.
  - Anlam taşıyan görsellerde `title`/`figcaption`, galeri
    öğelerinde `ImageObject` JSON-LD.
  - `next/image` ile AVIF/WebP, doğru `sizes`, LCP görselinde
    `priority`, geri kalanında lazy load.
  - Her sayfanın OG görseli benzersiz ve 1200×630.
- **Anahtar kelime haritası:** her sayfanın bir birincil, iki-üç
  ikincil anahtar kelimesi `content/` dosyasının frontmatter'ında
  tanımlıdır; title, h1, ilk paragraf, en az bir alt metni ve
  meta description bu haritaya göre yazılır. Aynı birincil kelime
  iki sayfaya verilmez (kanibalizasyon yasağı).
- **İç linkleme:** her hizmet sayfası ilgili bloglara, her blog
  ilgili hizmet sayfasına anlamlı anchor metniyle link verir.
- Eski URL'lerden yenilere kalıcı (301) yönlendirme haritası —
  mevcut sitedeki `sayfa-hakkimizda-1`, `hizmet-mezoterapi-27`,
  `blog-halkali-botoks-merkezi-29` gibi tüm adresler korunur.

### Dönüşüm ve İletişim

- Sabit float aksiyon butonları (mobil ve masaüstü): WhatsApp
  (`wa.me` + dile göre ön yazılmış mesaj) ve tıkla-ara (`tel:`).
- Header'da kalıcı "Randevu Al" butonu ve üst iletişim şeridi.
- Randevu formu ve iletişim formu → SMTP üzerinden klinik
  e-postasına gönderim + kullanıcıya otomatik onay maili.
- Spam koruması: honeypot alanı + sunucu tarafı rate limit +
  form şema doğrulaması.
- KVKK onay kutusu; onaysız form gönderilemez.

### İleriye Dönük Yuva (bu sürümde inşa edilmez)

- Tüm içerik okuması tek bir veri katmanı (`lib/content`) arkasından
  yapılır; bugün dosya sisteminden okur, yarın CMS/veritabanından
  okuyacak şekilde değiştirilebilir.
- `/admin` rotası için yer ayrılır ancak boş bırakılır.
- Form gönderimleri e-postanın yanında ileride bir kayıt deposuna
  yazılabilecek şekilde tek bir servis fonksiyonundan geçer.

## Scope

### In Scope

- Next.js App Router + TypeScript ile 34 sayfanın tasarıma sadık
  şekilde yeniden inşası.
- Dört dilde (TR/EN/AR/RU) tam içerik ve RTL desteği.
- Mevcut siteden içerik, görsel ve blog metinlerinin çekilip
  yapılandırılmış dosyalara aktarılması.
- Teknik SEO paketinin tamamı (metadata, hreflang, JSON-LD,
  sitemap, robots, 301 haritası).
- Randevu ve iletişim formları + SMTP e-posta gönderimi.
- Float WhatsApp / arama butonları.
- Resim ve video galerileri.
- Vercel üzerinde production dağıtımı ve `drmuratirmak.com`
  domaininin bağlanması (yayın doğrudan Vercel'den yapılacak).
- KVKK / gizlilik / çerez sayfaları ve çerez onay bandı.

### Out of Scope

- Çalışan admin paneli (yalnızca mimari yuva bırakılır).
- Kullanıcı hesabı, giriş, üyelik.
- Takvim üzerinden gerçek zamanlı randevu ayırtma, doktor takvimi
  senkronizasyonu, ödeme alma.
- E-ticaret, ürün satışı.
- Hasta verisi saklayan bir veritabanı (form yalnızca e-posta ile
  iletilir, sunucuda saklanmaz).
- Canlı destek/chat widget'ı entegrasyonu.
- Mevcut sitenin yorum sistemi (bloglardaki "0 Comments" alanı
  taşınmaz).

## Success Criteria

1. `/tr`, `/en`, `/ar`, `/ru` altında 34 sayfanın tamamı dolu
   içerikle açılıyor; Arapça sayfalar RTL olarak doğru görünüyor.
2. Herhangi bir sayfada dil değiştirici kullanıldığında kullanıcı
   aynı içeriğin diğer dildeki karşılığına gidiyor.
3. Randevu formu gönderildiğinde klinik e-postasına talep ulaşıyor
   ve kullanıcı onay maili alıyor; hatalı/eksik form sunucu
   tarafında reddediliyor.
4. Her sayfada benzersiz title/description, doğru canonical, dört
   dilli hreflang seti ve sayfa tipine uygun JSON-LD şeması
   üretiliyor; Rich Results Test hatasız geçiyor.
5. `sitemap.xml` dört dildeki tüm URL'leri alternate'leriyle
   listeliyor; `robots.txt` sitemap'i işaret ediyor.
6. Eski sitedeki her URL, yeni karşılığına 301 ile yönleniyor
   (yönlendirme haritası test edilmiş).
7. Mobil Lighthouse: Performance ≥ 90, Accessibility ≥ 95,
   Best Practices ≥ 95, SEO = 100.
8. WhatsApp ve arama butonları her sayfada, her breakpoint'te
   erişilebilir ve doğru numaraya gidiyor.
9. Sitedeki hiçbir görsel boş veya genel `alt` ile yayınlanmıyor;
   dosya adları slug biçiminde ve anahtar kelimeli.
10. Her sayfanın frontmatter'ında birincil anahtar kelimesi tanımlı
    ve hiçbir birincil kelime iki sayfada tekrarlanmıyor.
11. `npm run build` uyarısız tamamlanıyor; TypeScript strict modda
    hata yok.

## Reference Data (mevcut siteden doğrulandı)

- **Klinik:** Dr. Murat Irmak Kliniği — Medikal Estetik &
  Tamamlayıcı Tıp. Celal Bayar Üniversitesi Tıp Fakültesi mezunu.
- **Adres:** Halkalı Merkez Mah. 1. İkitelli Cad. No: 2, Meydan
  Halkalı Rezidans A Blok Kat: 1/23, Küçükçekmece / İstanbul 34303.
- **Telefon / WhatsApp:** 0542 188 30 34
- **E-posta:** bilgi@drmuratirmak.com (birincil),
  arge@drmuratirmak.com, satis@drmuratirmak.com
- **Sosyal:** instagram.com/dr.muratirmak
- **Mevcut domain:** https://www.drmuratirmak.com

## Resolved Decisions

- **Ozon Tedavisi** 10. hizmet olarak eklenir.
- Blog yazıları **orijinal tarihleriyle** yayınlanır.
- Yayın **Vercel** üzerinden, doğrudan `drmuratirmak.com` domainine.
- SEO en yüksek öncelik: görsel `alt` metinleri, dosya adları ve
  sayfa başına anahtar kelime haritası dahil.
- İçerik dosya tabanlı (MDX/JSON) + `lib/content` adaptörü.
- Tüm diller URL prefix'li, `tr` varsayılan.
- Mail gönderimi Nodemailer + mevcut SMTP.

## Open Questions

1. **PRP** ve **H100 Gençlik Aşısı** (blog var, hizmet sayfası yok)
   ayrı hizmet sayfası olacak mı, yoksa mevcut hizmetlerin içinde
   mi anlatılacak?
2. Ekip sayfasında iki kişi var (Melisa K., Esra B.) — tam ad,
   unvan ve fotoğrafları mevcut mu?
3. Google Business Profile, Search Console ve Analytics
   erişimleri kimde? (Domain doğrulaması ve 301 sonrası pozisyon
   takibi için gerekli.)
4. SMTP bilgileri (host, port, kullanıcı, şifre) — **beklemede**,
   form katmanı env değişkenleriyle soyutlanarak yazılacak, bilgi
   gelince yalnızca `.env` doldurulacak.
5. Mevcut sitedeki görsellerin telif/kaynak durumu — stok görsel
   mi, kliniğe ait mi? (Yeni dosya adı ve `alt` yazımında
   kullanılacak.)
