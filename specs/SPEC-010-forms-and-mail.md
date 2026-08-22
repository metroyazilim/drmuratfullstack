# SPEC-010 — Formlar ve mail

**Faz:** 2 — Sayfalar (son)
**Bağımlılık:** SPEC-009
**Sonraki:** SPEC-011 (İçerik doldurma)

## Goal

`12_Randevu_Al.pdf` ve `13_Iletisim.pdf` tasarımlarını inşa etmek
ve sitenin **tek yazma yolunu** kurmak: iki form, tek Server
Action hattı, SMTP üzerinden mail gönderimi.

Bu spec bittiğinde site işlevsel olarak tamamlanmış olur —
kullanıcı randevu talebi bırakabilir ve klinik bu talebi
e-posta olarak alır.

## Context

- Tasarım: `12_Randevu_Al.pdf`, `13_Iletisim.pdf` (incelendi).
- `context/architecture.md` → Auth and Access Model, Storage Model,
  Invariant 6, 7, 10, 13, 14.
- `context/code-standards.md` → Server Actions ve Formlar, Mail,
  Erişilebilirlik.
- `context/ui-context.md` → Forms bölümü.

## Scope

- `listing/appointment` ve `listing/contact` içeriği (dört dilde).
- Randevu sayfası ve iletişim sayfası.
- `lib/schemas/` — zod şemaları (istemci + sunucu ortak).
- `actions/` — iki Server Action.
- `lib/mail/` — Nodemailer transport + dört mail şablonu.
- Upstash Redis oran sınırı (graceful degradation ile).
- Honeypot + minimum doldurma süresi.
- KVKK onay kutusu (**her iki formda**).
- Başarı/hata durumları ve erişilebilir hata duyurusu.
- Harita facade'ı (iletişim sayfası).
- Çerez bilgilendirme bandı.
- Footer bülten formunun etkinleştirilmesi **değil** — aşağıda.

## Out of Scope

- Gerçek SMTP bilgileri — SPEC-012. Katman env ile soyutlanır;
  bilgi gelince yalnızca `.env` doldurulur.
- Takvim entegrasyonu, gerçek zamanlı slot seçimi —
  `project-overview.md` → Out of Scope.
- Form verisinin veritabanına yazılması — mimari karar: hasta
  verisi saklanmıyor.
- **Bülten formu** — kapsam dışı bırakılıyor, gerekçesi aşağıda.

## Tasarımdan üç sapma (gerekçeli)

**1. İletişim formuna da KVKK onayı eklenecek.**
Tasarımda yalnızca randevu formunda onay kutusu var. İletişim
formu da ad, e-posta ve telefon topluyor — yani kişisel veri
işliyor. Onay kutusu olmadan yayınlamak KVKK açısından
savunulamaz. Eklenir.

**2. "İlgilendiğiniz Hizmet" serbest metin değil, açılır liste
olacak.**
Tasarımda düz metin kutusu. Hizmet listesi zaten `lib/content`'te
duruyor; serbest metin hem veri kalitesini düşürür (yazım
hataları, boş bırakma) hem de kliniğin talebi sınıflandırmasını
zorlaştırır. `listServices(locale)` ile doldurulan bir `select` +
"Diğer" seçeneği kullanılır.

**3. Tasarımdaki uyarı notu yayına ÇIKMAYACAK.**
Form butonunun altında şu metin duruyor: *"Bu ekran statik tasarım
gösterimidir. Gerçek sitede form verileri güvenli backend
üzerinden yönetilmelidir."* Bu, tasarımcının kendi notudur —
site metni değil. İçeriğe kopyalanmaz.

## Bülten formu kararı

SPEC-005'te footer'a görsel olarak eklenmiş ve `disabled`
bırakılmıştı. Bu spec'te **etkinleştirilmiyor** ve `disabled`
kalıyor.

Gerekçe: çalışan bir bülten, abone listesi tutmayı (veri
saklama), çift onay (double opt-in) akışını ve abonelikten çıkma
bağlantısını gerektirir. Bunların hiçbiri `project-overview.md`
kapsamında değil ve "veri saklamıyoruz" mimari kararıyla
çelişir. Yarım kurulmuş bir bülten, KVKK açısından tam kurulmamış
bir bültenden kötüdür.

`progress-tracker.md`'ye açık iş olarak yazılır: ya tam kurulur
ya footer'dan kaldırılır. Karar kliniğe aittir.

## Implementation

### 1. Sayfa içeriği

`content/listing/appointment/{locale}.json` ve
`content/listing/contact/{locale}.json` — `listingBaseSchema`
üzerine:

