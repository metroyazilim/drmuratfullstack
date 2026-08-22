# AI Workflow Rules

## Approach

Bu proje spec-driven bir akışla, parça parça inşa edilir. Ne
yapılacağını `project-overview.md`, nasıl yapılacağını
`architecture.md` + `code-standards.md` + `ui-context.md`, nerede
kalındığını `progress-tracker.md` tanımlar. Kod daima bu dosyalara
karşı yazılır — davranış sıfırdan uydurulmaz.

Bu bir **yeniden inşa** projesidir, sıfırdan tasarım değil. İki
referans bağlayıcıdır:

1. `Dr_Murat_Irmak_Folixa_Redesign_34_PDF/` altındaki 34 tasarım —
   görsel doğruluk kaynağı.
2. Mevcut `drmuratirmak.com` içeriği — metin ve bilgi kaynağı.

İkisi çelişirse tasarım layout'u, mevcut site ise içeriği belirler.

## Scoping Rules

- Aynı anda tek bir iş birimi üzerinde çalışılır.
- Küçük ve doğrulanabilir adımlar, büyük spekülatif değişikliklere
  tercih edilir.
- Bir adım uçtan uca hızlıca doğrulanamıyorsa kapsam geniştir —
  bölünür.
- Bir sayfa tipi (hizmet detayı gibi) bir iş birimidir; o tipin
  tüm örneklerini tek seferde doldurmak ayrı bir iş birimidir.

## When to Split Work

Bir adım şu ikilileri birleştiriyorsa bölünür:

- Yeni bir bileşen/layout inşası **ve** içerik doldurma.
- Birden fazla sayfa tipi (örn. hizmet detayı + blog detayı).
- Altyapı kurulumu (i18n, SEO katmanı, mail) **ve** sayfa yapımı.
- İçerik çevirisi **ve** kod değişikliği.
- Context dosyalarında net tanımlanmamış bir davranış.

## Handling Missing Requirements

- Context dosyalarında tanımlı olmayan ürün davranışı uydurulmaz.
- Belirsiz bir gereksinim varsa önce ilgili context dosyasında
  netleştirilir, sonra uygulanır.
- Eksik bir gereksinim varsa `progress-tracker.md` içindeki
  **Open Questions** bölümüne yazılır ve o kısım atlanarak devam
  edilir; tahminle doldurulmaz.

## İçerik Kuralları (bu proje için kritik)

- **Tıbbi içerik uydurulmaz.** Bir hizmet veya blog metni ya mevcut
  siteden alınır, ya kullanıcı tarafından sağlanır. Fiyat, süre,
  başarı oranı, iyileşme süresi gibi sayısal iddialar kaynağı
  olmadan yazılmaz.
- Ozon Tedavisi gibi yeni sayfaların metni taslak olarak üretilir
  ve `progress-tracker.md`'de **hekim onayı bekliyor** olarak
  işaretlenir; onaysız yayına alınmaz.
- Sağlık iddiaları koşullu dille yazılır ("hedeflenir",
  "değerlendirilir"), garanti dili kullanılmaz.
- Her hizmet ve blog sayfası tıbbi sorumluluk reddi kutusu ile
  biter (bkz. `ui-context.md`).
- Çeviri yapılırken tıbbi terimler birebir uydurulmaz; karşılığı
  bilinmiyorsa Latin terim parantez içinde bırakılır ve gözden
  geçirme listesine eklenir.

## SEO Kuralları

- Yeni bir sayfa eklenirken `primaryKeyword` atanır ve mevcut
  sayfalarla çakışmadığı kontrol edilir.
- Görsel eklenirken dosya adı slug'lanır ve dört dilde `alt` metni
  yazılır — biri eksikse iş bitmiş sayılmaz.
- URL değişirse `legacy-redirects.ts` aynı adımda güncellenir.
- Metadata veya JSON-LD `lib/seo` dışında yazılmaz.

## Protected Files

Açıkça talimat verilmedikçe değiştirilmez:

- `components/ui/*` — shadcn üretimi bileşenler (yalnızca token
  uyarlaması için, bir kez).
- `Dr_Murat_Irmak_Folixa_Redesign_34_PDF/` — tasarım kaynakları.
- `content/**` içindeki `publishedAt` alanları.
- `.env` ve Vercel ortam değişkenleri.

## Keeping Docs in Sync

Uygulama değiştiğinde ilgili context dosyası aynı commit içinde
güncellenir:

- Sistem sınırı, klasör sorumluluğu veya bağımlılık değişimi →
  `architecture.md`
- Yeni konvansiyon veya kural → `code-standards.md`
- Yeni token, bileşen veya layout deseni → `ui-context.md`
- Kapsam, sayfa listesi veya başarı ölçütü değişimi →
  `project-overview.md`
- Her iş birimi sonunda → `progress-tracker.md`

## Before Moving to the Next Unit

1. İş birimi kendi kapsamı içinde uçtan uca çalışıyor.
2. `architecture.md`'deki hiçbir invariant ihlal edilmedi.
3. Dört dilde de içerik/etiket eksiği yok.
4. Sayfa tek `h1` taşıyor, tüm görsellerde anlamlı `alt` var.
5. `npm run build`, `npm run lint` ve `npx tsc --noEmit` temiz.
6. `progress-tracker.md` yapılan işi yansıtıyor.
