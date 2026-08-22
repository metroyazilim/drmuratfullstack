# UI Context

## Theme

Tek tema: **açık (light)**. Karanlık mod yoktur ve eklenmez.

Görsel dil klinik ve sakin: geniş beyaz alan, yumuşak gri ve çok
açık mavi bölüm zeminleri, ince gri kenarlıklar, gölge yerine
kenarlık ile ayrılan kartlar. Vurgu tek bir canlı maviden gelir;
onun dışında renk kullanılmaz. Koyu, neredeyse siyah bir ton
(üst şerit, CTA bandı, footer) sayfayı üç yerde çerçeveler.
Fotoğraflar büyük, yuvarlatılmış köşeli ve koyu overlay üzerine
beyaz metinle kullanılır.

Tüm değerler tasarım PDF'lerinden piksel örneklemesiyle
çıkarılmıştır; bileşenlerde bu token'lar dışında renk kullanılmaz.

## Colors

| Role                  | CSS Variable       | Value                 | Kullanım                                     |
| --------------------- | ------------------ | --------------------- | -------------------------------------------- |
| Sayfa zemini          | `--bg-base`        | `#FFFFFF`             | Varsayılan sayfa ve kart zemini              |
| Gri bölüm zemini      | `--bg-surface`     | `#F6F7F9`             | Hizmetler grid'i gibi ayrışan bölümler       |
| Mavi bölüm zemini     | `--bg-tint`        | `#F1F5FE`             | Süreç adımları, bilgi kutusu zemini          |
| Yumuşak mavi çip      | `--accent-soft`    | `#ECF2FE`             | İkon çipleri, rozet arka planı               |
| Koyu zemin            | `--bg-inverse`     | `#141615`             | Üst şerit, CTA bandı, footer                 |
| Birincil metin        | `--text-primary`   | `#141615`             | Başlıklar ve gövde metni                     |
| İkincil metin         | `--text-muted`     | `#5D6162`             | Açıklama, breadcrumb, footer metni           |
| Koyu zemin üstü metin | `--text-inverse`   | `#FFFFFF`             | Footer ve overlay metinleri                  |
| Birincil vurgu        | `--accent-primary` | `#3372E6`             | Butonlar, linkler, aktif durumlar, etiketler |
| Vurgu (hover)         | `--accent-hover`   | `#2A5FC4`             | Buton hover / aktif                          |
| Kenarlık              | `--border-default` | `#E3E6EB`             | Kart, input, ayırıcı çizgiler                |
| Koyu zemin kenarlığı  | `--border-inverse` | `#2A2C2B`             | Footer içi ayırıcılar                        |
| Hata                  | `--state-error`    | `#D92D20`             | Form hata metni ve kenarlığı                 |
| Başarı                | `--state-success`  | `#12805C`             | Form başarı durumu                           |
| Görsel overlay        | `--overlay-image`  | `rgba(20,22,21,0.55)` | Hero ve CTA bandı fotoğraf overlay'i         |

Kural: `--accent-primary` dışında hiçbir doygun renk sayfaya
girmez. Renkli görünen her şey ya fotoğraftır ya da bu token'dır.

## Typography

| Role             | Font                 | Variable        |
| ---------------- | -------------------- | --------------- |
| Latin (TR/EN/RU) | Inter Variable       | `--font-sans`   |
| Arapça (AR)      | IBM Plex Sans Arabic | `--font-arabic` |

- Fontlar `next/font` ile yerel olarak yüklenir; Google Fonts'a
  çalışma zamanı isteği yapılmaz. `display: swap` açıktır.
- Inter Kiril alfabesini kapsar; Rusça için ayrı font yüklenmez.
- Arapça locale'de `html` üzerine `--font-arabic` uygulanır.
- Latin dillerde başlıklarda `letter-spacing: -0.02em`; Arapça'da
  negatif letter-spacing **uygulanmaz** (harf bağlarını bozar).

### Ölçek

| Rol                       | Boyut / satır                                       | Ağırlık |
| ------------------------- | --------------------------------------------------- | ------- |
| Hero başlık (h1)          | `clamp(2rem, 4vw, 3.25rem)` / 1.1                   | 700     |
| Sayfa başlığı (banner h1) | `clamp(1.875rem, 3.5vw, 2.75rem)` / 1.15            | 700     |
| Bölüm başlığı (h2)        | `clamp(1.5rem, 2.5vw, 2.125rem)` / 1.2              | 700     |
| Kart başlığı (h3)         | `1.125rem` / 1.35                                   | 600     |
| Gövde                     | `1rem` / 1.7                                        | 400     |
| Küçük / açıklama          | `0.875rem` / 1.6                                    | 400     |
| Bölüm etiketi (eyebrow)   | `0.75rem` / 1.4, `0.08em` letter-spacing, uppercase | 600     |

