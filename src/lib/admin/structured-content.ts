import { z } from 'zod';
import { homeIconSchema, type ListingKey } from '@/lib/content/schemas';

export const LISTING_KEYS: readonly ListingKey[] = [
  'services',
  'blog',
  'team',
  'faq',
  'appointment',
  'contact',
  'gallery',
];

export const LISTING_LABELS: Readonly<Record<ListingKey, string>> = {
  services: 'Hizmetler',
  blog: 'Blog',
  team: 'Ekip',
  faq: 'Sık Sorulan Sorular',
  appointment: 'Randevu',
  contact: 'İletişim',
  gallery: 'Galeri',
};

export const HOME_ICON_OPTIONS = homeIconSchema.options;

export const HOME_ICON_LABELS: Readonly<
  Record<(typeof HOME_ICON_OPTIONS)[number], string>
> = {
  ShieldCheck: 'Güvenlik kalkanı',
  UserCheck: 'Onaylı kişi',
  Sparkles: 'Işıltı',
  HeartPulse: 'Kalp ritmi',
  Stethoscope: 'Stetoskop',
  CalendarCheck: 'Onaylı takvim',
};

export type StructuredFieldKind = 'text' | 'textarea' | 'richtext' | 'media' | 'icon';

export type StructuredField = {
  path: string;
  label: string;
  kind?: StructuredFieldKind;
  hint?: string;
};

export type StructuredSection = {
  id: string;
  label: string;
  description?: string;
  fields: readonly StructuredField[];
};

const text = (path: string, label: string, kind: StructuredFieldKind = 'text') => ({
  path,
  label,
  kind,
});

const media = (path: string, label: string) =>
  text(path, label, 'media') satisfies StructuredField;

function repeatedFields(
  prefix: string,
  count: number,
  fields: readonly { suffix: string; label: string; kind?: StructuredFieldKind }[],
): StructuredField[] {
  return Array.from({ length: count }, (_, index) =>
    fields.map((field) => ({
      path: `${prefix}.${index}.${field.suffix}`,
      label: `${index + 1}. ${field.label}`,
      kind: field.kind ?? 'text',
    })),
  ).flat();
}

export const HOME_SECTIONS: readonly StructuredSection[] = [
  {
    id: 'seo',
    label: 'SEO',
    description: 'Arama sonucu başlığı, açıklaması ve sosyal paylaşım görseli.',
    fields: [
      text('seo.title', 'Sayfa başlığı'),
      text('seo.description', 'Meta açıklaması', 'textarea'),
      media('seo.ogImage', 'Sosyal paylaşım görseli'),
    ],
  },
  {
    id: 'hero',
    label: 'Ana Karşılama',
    fields: [
      text('hero.eyebrow', 'Üst başlık'),
      text('hero.title', 'Başlık'),
      text('hero.description', 'Açıklama', 'richtext'),
      media('hero.image', 'Ana görsel'),
      text('hero.imageAlt', 'Ana görsel alternatif metni'),
      text('hero.primaryCta', 'Birincil buton metni'),
      text('hero.secondaryCta', 'İkincil buton metni'),
      text('hero.doctorCard.name', 'Doktor kartı adı'),
      text('hero.doctorCard.title', 'Doktor kartı unvanı'),
      media('hero.doctorCard.photo', 'Doktor kartı fotoğrafı'),
      text('hero.doctorCard.photoAlt', 'Doktor fotoğrafı alternatif metni'),
    ],
  },
  {
    id: 'about',
    label: 'Hakkımızda',
    fields: [
      text('about.eyebrow', 'Üst başlık'),
      text('about.title', 'Başlık'),
      text('about.description', 'Açıklama', 'richtext'),
      ...repeatedFields('about.chips', 3, [{ suffix: 'value', label: 'Vurgu' }]).map(
        (field) => ({ ...field, path: field.path.replace('.value', '') }),
      ),
      media('about.image', 'Görsel'),
      text('about.imageAlt', 'Görsel alternatif metni'),
      text('about.ctaLabel', 'Buton metni'),
    ],
  },
  {
    id: 'services',
    label: 'Hizmetler',
    fields: [
      text('services.eyebrow', 'Üst başlık'),
      text('services.title', 'Başlık'),
      text('services.ctaLabel', 'Buton metni'),
    ],
  },
  {
    id: 'whyUs',
    label: 'Neden Biz',
    fields: [
      text('whyUs.title', 'Başlık'),
      ...repeatedFields('whyUs.items', 3, [
        { suffix: 'icon', label: 'İkon', kind: 'icon' },
        { suffix: 'title', label: 'Başlık' },
        { suffix: 'description', label: 'Açıklama', kind: 'richtext' },
      ]),
    ],
  },
  {
    id: 'process',
    label: 'Süreç',
    fields: [
      text('process.eyebrow', 'Üst başlık'),
      text('process.title', 'Başlık'),
      ...repeatedFields('process.steps', 4, [
        { suffix: 'title', label: 'Adım başlığı' },
        { suffix: 'description', label: 'Adım açıklaması', kind: 'richtext' },
      ]),
    ],
  },
  {
    id: 'faq',
    label: 'Sık Sorulan Sorular',
    fields: [
      text('faq.eyebrow', 'Üst başlık'),
      text('faq.title', 'Başlık'),
      media('faq.image', 'Görsel'),
      text('faq.imageAlt', 'Görsel alternatif metni'),
    ],
  },
  {
    id: 'blog',
    label: 'Blog',
    fields: [text('blog.eyebrow', 'Üst başlık'), text('blog.title', 'Başlık')],
  },
  {
    id: 'cta',
    label: 'Çağrı Alanı',
    fields: [media('cta.image', 'Görsel'), text('cta.imageAlt', 'Görsel alternatif metni')],
  },
];

