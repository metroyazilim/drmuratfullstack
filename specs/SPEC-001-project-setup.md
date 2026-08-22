# SPEC-001 — Proje kurulumu ve tasarım token'ları

**Faz:** 1 — Temel
**Bağımlılık:** Yok
**Sonraki:** SPEC-002 (i18n temeli)

## Goal

Next.js 16 projesini `ui-context.md` içindeki tasarım token'ları
uygulanmış, klasör iskeleti kurulmuş ve tip/lint kapıları kapalı
biçimde ayağa kaldırmak. Bu spec bittiğinde tek bir demo sayfa
üzerinde token'ların, tipografinin ve temel bileşenlerin doğru
çalıştığı görülebilir olmalı.

## Context

- Mimari: `context/architecture.md` → Stack tablosu, System
  Boundaries.
- Standartlar: `context/code-standards.md` → TypeScript, Styling,
  File Organization, Adlandırma.
- Tasarım: `context/ui-context.md` → Colors, Typography, Border
  Radius, Spacing, Buttons.

## Scope

- Next.js 16 + React 19 + TypeScript strict projesi.
- Tailwind v4 ve `@theme` ile token tanımı.
- shadcn/ui başlatma ve token'lara uyarlama.
- Font yükleme (Latin + Arapça).
- Klasör iskeleti (boş ama tanımlı).
- `next.config.ts` temel ayarları.
- ESLint + Prettier + format script'leri.
- `cn()`, `Container`, `Button`, `SectionLabel` temel bileşenleri.
- Token'ları gösteren geçici bir demo sayfa.

## Out of Scope

- i18n, locale routing, çeviri dosyaları (SPEC-002).
- İçerik okuma, MDX (SPEC-003).
- Metadata, JSON-LD, sitemap (SPEC-004).
- Header/Footer/float butonlar (SPEC-005).
- Gerçek içerik ve görseller.

## Implementation

### 1. Proje oluşturma

Proje kökü: `/Users/berat/anton/drmuratirmak/`. `context/` ve
`specs/` klasörleri korunur; Next.js aynı köke kurulur.

```bash
npx create-next-app@16.3.2 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-install
```

Next 16'da Turbopack varsayılandır; `--turbopack` bayrağı ne
kurulumda ne de script'lerde gerekir.

Ardından bağımlılıklar sabit sürümlerle kurulur:

```bash
npm install next@16.3.2 react@19.2.8 react-dom@19.2.8 clsx tailwind-merge class-variance-authority lucide-react@1.33.0
```

`create-next-app` üretimi olan demo içerik (`src/app/page.tsx`
gövdesi, `public/*.svg`) silinir.

### 1b. Sürüm eşleşmeli agent dokümanları

```bash
npx @next/codemod@canary agents-md
```

Bu komut proje köküne `AGENTS.md` yazar ve kurulu Next sürümünün
`node_modules/next/dist/docs/` altındaki paketlenmiş dokümanlarına
yönlendirir. Next 16 bu projeyi yazan modellerin eğitim verisinden
farklı davranıyor (`middleware` → `proxy`, `next lint` kaldırıldı,
senkron `params` kaldırıldı); sonraki spec'lerde kod yazılırken bu
dokümanlar kaynak alınır.

### 2. TypeScript

`tsconfig.json` içinde en az şunlar açık olur:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

`noUncheckedIndexedAccess` bilinçli bir tercihtir: içerik
dizilerinden okuma yaparken `undefined` durumunu tip düzeyinde
zorunlu kılar.

### 3. Klasör iskeleti

Aşağıdaki klasörler oluşturulur; bu spec'te çoğu boş kalır ama
sınırlar baştan bellidir (`architecture.md` → System Boundaries):

```
src/
  app/
  components/
    ui/
    shared/
    sections/
  lib/
    content/
    seo/
    i18n/
    mail/
    schemas/
    utils/
  actions/
  messages/
content/
  tr/  en/  ar/  ru/
public/
  images/
    services/  blog/  team/  gallery/  og/
```

Boş klasörler `.gitkeep` ile korunur.

### 4. Fontlar

`src/lib/fonts.ts`:

- `Inter` — `next/font/google`, `subsets: ['latin','latin-ext','cyrillic']`,
  `variable: '--font-sans'`, `display: 'swap'`.
