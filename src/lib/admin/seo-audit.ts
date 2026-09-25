import { SITE_NAME } from '@/lib/seo/config';
import type { Locale } from './locales';

export type SeoCheckLevel = 'ok' | 'warn' | 'error';

export type SeoAuditCheck = Readonly<{
  id: string;
  label: string;
  level: SeoCheckLevel;
  detail: string;
}>;

export type SeoAuditInput = Readonly<{
  locale: Locale;
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: readonly string[];
  ogImage: string;
  heroImageAlt: string;
  noindex: boolean;
  allLocalesComplete: boolean;
}>;

export type SeoAuditResult = Readonly<{
  checks: readonly SeoAuditCheck[];
  score: number;
}>;

const slugPattern = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const absoluteUrlPattern = /^https?:\/\/[^\s]+$/i;

function check(
  id: string,
  label: string,
  passed: boolean,
  success: string,
  failure: string,
  failureLevel: Exclude<SeoCheckLevel, 'ok'> = 'error',
): SeoAuditCheck {
  return {
    id,
    label,
    level: passed ? 'ok' : failureLevel,
    detail: passed ? success : failure,
  };
}

export function auditLocaleSeo(input: SeoAuditInput): SeoAuditResult {
  const title = input.title.trim();
  const description = input.description.trim();
  const slug = input.slug.trim();
  const keyword = input.primaryKeyword.trim().toLocaleLowerCase(input.locale);
  const normalizedTitle = title.toLocaleLowerCase(input.locale);
  const fullTitleLength = `${title} | ${SITE_NAME}`.length;
  const ogImage = input.ogImage.trim();

  const checks: SeoAuditCheck[] = [
    check(
      'title-length',
      'Başlık uzunluğu',
      title.length >= 3 && title.length <= 70,
      `Başlık ${title.length} karakter ve 3–70 karakter aralığında.`,
      `Başlık ${title.length} karakter. 3–70 karakter arasında olacak şekilde düzenleyin.`,
    ),
    check(
      'full-title-length',
      'Arama sonucu başlık uzunluğu',
      fullTitleLength <= 60,
      `Marka adıyla birlikte başlık ${fullTitleLength} karakter.`,
      `Marka adıyla birlikte başlık ${fullTitleLength} karakter oluyor. Arama sonucunda kırpılmaması için 60 karakteri aşmayın.`,
      'warn',
    ),
    check(
      'description-length',
      'Meta açıklama uzunluğu',
      description.length >= 120 && description.length <= 165,
      `Açıklama ${description.length} karakter ve önerilen aralıkta.`,
      `Açıklama ${description.length} karakter. 120–165 karakter arasında olacak şekilde düzenleyin.`,
    ),
    check(
      'slug-format',
      'Adres biçimi',
      slug.length > 0 && slug === slug.toLocaleLowerCase(input.locale) && slugPattern.test(slug),
      'Adres küçük harf ve tire biçimine uygun.',
      'Adresi boş bırakmayın; küçük harf, harf/rakam ve kelimeler arasında tire kullanın.',
    ),
    check(
      'primary-keyword',
      'Birincil anahtar kelime',
      keyword.length >= 2 && normalizedTitle.includes(keyword),
      'Birincil anahtar kelime başlıkta geçiyor.',
      keyword.length < 2
        ? 'Birincil anahtar kelime tanımlayın.'
        : 'Birincil anahtar kelimeyi doğal biçimde başlığa ekleyin.',
      'warn',
    ),
    check(
      'secondary-keywords',
      'İkincil anahtar kelimeler',
      input.secondaryKeywords.length >= 1 && input.secondaryKeywords.length <= 4,
      `${input.secondaryKeywords.length} ikincil anahtar kelime tanımlı.`,
      'En az 1, en fazla 4 ikincil anahtar kelime tanımlayın.',
    ),
    check(
      'og-image',
      'Sosyal paylaşım görseli',
      ogImage.startsWith('/images/og/') || absoluteUrlPattern.test(ogImage),
      'Sosyal paylaşım görseli uygun bir konumda.',
      "Görseli '/images/og/' altında seçin veya tam bir http(s) adresi kullanın.",
    ),
    check(
      'hero-image-alt',
      'Ana görsel alternatif metni',
      input.heroImageAlt.trim().length >= 10,
      'Alternatif metin en az 10 karakter.',
      'Ana görsel için en az 10 karakterlik açıklayıcı alternatif metin yazın.',
    ),
    check(
      'noindex',
      'Arama motoru görünürlüğü',
      !input.noindex,
      'Sayfa arama motorları tarafından dizine eklenebilir.',
      'Bu sayfada noindex açık; arama sonuçlarında görünmeyecek.',
      'warn',
    ),
    check(
      'hreflang',
      'Dört dil karşılıklılığı',
      input.allLocalesComplete,
      'Türkçe, İngilizce, Arapça ve Rusça sürümler tamamlanmış.',
      'Hreflang karşılıklılığı için dört dil sürümünün tamamını doldurun.',
    ),
  ];

  const penalty = checks.reduce((total, item) => {
    if (item.level === 'error') return total + 12;
    if (item.level === 'warn') return total + 6;
    return total;
  }, 0);

  return { checks, score: Math.max(0, 100 - penalty) };
}
