import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  serviceFrontmatterSchema,
  postFrontmatterSchema,
  teamFrontmatterSchema,
  pageFrontmatterSchema,
  legalFrontmatterSchema,
  faqListSchema,
  clinicSchema,
  listingSchemas,
} from '../src/lib/content/schemas';

const CONTENT_DIR = path.join(process.cwd(), 'content');

/**
 * Marka adı başlığın SONUNA eklenmez.
 *
 * Son eki `lib/seo/metadata.ts` ekler (`{başlık} | {site adı}`). İçerikte de
 * yazılırsa <title> içinde iki kez görünür ve h1'de gereksiz yere okunur.
 * Kişi sayfalarında marka adı başlığın KONUSU olabilir; bu yüzden yalnızca
 * son ek konumundaki kullanım reddedilir.
 */
const BRAND_SUFFIXES = [
  'Dr. Murat Irmak Kliniği',
  'Dr. Murat Irmak Clinic',
  'Dr. Murat Irmak',
  'عيادة الدكتور مراد إرماك',
  'الدكتور مراد إرماك',
  'Клиника доктора Мурата Ирмака',
  'Д-р Мурат Ирмак',
  'Доктор Мурат Ирмак',
];

/**
 * Tek tırnaklı YAML değerinde kaçışlanmamış kesme işareti.
 *
 * `description: 'Kliniği'nin misyonu...'` → YAML değeri "Kliniği" de kesilir
 * ve geri kalanı SESSİZCE kaybolur. Türkçe metinlerde ('nde, 'da, 'nin) çok
 * sık; SPEC-011'de yüzlerce metin yazılacağı için burada yakalanmalı.
 * Doğru yazım: iki kesme işareti — 'Kliniği''nin'.
 */
function checkYamlQuoting(file: string, rawFrontmatter: string) {
  const lines = rawFrontmatter.split('\n');

  for (const line of lines) {
    const match = /^\s*([A-Za-z][\w]*): '(.*)'\s*$/.exec(line);
    if (!match) continue;

    const [, key, value] = match;
    // Kaçışlanmış çiftleri düşürdükten sonra kalan tek tırnak hatalıdır.
    if (value && value.replace(/''/g, '').includes("'")) {
      addError(
        file,
        `YAML: "${key}" değerinde kaçışlanmamış kesme işareti var — ` +
          'değer sessizce kesilir. Kesme işaretini iki kez yazın.',
        key,
      );
    }
  }
}

function checkTitleBranding(file: string, title: unknown) {
  if (typeof title !== 'string' || !title.includes(' | ')) return;

  const tail = title.split(' | ').pop()?.trim() ?? '';
  if (BRAND_SUFFIXES.includes(tail)) {
    addError(
      file,
      `Başlık marka son eki taşıyor ("| ${tail}"). Marka adını lib/seo ekler; ` +
        'içerikte tekrar yazılırsa <title> içinde iki kez görünür.',
      'title',
    );
  }
}
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const LOCALES = ['tr', 'en', 'ar', 'ru'] as const;
type Locale = (typeof LOCALES)[number];

interface ValidationError {
  file: string;
  field?: string;
  message: string;
}

const errors: ValidationError[] = [];

function addError(file: string, message: string, field?: string) {
  errors.push({ file, field, message });
}

// 1. Check Clinic Metadata
function validateClinic() {
  const clinicPath = path.join(CONTENT_DIR, 'clinic.json');
  if (!fs.existsSync(clinicPath)) {
    addError('content/clinic.json', 'Dosya bulunamadı.');
    return;
  }
  try {
    const data = JSON.parse(fs.readFileSync(clinicPath, 'utf8'));
    const result = clinicSchema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        addError('content/clinic.json', issue.message, issue.path.join('.'));
      }
    }
  } catch (err) {
    addError('content/clinic.json', `JSON parse hatası: ${String(err)}`);
  }
}

// 2. Check FAQ
function validateFaq() {
  for (const locale of LOCALES) {
    const faqPath = path.join(CONTENT_DIR, 'faq', `${locale}.json`);
    if (!fs.existsSync(faqPath)) {
      addError(`content/faq/${locale}.json`, 'Eksik SSS dosyası.');
      continue;
    }
    try {
      const data = JSON.parse(fs.readFileSync(faqPath, 'utf8'));
      const result = faqListSchema.safeParse(data);
      if (!result.success) {
        for (const issue of result.error.issues) {
          addError(
            `content/faq/${locale}.json`,
            issue.message,
            issue.path.join('.'),
          );
        }
      }
    } catch (err) {
      addError(
        `content/faq/${locale}.json`,
        `JSON parse hatası: ${String(err)}`,
      );
    }
  }
}