```ts
appointment: + {
  info: { eyebrow, title, description },   // sol koyu kart
  form: { eyebrow, title, submitLabel },
  process: { eyebrow, title, steps[4] }    // "Talebinizden randevuya"
}
contact: + {
  info: { eyebrow, title },
  form: { eyebrow, title, submitLabel },
  map: { label }                            // harita üzerindeki adres etiketi
}
```

Telefon, e-posta ve adres **`clinic.json`'dan** gelir; içeriğe
kopyalanmaz.

### 2. Şemalar — `lib/schemas/`

Tek kaynak; istemcide `react-hook-form` resolver'ı, sunucuda
Server Action doğrulaması aynı şemayı kullanır.

```ts
appointmentSchema = {
  fullName: string, 2–80
  phone:    string, TR ve uluslararası formatı kabul eden regex
  email:    email
  preferredDate: ISO tarih, bugünden önce olamaz, opsiyonel
  serviceId: services listesindeki id veya 'other'
  message:  string, 0–2000, opsiyonel
  consent:  literal(true)          // KVKK
  website:  string, boş olmalı     // honeypot
  startedAt: number                // form açılış zaman damgası
}

contactSchema = { fullName, email, phone, message (10–2000),
                  consent, website, startedAt }
```

Hata mesajları şemada **anahtar** olarak tutulur (`errors.phone`),
metin olarak değil — dört dilde `messages` üzerinden çevrilir.

### 3. Server Action akışı — `actions/`

Sıra sabittir (`code-standards.md`):

1. **Doğrula** — `schema.safeParse`. Başarısızsa `fieldErrors`
   ile dön; hiçbir yan etki tetiklenmez.
2. **Honeypot** — `website` doluysa **başarılı gibi dön** ama
   hiçbir şey gönderme. Bota hata göstermek, botun kendini
   düzeltmesine yardım eder.
3. **Süre kontrolü** — `Date.now() - startedAt < 3000ms` ise bot
   kabul edilir; aynı sessiz davranış.
4. **Oran sınırı** — Upstash: IP hash'i başına saat başı 5
   gönderim. **Redis erişilemezse sınır atlanır ve olay loglanır**
   (`architecture.md` → Invariant 14): altyapı arızası hastanın
   randevu talebini düşürmez.
5. **Mail gönder** — klinik maili + kullanıcı onay maili.
6. **Sonuç dön** — `{ ok: true } | { ok: false, error, fieldErrors? }`.

Dönüş şekli sabit; istemci `error` koduna göre `messages`'tan
çevrilmiş metni gösterir. Sunucudan kullanıcıya ham hata metni
(SMTP çıktısı, stack trace) **sızmaz**.

### 4. Mail — `lib/mail/`