const LISTING_BASE_SECTIONS: readonly StructuredSection[] = [
  {
    id: 'seo',
    label: 'SEO',
    fields: [
      text('seo.title', 'Sayfa başlığı'),
      text('seo.description', 'Meta açıklaması', 'textarea'),
      media('seo.ogImage', 'Sosyal paylaşım görseli'),
    ],
  },
  {
    id: 'banner',
    label: 'Sayfa Üst Alanı',
    fields: [
      text('banner.title', 'Başlık'),
      media('banner.image', 'Görsel'),
      text('banner.imageAlt', 'Görsel alternatif metni'),
    ],
  },
  {
    id: 'intro',
    label: 'Giriş',
    fields: [
      text('intro.eyebrow', 'Üst başlık'),
      text('intro.title', 'Başlık'),
      text('intro.description', 'Açıklama', 'richtext'),
    ],
  },
];

const servicesSections: readonly StructuredSection[] = [
  ...LISTING_BASE_SECTIONS,
  {
    id: 'approach',
    label: 'Yaklaşım',
    fields: [
      text('approach.eyebrow', 'Üst başlık'),
      text('approach.title', 'Başlık'),
      text('approach.description', 'Açıklama', 'textarea'),
      ...repeatedFields('approach.steps', 4, [
        { suffix: 'title', label: 'Adım başlığı' },
        { suffix: 'description', label: 'Adım açıklaması', kind: 'textarea' },
      ]),
    ],
  },
];

const teamSections: readonly StructuredSection[] = [
  ...LISTING_BASE_SECTIONS,
  {
    id: 'approach',
    label: 'Ekip Yaklaşımı',
    fields: repeatedFields('approach.items', 3, [
      { suffix: 'icon', label: 'İkon', kind: 'icon' },
      { suffix: 'title', label: 'Başlık' },
      { suffix: 'description', label: 'Açıklama', kind: 'textarea' },
    ]),
  },
];

const faqSections: readonly StructuredSection[] = LISTING_BASE_SECTIONS.map((section) =>
  section.id === 'intro'
    ? {
        ...section,
        fields: [
          ...section.fields,
          media('intro.image', 'Giriş görseli'),
          text('intro.imageAlt', 'Giriş görseli alternatif metni'),
        ],
      }
    : section,
);