// 3. Check Gallery & Alt texts
function validateGallery() {
  const imagesPath = path.join(CONTENT_DIR, 'gallery', 'images.json');
  if (!fs.existsSync(imagesPath)) {
    addError('content/gallery/images.json', 'Dosya bulunamadı.');
    return;
  }

  let images: string[] = [];
  try {
    images = JSON.parse(fs.readFileSync(imagesPath, 'utf8'));
    if (!Array.isArray(images)) {
      addError('content/gallery/images.json', 'Görsel listesi dizi olmalıdır.');
    }
  } catch (err) {
    addError('content/gallery/images.json', `JSON hatası: ${String(err)}`);
    return;
  }

  for (const img of images) {
    const assetPath = path.join(PUBLIC_DIR, img.replace(/^\//, ''));
    if (fs.existsSync(assetPath) && fs.statSync(assetPath).size === 0) {
      // 0 byte dosya varlık kontrolünü geçer ama tarayıcıda kırık görsel
      // olarak render olur. Yer tutucu bile olsa geçerli bir dosya olmalı.
      errors.push({
        file: assetPath.replace(process.cwd() + '/', ''),
        message: 'Görsel dosyası boş (0 byte) — geçerli bir görsel olmalı',
      });
    }
    if (!fs.existsSync(assetPath)) {
      addError(
        'content/gallery/images.json',
        `Galeri görseli diskte bulunamadı: public/${img.replace(/^\//, '')}`,
      );
    }
  }

  for (const locale of LOCALES) {
    const altPath = path.join(CONTENT_DIR, 'gallery', `alt.${locale}.json`);
    if (!fs.existsSync(altPath)) {
      addError(
        `content/gallery/alt.${locale}.json`,
        'Eksik alt metin dosyası.',
      );
      continue;
    }
    try {
      const altMap: Record<string, string> = JSON.parse(
        fs.readFileSync(altPath, 'utf8'),
      );
      for (const img of images) {
        if (!altMap[img] || altMap[img].trim() === '') {
          addError(
            `content/gallery/alt.${locale}.json`,
            `'${img}' görseli için alt metni eksik veya boş.`,
          );
        }
      }
    } catch (err) {
      addError(
        `content/gallery/alt.${locale}.json`,
        `JSON hatası: ${String(err)}`,
      );
    }
  }
}

// Check Asset exists in public/
function checkAssetExists(
  file: string,
  assetPathStr?: string,
  fieldName?: string,
) {
  if (!assetPathStr) return;
  const normalized = assetPathStr.replace(/^\//, '');
  const fullPath = path.join(PUBLIC_DIR, normalized);
  if (!fs.existsSync(fullPath)) {
    addError(
      file,
      `Görsel dosyası diskte bulunamadı: public/${normalized}`,
      fieldName,
    );
    return;
  }

  // 0 byte dosya varlık kontrolünü geçer ama tarayıcıda kırık görsel olarak
  // render olur ve next/image hata verebilir. Yer tutucu bile olsa geçerli
  // bir dosya olmak zorunda.
  if (fs.statSync(fullPath).size === 0) {
    addError(
      file,
      `Görsel dosyası boş (0 byte): public/${normalized}`,
      fieldName,
    );
  }
}

/**
 * Liste sayfalarının çerçeve metni (content/listing/**).
 *
 * Bu dosyalar kapının dışında kalmıştı: eksik bir dil ya da 120 karakterin
 * altında bir description ancak BUILD sırasında, prerender hatası olarak
 * ortaya çıkıyordu. Kapının işi bunu build'den önce söylemek.
 */
function validateListings() {
  const listingDir = path.join(CONTENT_DIR, 'listing');
  if (!fs.existsSync(listingDir)) return;

  for (const key of Object.keys(listingSchemas)) {
    const schema = listingSchemas[key as keyof typeof listingSchemas];

    for (const locale of LOCALES) {
      const file = path.join(listingDir, key, `${locale}.json`);
      const relative = `content/listing/${key}/${locale}.json`;

      if (!fs.existsSync(file)) {
        addError(relative, `Liste içeriği eksik: ${key} için "${locale}" dosyası yok`);
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch (err) {
        addError(relative, `JSON hatası: ${String(err)}`);
        continue;
      }

      const result = schema.safeParse(parsed);
      if (!result.success) {
        for (const issue of result.error.issues) {
          addError(relative, issue.message, issue.path.join('.'));
        }
        continue;
      }

      checkAssetExists(relative, result.data.seo.ogImage, 'seo.ogImage');
      checkAssetExists(relative, result.data.banner.image, 'banner.image');
    }
  }
}

validateListings();

// 4. Validate Entities (Services, Blog, Team, Pages, Legal)
const contentTypes = [
  { type: 'services', schema: serviceFrontmatterSchema },
  { type: 'blog', schema: postFrontmatterSchema },
  { type: 'team', schema: teamFrontmatterSchema },
  { type: 'pages', schema: pageFrontmatterSchema },
  { type: 'legal', schema: legalFrontmatterSchema },
] as const;

function validateEntities() {
  const serviceIds = new Set<string>();
  const postIds = new Set<string>();

  // Collect existing IDs
  const servicesDir = path.join(CONTENT_DIR, 'services');
  if (fs.existsSync(servicesDir)) {
    for (const d of fs.readdirSync(servicesDir, { withFileTypes: true })) {
      if (d.isDirectory()) serviceIds.add(d.name);
    }
  }

  const blogDir = path.join(CONTENT_DIR, 'blog');
  if (fs.existsSync(blogDir)) {
    for (const d of fs.readdirSync(blogDir, { withFileTypes: true })) {
      if (d.isDirectory()) postIds.add(d.name);
    }
  }

  // Keywords and Slugs tracking per locale
  const primaryKeywordsPerLocale: Record<Locale, Map<string, string>> = {
    tr: new Map(),
    en: new Map(),
    ar: new Map(),
    ru: new Map(),
  };

  const slugsPerTypeAndLocale: Record<
    string,
    Record<Locale, Map<string, string>>
  > = {};

  for (const { type, schema } of contentTypes) {
    slugsPerTypeAndLocale[type] = {
      tr: new Map(),
      en: new Map(),
      ar: new Map(),
      ru: new Map(),
    };

    const typeDir = path.join(CONTENT_DIR, type);
    if (!fs.existsSync(typeDir)) continue;

    const entityDirs = fs
      .readdirSync(typeDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const entityId of entityDirs) {
      const entityDirPath = path.join(typeDir, entityId);

      // Check 1: Missing translations (Must have all 4 language files)
      for (const locale of LOCALES) {
        const filePath = path.join(entityDirPath, `${locale}.mdx`);
        const relativeFilePath = `content/${type}/${entityId}/${locale}.mdx`;

        if (!fs.existsSync(filePath)) {
          addError(
            relativeFilePath,
            `Eksik çeviri: '${entityId}' varlığının ${locale}.mdx dosyası bulunamadı.`,
          );
          continue;
        }

        // Read and parse MDX
        const fileContent = fs.readFileSync(filePath, 'utf8');
        let parsedMatter: matter.GrayMatterFile<string>;

        try {
          parsedMatter = matter(fileContent);
        } catch (err) {
          // En sık sebep: tek tırnaklı değerde kaçışlanmamış kesme işareti
          // (Türkçe'de 'nin, 'da, 'nde). Ham hata mesajı bunu söylemiyor.
          const hasLooseApostrophe = /^\s*\w+: '.*[^']'[^']/m.test(
            fileContent.split('---')[1] ?? '',
          );

          addError(
            relativeFilePath,
            `Frontmatter parse hatası: ${String(err)}` +
              (hasLooseApostrophe
                ? '\n    İPUCU: Tek tırnaklı bir değerde kaçışlanmamış kesme ' +
                  "işareti olabilir. Kesme işaretini iki kez yazın: 'Kliniği''nin'."
                : ''),
          );
          continue;
        }

        // Check 2: Frontmatter validation with zod
        const parseResult = schema.safeParse(parsedMatter.data);
        if (!parseResult.success) {
          for (const issue of parseResult.error.issues) {
            addError(
              relativeFilePath,
              `${issue.path.join('.')}: ${issue.message}`,
              issue.path.join('.'),
            );
          }
        } else {
          const fm = parseResult.data as any;

          // Check 3: Primary keyword collision in same locale
          const kw = fm.primaryKeyword?.trim().toLowerCase();
          if (kw) {
            const existing = primaryKeywordsPerLocale[locale].get(kw);
            if (existing && existing !== relativeFilePath) {
              addError(
                relativeFilePath,
                `Birincil anahtar kelime çakışması (Kanibalizasyon): '${fm.primaryKeyword}' kelimesi zaten '${existing}' dosyasında kullanılmış.`,
                'primaryKeyword',
              );
            } else {
              primaryKeywordsPerLocale[locale].set(kw, relativeFilePath);
            }
          }

          // Check 4: Slug collision in same type and locale
          const slug = fm.slug?.trim();
          if (slug) {
            const existingSlug = slugsPerTypeAndLocale[type]![locale].get(slug);
            if (existingSlug && existingSlug !== relativeFilePath) {
              addError(
                relativeFilePath,
                `Slug çakışması: '${slug}' slug değeri '${existingSlug}' ile aynı.`,
                'slug',
              );
            } else {
              slugsPerTypeAndLocale[type]![locale].set(slug, relativeFilePath);
            }
          }

          // Check 5: Referential Integrity
          if (fm.relatedPosts && Array.isArray(fm.relatedPosts)) {
            for (const relId of fm.relatedPosts) {
              if (!postIds.has(relId)) {
                addError(
                  relativeFilePath,
                  `İlişkili blog yazısı kimliği ('${relId}') blog dizininde bulunamadı.`,
                  'relatedPosts',
                );
              }
            }
          }

          if (fm.relatedServices && Array.isArray(fm.relatedServices)) {
            for (const relId of fm.relatedServices) {
              if (!serviceIds.has(relId)) {
                addError(
                  relativeFilePath,
                  `İlişkili hizmet kimliği ('${relId}') services dizininde bulunamadı.`,
                  'relatedServices',
                );
              }
            }
          }

          // Check 6: Asset Existence
          checkYamlQuoting(relativeFilePath, parsedMatter.matter);
          checkTitleBranding(relativeFilePath, fm.title);
          checkAssetExists(relativeFilePath, fm.ogImage, 'ogImage');
          checkAssetExists(relativeFilePath, fm.heroImage, 'heroImage');
          checkAssetExists(relativeFilePath, fm.cardImage, 'cardImage');
          checkAssetExists(relativeFilePath, fm.photo, 'photo');

          // Check 8: Date Consistency
          if (fm.publishedAt) {
            const pubDate = new Date(fm.publishedAt).getTime();
            if (isNaN(pubDate)) {
              addError(
                relativeFilePath,
                'publishedAt geçerli bir tarih değil.',
                'publishedAt',
              );
            } else if (pubDate > Date.now() + 60000) {
              addError(
                relativeFilePath,
                'publishedAt tarihi gelecekte olamaz.',
                'publishedAt',
              );
            }

            if (fm.updatedAt) {
              const updDate = new Date(fm.updatedAt).getTime();
              if (isNaN(updDate)) {
                addError(
                  relativeFilePath,
                  'updatedAt geçerli bir tarih değil.',
                  'updatedAt',
                );
              } else if (updDate < pubDate) {
                addError(
                  relativeFilePath,
                  `updatedAt (${fm.updatedAt}) publishedAt (${fm.publishedAt}) tarihinden önce olamaz.`,
                  'updatedAt',
                );
              }
            }
          }
        }

        // Check 9: MDX Body Invariants (No <h1> or <img> in body)
        const body = parsedMatter.content;
        if (/^#\s+/m.test(body) || /<h1[\s>]/i.test(body)) {
          addError(
            relativeFilePath,
            "MDX gövdesinde 'h1' başlığı kullanılamaz. Sayfanın h1'i şablondan gelir; 'h2' (##) ile başlayın.",
          );
        }

        if (/<img[\s>]/i.test(body)) {
          addError(
            relativeFilePath,
            "MDX gövdesinde ham '<img>' etiketi yasaktır. Lütfen <Figure src alt caption /> bileşenini kullanın.",
          );
        }
      }
    }
  }
}

// Run All Validations
console.log('🔍 İçerik ve Şema Doğrulama Kapısı çalıştırılıyor...\n');

validateClinic();
validateFaq();
validateGallery();
validateEntities();

if (errors.length > 0) {
  console.error(
    `❌ Toplam ${errors.length} adet içerik / doğrulama hatası bulundu:\n`,
  );
  for (const err of errors) {
    const fieldInfo = err.field ? ` [${err.field}]` : '';
    console.error(`  - ${err.file}${fieldInfo}: ${err.message}`);
  }
  console.error(
    '\nLütfen yukarıdaki hataları düzelttikten sonra tekrar deneyin.\n',
  );
  process.exit(1);
} else {
  console.log(
    '✅ Tüm içerik dosyaları, çeviriler, zod şemaları ve ilişkiler başarıyla doğrulandı.',
  );
  process.exit(0);
}
