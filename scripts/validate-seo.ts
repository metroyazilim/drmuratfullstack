/**
 * SPEC-004 doğrulama kapısı.
 *
 * Yönlendirme hedeflerinin gerçekliği, zincir yokluğu, hreflang karşılıklılığı
 * ve slug/anahtar kelime çakışmalarını kontrol eder.
 *
 * İçeriği doğrudan dosyadan okur; `lib/content` üzerinden gitmez çünkü o modül
 * MDX derleyicisini yükler ve script bağlamında gereksiz ağırlıktır.
 */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  legacyRedirects,
  matchLegacyRedirect,
} from '../src/lib/seo/legacy-redirects';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const LOCALES = ['tr', 'en', 'ar', 'ru'] as const;
type Locale = (typeof LOCALES)[number];

const DETAIL_TYPES = ['services', 'blog', 'team', 'legal'] as const;
type DetailType = (typeof DETAIL_TYPES)[number];

/**
 * SPEC-011'de oluşturulacak içerikler.
 *
 * 301 haritası canlı siteden çıkarıldığı için hedefler içerikten ÖNCE var.
 * Bu liste, "henüz yazılmadı" ile "hedef yanlış" durumlarını ayırır: buradaki
 * slug'lar uyarı üretir, listede olmayan bir eksik hedef hata verir.
 *
 * SPEC-011 tamamlandığında bu liste BOŞALIR ve kapı tamamen katılaşır.
 * Boşalmadığı sürece yayına çıkılmaz — eksik her sayfa 301'in 404'e gitmesi demek.
 */
const PENDING_CONTENT: Record<'services' | 'blog', string[]> = {
  services: [],
  blog: [],
};
const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string) {
  errors.push(message);
}