- Nodemailer transport modül seviyesinde bir kez kurulur.
- Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`,
  `SMTP_FROM`, `MAIL_TO`. Hiçbiri `NEXT_PUBLIC_` değildir.
- **SMTP env eksikse** (bugünkü durum): action `mail_failed`
  döner ve sunucuda net bir uyarı loglanır. Build kırılmaz,
  sayfa çalışır, form denendiğinde anlaşılır bir hata verir.
  Sessizce "gönderildi" demek yasak.
- İki mail:
  - **Kliniğe**: talep detayları, `replyTo` kullanıcının
    e-postası (klinik doğrudan yanıtlayabilsin).
  - **Kullanıcıya**: onay maili — talebin alındığı, kliniğin
    arayacağı, acil durumda telefon numarası.
- Kullanıcı maili gönderilemezse **akış başarılı sayılır**:
  klinik maili gitmişse talep kaybolmamıştır.
- Her mail HTML + düz metin.
- Kullanıcı girdisi HTML gövdeye **kaçışlanarak** yazılır.

### 5. Randevu sayfası — `/[locale]/randevu-al`

1. `PageBanner`.
2. İki sütun:
   - Sol: `--bg-inverse` zeminli kart — eyebrow, `h2`, açıklama,
     TELEFON / E-POSTA / ADRES blokları (`clinic.json`).
   - Sağ: `--bg-tint` zeminli kart — eyebrow, `h2`, form.
3. `--bg-surface` zeminli "Talebinizden randevuya" bölümü —
   4 numaralı kart (`ApproachSection` düzeni yeniden kullanılır).

**Form alanları:** Ad Soyad, Telefon, E-posta, Tercih Edilen
Tarih, İlgilendiğiniz Hizmet (select), Mesajınız, KVKK onayı,
gönder butonu.

### 6. İletişim sayfası — `/[locale]/iletisim`

1. `PageBanner`.
2. İki sütun: sol koyu iletişim kartı (adres, telefon, üç
   e-posta), sağ açık mavi form kartı.
3. `--bg-surface` zeminli harita bölümü.

**Harita facade:** Gömülü Google Maps iframe'i üçüncü parti
çerez düşürür ve LCP'yi bozar — video facade'ıyla aynı gerekçe.
Yerine statik bir harita görseli + adres etiketi + "Yol tarifi
al" butonu (Google Maps'e `target="_blank" rel="noopener"`).
Tıklamayla dış siteye gidilir; sayfada üçüncü parti istek olmaz.

### 7. Form bileşenleri

`components/ui/` altına: `Input`, `Textarea`, `Select`,
`Checkbox`, `FormField`, `FormMessage`. shadcn CLI ile eklenip
`ui-context.md` → Forms'a göre uyarlanır.

Erişilebilirlik (`code-standards.md`):
- Her alan `<label>` ile bağlı; placeholder etiket yerine geçmez.
- Hata `aria-describedby` ile alana bağlı, `role="alert"`.
- Zorunlu alanlar `*` ve form başında açıklama.
- Gönderim sırasında buton `disabled` + durum göstergesi;
  çift gönderim engellenir.
- Başarı durumu `role="status"` ile duyurulur ve odak oraya taşınır.
- Honeypot alanı `aria-hidden` + `tabIndex={-1}` + görsel olarak
  gizli (ama `display:none` değil — bazı botlar onu atlar).

### 8. Çerez bilgilendirme bandı

**Onay kapısı değil, bilgilendirme bandı.** Gerekçe: site şu an
yalnızca işlevsel çerez kullanıyor (next-intl'in dil tercihi).
İzleme çerezi yok; SPEC-012'de eklenecek Vercel Analytics de
çerezsiz. İşlevsel çerez için onay kapısı koymak, gereksiz bir
sürtünme ve yanlış bir yasal sinyal olur.

Band: kısa metin + çerez politikası bağlantısı + "Anladım"
butonu. Tercih `localStorage`'da tutulur. SPEC-012'de izleme
eklenirse **onay kapısına yükseltilir** — bu not spec'te kalır.

## Acceptance

1. Randevu ve iletişim sayfaları dört dilde açılıyor.
2. Geçerli randevu formu gönderildiğinde klinik maili ve
   kullanıcı onay maili gidiyor (SMTP tanımlıyken).
3. SMTP env tanımsızken form `mail_failed` döndürüyor, kullanıcıya
   anlaşılır mesaj gösteriliyor ve **"gönderildi" denmiyor**.
4. Geçersiz form sunucuda reddediliyor; istemci doğrulaması
   devre dışı bırakılsa bile action veri işlemiyor.
5. KVKK onayı işaretlenmeden gönderim mümkün değil — **her iki
   formda**.
6. Honeypot dolu veya 3 saniyeden hızlı gönderimde kullanıcıya
   başarı görünüyor ama mail gitmiyor.
7. Oran sınırı aşımında `rate_limit` dönüyor; Redis kapalıyken
   form **çalışmaya devam ediyor**.
8. Hata mesajları dört dilde çevrilmiş; sunucudan ham hata metni
   sızmıyor.
9. Klinik mailinde `replyTo` kullanıcının e-postası.
10. Hizmet seçimi `listServices` ile dolduruluyor ve dile göre
    değişiyor.
11. İletişim sayfasında üçüncü parti harita isteği **yok**.
12. Çerez bandı bir kez gösteriliyor, "Anladım" sonrası
    tekrarlamıyor.
13. Tasarımdaki "statik tasarım gösterimidir" notu sitede
    **bulunmuyor**.
14. Klavye ile form doldurulabiliyor; hata ve başarı ekran
    okuyucuya duyuruluyor.
15. `npm run check` temiz geçiyor.

## Notes

- **Bu spec sitenin tek yazma yolunu açıyor.** Bugüne kadar tüm
  yüzey salt okunurdu; buradan sonra bir saldırı yüzeyi var.
  Doğrulama → honeypot → süre → oran sınırı sırası pazarlık
  konusu değil.
- Honeypot'a yakalanan gönderime **başarı göstermek** bilinçli:
  hata gösterirsek bot alanı boş bırakmayı öğrenir.
- Redis arızasında sınırı atlamak da bilinçli: bir hasta randevu
  talebini kaybetmektense birkaç spam maili almak yeğdir.
- SMTP bilgileri gelmeden bu spec **tam olarak doğrulanamaz**.
  Kabul kriteri 2, SPEC-012'de gerçek bilgilerle tekrar
  koşulacak; o zamana kadar kriter 3 (env yokken doğru davranış)
  geçerli testtir.
- Bülten formu kararı kliniğe sorulmalı: tam kurulsun mu, yoksa
  footer'dan kaldırılsın mı?