const appointmentSections: readonly StructuredSection[] = [
  ...LISTING_BASE_SECTIONS,
  {
    id: 'info',
    label: 'Bilgi Alanı',
    fields: [
      text('info.eyebrow', 'Üst başlık'),
      text('info.title', 'Başlık'),
      text('info.description', 'Açıklama', 'textarea'),
    ],
  },
  {
    id: 'form',
    label: 'Form Alanı',
    fields: [
      text('form.eyebrow', 'Üst başlık'),
      text('form.title', 'Başlık'),
      text('form.submitLabel', 'Gönder butonu metni'),
    ],
  },
  {
    id: 'process',
    label: 'Randevu Süreci',
    fields: [
      text('process.eyebrow', 'Üst başlık'),
      text('process.title', 'Başlık'),
      ...repeatedFields('process.steps', 4, [
        { suffix: 'title', label: 'Adım başlığı' },
        { suffix: 'description', label: 'Adım açıklaması', kind: 'richtext' },
      ]),
    ],
  },
];

const contactSections: readonly StructuredSection[] = [
  ...LISTING_BASE_SECTIONS,
  {
    id: 'info',
    label: 'İletişim Bilgisi Alanı',
    fields: [text('info.eyebrow', 'Üst başlık'), text('info.title', 'Başlık')],
  },
  {
    id: 'form',
    label: 'Form Alanı',
    fields: [
      text('form.eyebrow', 'Üst başlık'),
      text('form.title', 'Başlık'),
      text('form.submitLabel', 'Gönder butonu metni'),
    ],
  },
  {
    id: 'map',
    label: 'Harita',
    fields: [text('map.label', 'Konum etiketi'), media('map.image', 'Harita görseli')],
  },
];

const LISTING_SECTIONS: Readonly<Record<ListingKey, readonly StructuredSection[]>> = {
  services: servicesSections,
  blog: LISTING_BASE_SECTIONS,
  team: teamSections,
  faq: faqSections,
  appointment: appointmentSections,
  contact: contactSections,
  gallery: LISTING_BASE_SECTIONS,
};

export function isListingKey(value: string): value is ListingKey {
  return LISTING_KEYS.some((key) => key === value);
}

export function listingFieldsFor(key: ListingKey): readonly StructuredSection[] {
  return LISTING_SECTIONS[key];
}

const unknownRecordSchema = z.record(z.unknown());

function parseContainer(value: unknown): Record<string, unknown> | unknown[] | null {
  if (Array.isArray(value)) return value;
  const parsed = unknownRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function isArrayIndex(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function createContainer(nextSegment: string | undefined): Record<string, unknown> | unknown[] {
  return nextSegment && isArrayIndex(nextSegment) ? [] : {};
}

function setNestedValue(
  container: Record<string, unknown> | unknown[],
  segments: readonly string[],
  value: string,
): void {
  const [segment, ...rest] = segments;
  if (!segment) return;

  if (Array.isArray(container)) {
    const index = Number(segment);
    if (!Number.isInteger(index)) return;
    if (rest.length === 0) {
      container[index] = value;
      return;
    }
    const child = parseContainer(container[index]) ?? createContainer(rest[0]);
    container[index] = child;
    setNestedValue(child, rest, value);
    return;
  }

  if (rest.length === 0) {
    container[segment] = value;
    return;
  }
  const child = parseContainer(container[segment]) ?? createContainer(rest[0]);
  container[segment] = child;
  setNestedValue(child, rest, value);
}

export function structuredFormDataToObject(
  formData: FormData,
  sections: readonly StructuredSection[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of sections.flatMap((section) => section.fields)) {
    const value = formData.get(field.path);
    setNestedValue(result, field.path.split('.'), typeof value === 'string' ? value.trim() : '');
  }
  return result;
}

export function getStructuredValue(data: unknown, path: string): string {
  let current = data;
  for (const segment of path.split('.')) {
    if (Array.isArray(current) && isArrayIndex(segment)) {
      current = current[Number(segment)];
    } else {
      const parsed = unknownRecordSchema.safeParse(current);
      if (!parsed.success) return '';
      current = parsed.data[segment];
      continue;
    }
  }
  return typeof current === 'string' ? current : '';
}