- `IBM_Plex_Sans_Arabic` — `subsets: ['arabic']`, ağırlıklar
  `['400','500','600','700']`, `variable: '--font-arabic'`,
  `display: 'swap'`.

Not: `next/font/google` build sırasında fontları indirip **kendi
kendine barındırır**; çalışma zamanında Google'a istek gitmez.
`code-standards.md` içindeki "Google Fonts'a çalışma zamanı isteği
yapılmaz" kuralı bu şekilde karşılanır.

Her iki değişken de `<html>` üzerine sınıf olarak eklenir; aktif
font ailesi CSS'te seçilir (SPEC-002'de locale'e bağlanacak).

### 5. Tailwind v4 ve token'lar

`src/app/globals.css`:

```css
@import 'tailwindcss';

@theme {
  /* Renkler — ui-context.md > Colors */
  --color-bg-base: #ffffff;
  --color-bg-surface: #f6f7f9;
  --color-bg-tint: #f1f5fe;
  --color-bg-inverse: #141615;
  --color-accent-soft: #ecf2fe;
  --color-accent-primary: #3372e6;
  --color-accent-hover: #2a5fc4;
  --color-text-primary: #141615;
  --color-text-muted: #5d6162;
  --color-text-inverse: #ffffff;
  --color-border-default: #e3e6eb;
  --color-border-inverse: #2a2c2b;
  --color-state-error: #d92d20;
  --color-state-success: #12805c;

  /* Yarıçap — ui-context.md > Border Radius */
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 14px;

  /* Tipografi */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-arabic: var(--font-ibm-plex-arabic), var(--font-inter), sans-serif;

  /* Layout */
  --spacing-container: 1200px;
}
```

Bunun dışında `globals.css` yalnızca şunları içerir: `body`
varsayılan renk/font ataması, `--overlay-image` custom property'si,
`prefers-reduced-motion` bloğu ve `focus-visible` temel stili.
Bileşene özel hiçbir kural buraya yazılmaz.

Token adlandırma Tailwind v4'ün `--color-*` sözleşmesine uyar; bu
sayede `bg-bg-surface`, `text-text-muted`, `border-border-default`,
`rounded-lg` sınıfları otomatik üretilir. Bileşenlerde hex
kullanımı yasaktır (`code-standards.md` → Styling).

### 6. shadcn/ui

```bash
npx shadcn@latest init
```

Seçimler: Tailwind v4, `src/components/ui`, CSS değişkenleri
**açık**, base color nötr. Init sonrası üretilen renk değişkenleri
yukarıdaki token'lara bağlanır — ikinci bir renk sistemi
bırakılmaz.

Bu spec'te yalnızca `button` eklenir:

```bash
npx shadcn@latest add button
```

Üretilen `button.tsx` `ui-context.md` → Buttons tablosuna göre bir
kez uyarlanır: `primary`, `secondary`, `onImage`, `ghost`
varyantları; `default` (40px) ve `lg` (48px) boyutları;
`rounded-md`; `focus-visible` halkası 2px `--color-accent-primary`,
2px offset.

### 7. Temel bileşenler

- `src/lib/utils/cn.ts` — `clsx` + `tailwind-merge`.
- `src/components/ui/container.tsx` — `max-w-(--spacing-container)`,
  `px-4 md:px-8`, `mx-auto`.
- `src/components/ui/section.tsx` — `py-16 md:py-24`, opsiyonel
  `variant: 'base' | 'surface' | 'tint' | 'inverse'` ile zemin
  seçimi.
- `src/components/ui/section-label.tsx` — eyebrow etiketi;
  `<p>` olarak render eder, uppercase, `text-accent-primary`,
  `tracking-[0.08em]`. Başlık etiketi **değildir**.

Hepsi Server Component'tir; hiçbiri `"use client"` taşımaz.

