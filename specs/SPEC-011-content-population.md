# SPEC-011 — İçerik doldurma (dört dil)

**Faz:** 3 — İçerik ve yayın
**Bağımlılık:** SPEC-010
**Sonraki:** SPEC-012 (Yayın ve denetim)

## Goal

Şablonları gerçek içerikle doldurmak: 10 hizmet, 10 blog yazısı,
2 yasal metin, SSS ve galerilerin tamamlanması, tüm yer tutucu
görsellerin gerçekleriyle değiştirilmesi ve EN/AR/RU çevirileri.

Bu spec **kod yazmaz** — şablonlar SPEC-006 → SPEC-010'da
tamamlandı. Buradan sonra eklenen her şey `content/` ve
`public/images/` altındadır.

Bitiş ölçüsü nettir: `validate-seo.ts` içindeki `PENDING_CONTENT`
listesi **boşalır** ve hiçbir görselin üzerinde
"PLACEHOLDER — SPEC-011" yazmaz.

## Mevcut durum

| Tip | Var | Gereken | Eksik |
| --- | --- | --- | --- |
| Hizmet | 1 | 10 | **9** |
| Blog | 1 | 10 | **9** |
| Ekip | 3 | 3 | — |
| Kurumsal sayfa | 4 | 4 | — |
| Yasal | 1 (KVKK) | 3 | **2** |
| SSS | 3 | 8 | **5** |
| Galeri görseli | 3 | 9 | **6** |
| Video | 1 | 4 | **3** |
| Görsel dosyası | 52 yer tutucu | 52 gerçek | **52** |

## Kaynaklar

1. **Canlı site** (`drmuratirmak.com`) — TR metinlerin birincil
   kaynağı. 10 hizmet ve 10 blog yazısının tamamı orada.
2. **Tasarım PDF'leri** — bölüm başlıkları, kart etiketleri,
   özellik kartları ve SSS soruları.
3. **Klinik** — Ozon Tedavisi metni, çalışma saatleri, gerçek
   video kimlikleri, yasal metinler.

### Eski sitedeki görseller

`trex/assets/img/` altında **27 gerçek fotoğraf** var
(`genel/`, `hizmetler/`, `blog/`). Örneklenen boyutlar
1024×576 – 2193×567 arası; hero ve kart kullanımına yeterli.

Dosya adları anlamsız sayılardan oluşuyor
(`2053424979.jpg`) — `code-standards.md` → Görseller'in açıkça
yasakladığı biçim. İndirilirken **slug'lanmış, anahtar kelimeli**
adlara çevrilecekler.

**Telif durumu açık soru.** Bu fotoğrafların kliniğe mi ait
olduğu yoksa stok mu olduğu bilinmiyor
(`progress-tracker.md` → Open Questions). Klinik doğrulayana
kadar yalnızca **kliniğin kendi sitesinde hâlihazırda yayında
olan** görseller kullanılır; yeni stok görsel satın alınmaz veya
başka kaynaktan alınmaz.

## Scope

- 9 hizmet içeriği × 4 dil = 36 MDX.
- 9 blog yazısı × 4 dil = 36 MDX.
- 2 yasal metin × 4 dil = 8 MDX.
- SSS'nin 8 soruya çıkarılması × 4 dil.
- Galeri 9 görsele, video 4 kayda çıkarılması.
- 27 görselin indirilip slug'lanması, WebP'ye dönüştürülmesi ve
  yeniden boyutlandırılması.
- Eksik görseller için üretim/temin.
- Dört dilde `alt` metinleri.
- Anahtar kelime haritasının tamamlanması.
- İç linkleme (`relatedPosts` / `relatedServices`).
- `PENDING_CONTENT` listesinin boşaltılması.

## Out of Scope

- Şablon veya bileşen değişikliği. İçerik şablona uymuyorsa
  **spec güncellenir**, şablon geçici olarak esnetilmez.