function listIds(type: DetailType): string[] {
  const dir = path.join(CONTENT_DIR, type);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

type Meta = { slug: string; title: string; primaryKeyword: string };

function readMeta(type: DetailType, id: string, locale: Locale): Meta | null {
  const file = path.join(CONTENT_DIR, type, id, `${locale}.mdx`);
  if (!fs.existsSync(file)) return null;

  const { data } = matter(fs.readFileSync(file, 'utf8'));
  if (typeof data.slug !== 'string') return null;

  return {
    slug: data.slug,
    title: typeof data.title === 'string' ? data.title : '',
    primaryKeyword:
      typeof data.primaryKeyword === 'string' ? data.primaryKeyword : '',
  };
}

// ── 1) Yönlendirme hedefleri gerçekten var mı? ───────────────────────────────
const slugsByTypeLocale = new Map<string, Set<string>>();
for (const type of DETAIL_TYPES) {
  for (const locale of LOCALES) {
    const set = new Set<string>();
    for (const id of listIds(type)) {
      const meta = readMeta(type, id, locale);
      if (meta) set.add(meta.slug);
    }
    slugsByTypeLocale.set(`${type}:${locale}`, set);
  }
}

const trServices = slugsByTypeLocale.get('services:tr') ?? new Set();
const trBlog = slugsByTypeLocale.get('blog:tr') ?? new Set();

for (const { source, destination } of legacyRedirects) {
  if (source.includes(':')) continue;

  const service = /^\/tr\/hizmetler\/(.+)$/.exec(destination);
  if (service?.[1] && !trServices.has(service[1])) {
    reportMissingTarget('services', service[1], source, destination);
  }

  const blog = /^\/tr\/blog\/(.+)$/.exec(destination);
  if (blog?.[1] && !trBlog.has(blog[1])) {
    reportMissingTarget('blog', blog[1], source, destination);
  }
}

function reportMissingTarget(
  type: 'services' | 'blog',
  slug: string,
  source: string,
  destination: string,
) {
  if (PENDING_CONTENT[type].includes(slug)) {
    warnings.push(
      `SPEC-011 bekliyor: ${source} → ${destination} (content/${type}/${slug} henüz yazılmadı)`,
    );
    return;
  }

  fail(
    `301 hedefi içerikte yok: ${source} → ${destination} ` +
      `(content/${type}/*/tr.mdx içinde "${slug}" slug'ı bulunamadı ve bekleyen listede de değil)`,
  );
}

// ── 2) Yönlendirme zinciri (A→B→C) ──────────────────────────────────────────
for (const { source, destination } of legacyRedirects) {
  if (matchLegacyRedirect(new URL(destination, 'https://x.test'))) {
    fail(`Yönlendirme zinciri: ${source} → ${destination} → tekrar yönleniyor`);
  }
}

// ── 3) Kaynak tekrarı ───────────────────────────────────────────────────────
const seen = new Set<string>();
for (const { source } of legacyRedirects) {
  if (seen.has(source)) fail(`Yönlendirme kaynağı iki kez tanımlı: ${source}`);
  seen.add(source);
}

// ── 4) hreflang karşılıklılığı ──────────────────────────────────────────────
for (const type of DETAIL_TYPES) {
  for (const id of listIds(type)) {
    for (const locale of LOCALES) {
      if (!readMeta(type, id, locale)) {
        fail(
          `hreflang eksik: ${type}/${id} → "${locale}" dosyası yok ya da ` +
            `slug alanı tanımsız. Dört dil olmadan karşılıklı hreflang kurulamaz.`,
        );
      }
    }
  }
}

// ── 5) Slug ve anahtar kelime çakışması (kanibalizasyon) ────────────────────
for (const locale of LOCALES) {
  const slugSeen = new Map<string, string>();
  const keywordSeen = new Map<string, string>();

  for (const type of DETAIL_TYPES) {
    for (const id of listIds(type)) {
      const meta = readMeta(type, id, locale);
      if (!meta) continue;

      const slugKey = `${type}/${meta.slug}`;
      const previousSlug = slugSeen.get(slugKey);
      if (previousSlug) {
        fail(`Slug çakışması (${locale}): "${meta.slug}" hem ${previousSlug} hem ${type}/${id}`);
      }
      slugSeen.set(slugKey, `${type}/${id}`);

      if (meta.primaryKeyword) {
        const key = meta.primaryKeyword.toLocaleLowerCase(locale);
        const previousKeyword = keywordSeen.get(key);
        if (previousKeyword) {
          fail(
            `Anahtar kelime çakışması (${locale}): "${meta.primaryKeyword}" ` +
              `hem ${previousKeyword} hem ${type}/${id} sayfasında birincil.`,
          );
        }
        keywordSeen.set(key, `${type}/${id}`);
      }
    }
  }
}

// ── 5b) Birleşik <title> uzunluğu ───────────────────────────────────────────
// Nihai başlık = içerik başlığı + " | " + site adı. Google ~60 karakterden
// sonrasını kesiyor; kesilen başlık tıklanma oranını düşürür.
const TITLE_MAX = 60;
const SITE_SUFFIX: Record<Locale, string> = {
  tr: ' | Dr. Murat Irmak Kliniği',
  en: ' | Dr. Murat Irmak Clinic',
  ar: ' | عيادة الدكتور مراد إرماك',
  ru: ' | Клиника доктора Мурата Ирмака',
};

for (const type of DETAIL_TYPES) {
  for (const id of listIds(type)) {
    for (const locale of LOCALES) {
      const meta = readMeta(type, id, locale);
      if (!meta?.title) continue;

      const composed = meta.title.length + SITE_SUFFIX[locale].length;
      if (composed > TITLE_MAX) {
        warnings.push(
          `Başlık uzun (${composed} karakter, sınır ${TITLE_MAX}): ` +
            `${type}/${id}/${locale} — "${meta.title}"`,
        );
      }
    }
  }
}

// ── 6) Harita eksilmesi uyarısı ─────────────────────────────────────────────
const EXPECTED_LEGACY_ENTRIES = 31;
if (legacyRedirects.length < EXPECTED_LEGACY_ENTRIES) {
  warnings.push(
    `301 haritasında ${legacyRedirects.length} giriş var, beklenen ` +
      `${EXPECTED_LEGACY_ENTRIES}. Düşen her giriş bir sayfanın arama değerini sıfırlar.`,
  );
}

const pendingTotal =
  PENDING_CONTENT.services.length + PENDING_CONTENT.blog.length;
if (pendingTotal > 0) {
  console.warn(
    `\n${pendingTotal} sayfa SPEC-011'de yazılacak; yayın öncesi bu liste boşalmalı.\n`,
  );
}
for (const warning of warnings) console.warn(`UYARI  ${warning}`);

if (errors.length > 0) {
  console.error(`\n${errors.length} SEO hatası:\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

const entityCount = DETAIL_TYPES.reduce((sum, t) => sum + listIds(t).length, 0);
console.log(
  `SEO kontrolleri geçti — ${legacyRedirects.length} yönlendirme, ${entityCount} varlık, ${LOCALES.length} dil.`,
);