### 8. `next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Next 16 varsayılanı [75]; tasarımda tek kalite yeterli,
    // açıkça yazarak niyeti belgeliyoruz.
    qualities: [75],
  },
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
```

Next 16 görsel varsayılanlarında bilinmesi gerekenler:
`minimumCacheTTL` 60sn değil **4 saat**, `imageSizes` dizisinden
`16` çıkarıldı, `images.domains` kullanımdan kalktı — harici host
gerekirse `remotePatterns` kullanılır. Bu proje yalnızca yerel
görsel kullandığı için `remotePatterns` boş kalır.

`redirects()` ve `next-intl` eklentisi sonraki spec'lerde eklenir.

### 9. Lint ve format

- Next 16'da `next lint` **kaldırıldı** ve `next build` artık lint
  çalıştırmıyor. ESLint doğrudan CLI ile çağrılır ve flat config
  (`eslint.config.mjs`) kullanılır.
- Config: `next/core-web-vitals` + `next/typescript`.
- Ek kural: `@next/next/no-img-element` **error** seviyesine
  çekilir (`code-standards.md` → Görseller: `<img>` yasak).
- Prettier + `prettier-plugin-tailwindcss` (sınıf sırası).
- `package.json` script'leri:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write .",
  "check": "npm run lint && npm run typecheck && npm run build"
}
```

Lint artık build'e dahil olmadığı için `check` script'i tek kapıdır;
commit öncesi bu çalıştırılır.

### 10. Demo sayfa (geçici)

`src/app/page.tsx` — token'ların doğruluğunu gözle doğrulamak için
geçici bir sayfa: renk kartları (her token adı + örneği),
tipografi ölçeği (h1/h2/h3/gövde/eyebrow), dört buton varyantı,
üç yarıçap örneği.

Bu sayfa **SPEC-002'de silinir**; dosya başına
`{/* GEÇİCİ: SPEC-002'de kaldırılacak */}` yorumu konur.

## Acceptance

1. `npm run dev` hatasız çalışıyor; demo sayfa açılıyor.
2. `npm run check` (lint + typecheck + build) temiz geçiyor.
3. Demo sayfadaki her renk, tasarımdan örneklenen değerle
   birebir eşleşiyor — vurgu `#3372E6`, koyu `#141615`, gri yüzey
   `#F6F7F9`, mavi yüzey `#F1F5FE`, kenarlık `#E3E6EB`, ikincil
   metin `#5D6162`.
4. Hiçbir bileşen dosyasında hex renk kodu geçmiyor
   (`grep -rE "#[0-9A-Fa-f]{6}" src/components src/app` yalnızca
   `globals.css` sonucunu döner).
5. Dört buton varyantı da tasarımdaki görünümü veriyor ve klavye
   ile odaklandığında görünür bir focus halkası çıkıyor.
6. Inter ve IBM Plex Sans Arabic yükleniyor; ağ sekmesinde
   `fonts.googleapis.com` isteği **yok**.
7. `<img>` etiketi kullanan bir dosya lint'ten geçmiyor.
8. Klasör iskeleti `architecture.md` → System Boundaries ile
   birebir aynı.
9. `create-next-app` demo varlıkları (SVG'ler, örnek CSS) repoda
   kalmamış.
10. `AGENTS.md` proje kökünde ve kurulu sürümün paketlenmiş
    dokümanlarını işaret ediyor.

## Notes

- **Sürüm sabitlenir.** `next`, `react`, `react-dom` ve
  `lucide-react` tam sürümle kurulur; caret ile kayan sürüm
  bırakılmaz. Sürüm yükseltmesi ayrı bir iş birimidir.
- `noUncheckedIndexedAccess` sonradan açılırsa yüzlerce hata
  üretir — baştan açık kurulur.
- shadcn init'in ürettiği kendi renk değişkenlerini token'lara
  bağlamak kritik: iki paralel renk sistemi kalırsa
  `code-standards.md` → Styling kuralı ilk günden ihlal edilir.
- Tailwind v4'te `tailwind.config.ts` yoktur; tema CSS içinde
  `@theme` ile tanımlanır. v3 alışkanlığıyla config dosyası
  aranmamalı.
- **Next 16 farkları** (eğitim verisinden farklı davranan noktalar):
  Turbopack varsayılan, `next lint` kaldırıldı, `middleware.ts`
  yerine `proxy.ts`, `params`/`searchParams`/`cookies()`/`headers()`
  yalnızca `await` ile okunur, ESLint flat config varsayılan.
  Kod yazarken `node_modules/next/dist/docs/` kaynak alınır.
- Demo sayfanın silinmesi SPEC-002'nin Acceptance listesine
  eklenmiştir.