Bölüm etiketi (`HİZMETLERİMİZ`, `HAKKIMIZDA`, `HİZMET DETAYI`)
`--accent-primary` renginde ve başlığın hemen üstündedir. Bu bir
başlık etiketi **değildir** — `<p>` veya `<span>` olarak render
edilir, `h2` yerine geçmez.

## Border Radius

| Context                              | Değer  | Class          |
| ------------------------------------ | ------ | -------------- |
| Buton, input, rozet, çip             | `6px`  | `rounded-md`   |
| Kart, panel, sidebar bloğu           | `10px` | `rounded-lg`   |
| Hero banner, CTA bandı, büyük görsel | `14px` | `rounded-xl`   |
| Yuvarlak (float buton, avatar)       | tam    | `rounded-full` |

## Spacing ve Layout

- İçerik genişliği: `max-width: 1200px`, yatay padding mobilde
  `1rem`, `md`'den itibaren `2rem`. Tek bir `<Container>` bileşeni
  ile uygulanır.
- Bölümler arası dikey boşluk: mobilde `4rem`, `md`'den itibaren
  `6rem`.
- Grid boşluğu: kartlarda `1.5rem`.
- Hero banner ve CTA bandı sayfanın tam genişliğine yapışmaz —
  container içinde durur ve yuvarlatılmış köşeleri görünür.

## Layout Patterns

- **Üst şerit:** koyu zemin (`--bg-inverse`), yükseklik ~36px.
  Solda "Geleneksel ve Tamamlayıcı Tıp • Medikal Estetik", sağda
  telefon ve e-posta. `md` altında gizlenir.
- **Header:** beyaz zemin, altında `--border-default` çizgi,
  sticky. Solda logo, ortada/sağda yatay menü, en sağda dolu mavi
  "Randevu Al" butonu ve dil değiştirici. `lg` altında hamburger
  menü → tam ekran sheet.
- **Anasayfa hero:** container içinde yuvarlatılmış büyük fotoğraf,
  koyu overlay, solda hizalı başlık + açıklama + iki buton (dolu
  mavi birincil, beyaz/outline ikincil). Sağ altta doktor bilgi
  kartı (beyaz, küçük, avatar + ad + unvan).
- **İç sayfa banner'ı:** aynı yuvarlatılmış fotoğraf + overlay,
  ortada breadcrumb (`Anasayfa / Hizmetlerimiz / Botoks & Dolgu`)
  ve altında `h1`. Yükseklik hero'dan belirgin kısa.
- **İçerik + sidebar:** hizmet ve blog detay sayfalarında 2 sütun —
  solda içerik (`~2/3`), sağda sticky sidebar (`~1/3`). Sidebar iki
  kart taşır: hizmet listesi (aktif olan mavi ve kalın) ve "Hızlı
  Randevu" kartı (telefon, e-posta, dolu mavi CTA). `lg` altında
  sidebar içeriğin altına iner.
- **Kart grid'i:** 3 sütun (`lg`), 2 sütun (`md`), 1 sütun (mobil).
  Kart = beyaz zemin + `--border-default` kenarlık + `rounded-lg`.
  Gölge yok; hover'da kenarlık `--accent-primary`'ye yaklaşır ve
  kart 1px yukarı kayar.