- Search Console, Analytics, canlı denetim — SPEC-012.
- Yeni sayfa tipi.

## Çalışma sırası

Sıra önemlidir: görseller önce gelir, çünkü içerik şeması var
olmayan bir görsel yoluna izin vermiyor (`content:check`
0 byte ve eksik dosya kontrolleri).

### Adım 1 — Görsel hattı

1. Eski sitedeki 27 görsel indirilir.
2. Her biri hedefine göre yeniden adlandırılır:
   `{konu-slug}-{rol}.webp` →
   `mezoterapi-hero.webp`, `botoks-dolgu-card.webp`,
   `klinik-uygulama-odasi.webp`.
3. WebP'ye dönüştürülür, rol bazlı boyuta indirilir:
   hero 1600×900, kart 800×600, OG 1200×630, galeri 1200×900,
   ekip 800×800.
4. `public/images/{services,blog,team,gallery,og,pages,legal}/`
   altına yerleştirilir.
5. Eksik kalan görseller listelenir ve klinikten istenir.
   **Yer tutucu bırakılmaz** — eksikse o sayfa yayına girmez.

OG görselleri: her sayfa için benzersiz olmalı
(`project-overview.md`). Fotoğraf yoksa, marka şablonu üzerine
sayfa başlığı basılarak üretilir — bu bir yer tutucu değil,
kasıtlı bir marka görselidir.

### Adım 2 — TR içerik aktarımı

Canlı siteden 9 hizmet ve 9 blog yazısı çekilir.

**Aktarım kuralları:**

- Metin **birebir kopyalanmaz**; okunabilirlik için düzenlenir
  (paragraf bölme, `h2` başlıklandırma, liste yapısı). Bilgi
  içeriği korunur.
- Eski sitedeki yazım hataları düzeltilir
  (`hacamat-kupa-tedavisi-istabul` → `...istanbul` gibi).
- **Tıbbi iddia eklenmez.** Kaynakta olmayan bir etki, süre,
  başarı oranı veya fiyat yazılmaz
  (`ai-workflow-rules.md`).
- Blog `publishedAt` → canlı sitedeki **orijinal tarih**
  (2022-05-26 vb.), `updatedAt` → aktarım tarihi.
- Her hizmete `features` (2–4 madde), `cardTags` (2–3 etiket),
  `order` yazılır.
- Her sayfaya `primaryKeyword` atanır ve **çakışmadığı**
  doğrulanır (kapı zaten kontrol ediyor).

**Ozon Tedavisi** yeni sayfadır; metni anasayfa slider'ındaki
klinik metninden ve mevcut blog birikiminden taslaklanır ve
`progress-tracker.md`'de **hekim onayı bekliyor** olarak
işaretlenir. Onaysız yayına alınmaz.

### Adım 3 — SSS ve galeriler

- SSS 8 soruya çıkarılır; sorular `11_Sik_Sorulan_Sorular.pdf`
  tasarımından alınır, cevaplar klinik metinlerinden.
- Galeri 9 kayda çıkarılır; `span` alanıyla tasarımdaki değişken
  karo düzeni kurulur.
- Video 4 kayda çıkarılır. **Şu anki `dQw4w9WgXcQ` kimliği
  kaldırılmalı** — bu bilinen bir şaka videosudur ve yayına
  giderse itibar kaybıdır. Gerçek kimlikler klinikten alınır;
  gelmezse video galerisi menüden ve sitemap'ten çıkarılır.

### Adım 4 — Yasal metinler

`privacy` ve `cookies` sayfaları yazılır.

**Bunlar hukuki metindir ve uydurulmaz.** Klinikten mevcut
metin istenir; yoksa taslak hazırlanıp **hukuk onayına**
gönderilir. Onay gelmeden yayına alınmaz; o zamana kadar footer
yalnızca KVKK'yı gösterir (mevcut davranış zaten böyle).

### Adım 5 — Çeviriler (EN / AR / RU)