- **Görsel kart (hizmet grid'i):** fotoğraf üzerine alttan yukarı
  koyu gradient, üstüne beyaz başlık ve tek satır açıklama.
- **Özellik kartı:** üstte `--accent-soft` zeminli kare ikon çipi
  (`rounded-md`), altında `h3` ve açıklama.
- **Süreç adımları:** `--bg-tint` zeminli bölüm, 4 kart, her kartın
  üstünde `01`–`04` numarası `--accent-primary` renginde.
- **Bilgi/uyarı kutusu:** `--bg-tint` zemin, başlangıç kenarında
  4px `--accent-primary` çizgi (`border-s-4`), küçük punto metin.
  Tıbbi sorumluluk reddi bu bileşenle verilir.
- **SSS akordeonu:** kenarlıkla ayrılmış satırlar, sağda (RTL'de
  solda) `+` / `−` ikonu; açık öğe `--accent-primary` başlıklı.
- **CTA bandı:** koyu overlay'li fotoğraf, ortada eyebrow + iri
  başlık + açıklama + dolu mavi buton, `rounded-xl`.
- **Footer:** `--bg-inverse` zemin. 4 sütun (marka + bülten,
  Kurumsal, Hızlı Linkler, İletişim). Altta ince ayırıcı ve alt
  şerit: solda telif, sağda KVKK / Gizlilik / Çerezler linkleri.
- **Float aksiyonlar:** sağ altta (RTL'de sol altta) dikey iki
  yuvarlak buton — WhatsApp (yeşil marka rengi, tek istisna) ve
  Ara (mavi). Her ikisi de `aria-label` taşır, mobilde alt
  güvenli alanın üzerinde durur, yazdırmada gizlenir.

## Buttons

| Varyant     | Zemin              | Metin              | Kenarlık           |
| ----------- | ------------------ | ------------------ | ------------------ |
| `primary`   | `--accent-primary` | `#FFFFFF`          | yok                |
| `secondary` | şeffaf             | `--text-primary`   | `--border-default` |
| `onImage`   | `#FFFFFF`          | `--text-primary`   | yok                |
| `ghost`     | şeffaf             | `--accent-primary` | yok                |

- Yükseklik: `40px` (varsayılan), `48px` (hero ve CTA bandı).
- Yatay padding: `1.25rem`, `rounded-md`, ağırlık 600, `0.875rem`.
- Tüm butonlarda görünür `focus-visible` halkası:
  2px `--accent-primary`, 2px offset.
- Hover'da yalnızca zemin/kenarlık değişir; boyut değişmez (CLS).

## Forms

- Input yüksekliği `44px`, `rounded-md`, `--border-default`
  kenarlık, odakta kenarlık `--accent-primary` + 1px iç gölge.
- Label input'un üstünde, `0.875rem`, ağırlık 500.
- Hata durumunda kenarlık `--state-error`, mesaj alanın altında
  `0.8125rem` ve `role="alert"`.
- Placeholder açıklayıcıdır ama label'ın yerini almaz.
- Zorunlu alanlar `*` ile işaretlenir ve açıklaması form başında
  verilir.

## Component Library

shadcn/ui, Tailwind v4 üzerine. Bileşenler `components/ui/`
altında yaşar ve CLI ile eklenir, elden yazılmaz. Bu projede
kullanılacak primitifler: `button`, `input`, `textarea`, `select`,
`label`, `checkbox`, `accordion`, `dialog`, `sheet`,
`dropdown-menu`, `badge`. Eklenen her bileşen bu dosyadaki
token'lara göre bir kez uyarlanır; sayfa içinde tekrar tekrar
`className` ile ezilmez.

## Icons

lucide-react. Yalnızca stroke tabanlı ikonlar, `stroke-width: 1.75`.
Boyutlar: satır içi `h-4 w-4`, buton içi `h-5 w-5`, özellik çipi
`h-6 w-6`. Yön bildiren ikonlar (`ArrowRight`, `ChevronRight`)
RTL'de `rtl:rotate-180` ile çevrilir. WhatsApp ikonu lucide'de
bulunmadığı için tek bir yerel SVG bileşeni olarak tutulur.

## Motion

- Geçişler kısa ve az: `150ms` renk/kenarlık, `200ms` dönüşüm.
  `ease-out`.
- **Kaydırma ile beliren bloklar (scroll reveal) VAR.** Kartlar ve
  bölümler görüş alanına girince yumuşak biçimde belirir: yön
  (`up` / `left` / `right`), süre `600ms`, easing
  `cubic-bezier(0.22, 1, 0.36, 1)`, aynı satırdaki kartlarda
  `80–90ms` kademe.

  Kurallar:
  - Yalnızca `transform` ve `opacity` animasyonu yapılır. Yükseklik,
    kenar boşluğu veya konum **animasyona sokulmaz** — düzen
    değişmediği için CLS 0'da kalır.
  - **Hero animasyona girmez.** LCP öğesi olduğu için geciktirilmez.
  - Başlangıç (gizli) durumu CSS'te yalnızca `html[data-motion="on"]`
    altında geçerlidir; bu nitelik JS ile eklenir. **JS kapalıysa
    hiçbir şey gizlenmez.**
  - RTL'de `left`/`right` yönleri otomatik yer değiştirir.
- Parallax ve sayaç animasyonu yoktur.
- Akordeon ve sheet açılışı `200ms` yükseklik/kayma.
- `prefers-reduced-motion: reduce` ayarında tüm geçişler ve
  beliren bloklar kapanır; içerik doğrudan görünür.

**Ölçüm:** Efektler eklendikten sonra mobil Lighthouse'ta CLS 0,
TBT 10 ms, performans 88 (öncesi 89 — ölçüm gürültüsü içinde).

## RTL (Arapça)

- `html[dir="rtl"]`; layout mantıksal özelliklerle kurulduğu için
  ek bir stil dosyası gerekmez.
- Float butonlar, sidebar, breadcrumb ayıracı ve akordeon ikonu
  otomatik olarak ayna çevrilir.
- Sayılar ve telefon numaraları Latin rakamla yazılır (`0542 188
30 34`), yön izolasyonu için `<bdi>` ile sarılır.
- Logo ve marka adı ayna çevrilmez.

## İçerik Kuralı (tasarımdan gelen)

Her hizmet ve blog sayfasında, içeriğin sonunda tıbbi sorumluluk
reddi bilgi kutusu bulunur: uygulamanın kişiye göre değiştiği, bu
sayfanın genel bilgilendirme amaçlı olduğu, tanı ve tedavi için
hekim değerlendirmesi gerektiği belirtilir. Bu kutu isteğe bağlı
değildir; sağlık içeriğinde hem yasal hem E-E-A-T gerekliliğidir.