TR içerik tamamlandıktan **sonra** başlar; kaynak değişirse
çeviri boşa gider.

- Çeviri anlamı korur; kelime kelime çevrilmez.
- **Tıbbi terimler uydurulmaz.** Karşılığı bilinmiyorsa Latin
  terim parantez içinde bırakılır ve gözden geçirme listesine
  eklenir (`ai-workflow-rules.md`).
- Slug'lar: AR ana dilde, RU Latin transliterasyonla
  (`architecture.md` → Routing Model).
- `description` her dilde 120–165 karakter; birleşik `<title>`
  60 karakteri aşmamalı (`seo:check` uyarı veriyor).
- `alt` metinleri dört dilde ayrı yazılır — çeviri değil,
  o dildeki doğal tarif.
- Anahtar kelimeler her dil için ayrı seçilir; TR anahtar
  kelimenin çevirisi o dilde aranan kelime olmayabilir.

### Adım 6 — İç linkleme ve kapatma

- Her hizmet en az bir ilgili bloga, her blog en az bir ilgili
  hizmete bağlanır (`project-overview.md` → İç linkleme).
- `PENDING_CONTENT` listesi boşaltılır.
- Anasayfada öne çıkacak 6 hizmet `order` ile belirlenir —
  bu bir **içerik kararıdır**, klinikle netleştirilir.

## Acceptance

1. `content/services/` 10, `content/blog/` 10, `content/legal/` 3
   varlık içeriyor; her klasörde dört dil dosyası var.
2. `npm run content:check` temiz — eksik çeviri, kısa
   `description`, çakışan anahtar kelime, kırık ilişki,
   0 byte veya eksik görsel yok.
3. `npm run seo:check` **uyarısız** geçiyor;
   `PENDING_CONTENT` listesi boş.
4. 31 eski URL'in tamamı 200 dönen bir hedefe gidiyor.
5. `grep -r "PLACEHOLDER" public/images` sonuç döndürmüyor;
   hiçbir görselde damga kalmamış.
6. Hiçbir görsel dosya adı sayısal değil; hepsi slug biçiminde.
7. Her görselin dört dilde `alt` metni var ve hiçbiri boş.
8. Blog yazılarının `datePublished` değerleri canlı sitedeki
   orijinal tarihlerle birebir aynı.
9. `dQw4w9WgXcQ` kimliği hiçbir yerde geçmiyor.
10. Ozon Tedavisi ve yasal metinler onay durumu
    `progress-tracker.md`'de işaretli; onaysız metin yayında
    değil.
11. Her hizmet ve blog sayfasında tıbbi uyarı kutusu görünüyor.
12. Sitemap ~140 URL içeriyor.
13. `npm run check` temiz geçiyor.

## Notes

- **Bu spec'in riski hacimde.** 34 sayfa × 4 dil = 136 içerik
  dosyası. Kapılar (`content:check`, `seo:check`) tam da bu
  yüzden SPEC-003 ve SPEC-004'te kuruldu; burada onlara
  güvenilecek ve **kapı kırmızıyken devam edilmeyecek**.
- Sıra bozulmamalı: görsel → TR içerik → SSS/galeri → yasal →
  çeviri. Çeviriye TR bitmeden başlamak, kaynak değiştiğinde
  dört kat iş demektir.
- **Şablon esnetilmez.** İçerik şablona uymuyorsa bu bir tasarım
  bulgusudur; ilgili spec güncellenir ve şablon değişir. İçeriği
  şablona sığdırmak için kural gevşetmek, o kuralı kalıcı olarak
  değersizleştirir.
- Türkçe metinlerde kesme işareti (`Kliniği'nde`) YAML'ı kırar;
  kapı ipucu veriyor ama yazarken baştan iki kesme işareti
  kullanmak zaman kazandırır.
- Görsel telifi ve çalışma saatleri hâlâ açık; ikisi de bu
  spec'i tam kapatmak için gerekli.
