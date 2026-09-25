import { z } from 'zod';

/**
 * Görsel referansı: repodaki `/images/...` yolu ya da medya kitaplığından
 * gelen tam URL. Panel eklenmeden önce yalnızca ilki mümkündü; R2'ye yüklenen
 * görseller mutlak adresle geldiği için ikinci biçim de kabul edilir.
 */
function imageRef(prefix: string, label: string) {
  return z
    .string()
    .refine(
      (value) => value.startsWith(prefix) || /^https?:\/\//.test(value),
      `${label} '${prefix}' ile başlamalı veya tam bir URL olmalıdır`,
    );
}

export const seoFrontmatterSchema = z.object({
  title: z
    .string()
    .min(3, 'Başlık en az 3 karakter olmalıdır')
    .max(70, 'Başlık en fazla 70 karakter olmalıdır'),
  description: z
    .string()
    .min(120, 'Açıklama en az 120 karakter olmalıdır')
    .max(165, 'Açıklama en fazla 165 karakter olmalıdır'),
  slug: z.string().min(1, 'Slug boş olamaz'),
  primaryKeyword: z
    .string()
    .min(2, 'Birincil anahtar kelime en az 2 karakter olmalıdır'),
  secondaryKeywords: z
    .array(z.string().min(2))
    .min(1, 'En az 1 ikincil anahtar kelime gereklidir')
    .max(4, 'En fazla 4 ikincil anahtar kelime eklenebilir'),
  ogImage: imageRef('/images/og/', 'ogImage'),
  heroImage: imageRef('/images/', 'heroImage'),
  heroImageAlt: z.string().min(10, 'heroImageAlt en az 10 karakter olmalıdır'),
  noindex: z.boolean().default(false),
});

export const serviceKpiSchema = z.object({
  label: z.string().min(2).max(60),
  value: z.string().min(2).max(80),
  detail: z.string().min(2).max(180),
});

export const serviceBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    title: z.string().min(3).max(120),
    body: z.string().min(30).max(2000),
  }),
  z.object({
    type: z.literal('steps'),
    title: z.string().min(3).max(120),
    items: z
      .array(z.object({ title: z.string().min(2).max(100), description: z.string().min(10).max(500) }))
      .min(2)
      .max(5),
  }),
  z.object({
    type: z.literal('faq'),
    title: z.string().min(3).max(120),
    items: z
      .array(z.object({ question: z.string().min(5).max(160), answer: z.string().min(20).max(1000) }))
      .min(2)
      .max(6),
  }),
  z.object({
    type: z.literal('callout'),
    title: z.string().min(3).max(120),
    body: z.string().min(20).max(1000),
    tone: z.enum(['info', 'warning']).default('info'),
  }),
]);

export const serviceFrontmatterSchema = seoFrontmatterSchema.extend({
  shortDescription: z
    .string()
    .min(20, 'Kısa açıklama en az 20 karakter olmalıdır'),
  cardImage: imageRef('/images/', 'cardImage'),
  cardImageAlt: z.string().min(10, 'cardImageAlt en az 10 karakter olmalıdır'),
  order: z.number().int().positive(),
  kpis: z.array(serviceKpiSchema).min(3).max(4),
  blocks: z.array(serviceBlockSchema).min(3).max(8),
  relatedPosts: z.array(z.string()).default([]),
});

export const postBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    title: z.string().min(3).max(120),
    body: z.string().min(10).max(6000),
  }),
  z.object({
    type: z.literal('richText'),
    title: z.string().min(3).max(120).optional(),
    html: z.string().min(7).max(15000),
  }),
  z.object({
    type: z.literal('kpis'),
    title: z.string().min(3).max(120).optional(),
    items: z.array(serviceKpiSchema).min(2).max(4),
  }),
  z.object({
    type: z.literal('steps'),
    title: z.string().min(3).max(120),
    items: z.array(z.object({ title: z.string().min(2).max(100), description: z.string().min(10).max(500) })).min(2).max(6),
  }),
  z.object({
    type: z.literal('faq'),
    title: z.string().min(3).max(120),
    items: z.array(z.object({ question: z.string().min(5).max(160), answer: z.string().min(20).max(1000) })).min(2).max(12),
  }),
  z.object({
    type: z.literal('callout'),
    title: z.string().min(3).max(120),
    body: z.string().min(20).max(2000),
    tone: z.enum(['info', 'warning']).default('info'),
  }),
]);

export const postFrontmatterSchema = seoFrontmatterSchema.extend({
  publishedAt: z
    .string()
    .datetime({ message: 'publishedAt geçerli bir ISO-8601 tarihi olmalıdır' }),
  updatedAt: z
    .string()
    .datetime({ message: 'updatedAt geçerli bir ISO-8601 tarihi olmalıdır' })
    .optional(),
  category: z.string().min(2),
  relatedServices: z.array(z.string()).default([]),
  author: z.string().default('Dr. Murat Irmak'),
  blocks: z.array(postBlockSchema).min(1).max(60),
});

export const teamFrontmatterSchema = seoFrontmatterSchema.extend({
  name: z.string().min(3),
  role: z.string().min(3),
  // Fotoğraf OPSİYONEL: tasarım, fotoğrafı olmayan üyeler için baş harf
  // monogramı kullanıyor (MK, EB). Fotoğraf sonradan gelirse yalnızca
  // frontmatter'a eklenir, kod değişmez.
  photo: imageRef('/images/', 'photo').optional(),
  photoAlt: z.string().min(5).optional(),
  // Detay sayfasındaki üç görev kartı (Randevu / Hazırlık / Takip).
  duties: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().min(3),
      }),
    )
    .length(3)
    .optional(),
  order: z.number().int().positive(),
});

export const homeIconSchema = z.enum([
  'ShieldCheck',
  'UserCheck',
  'Sparkles',
  'HeartPulse',
  'Stethoscope',
  'CalendarCheck',
]);

const featureItemSchema = z.object({
  icon: homeIconSchema,
  title: z.string().min(3),
  description: z.string().min(10),
});

/**
 * Kurumsal sayfa blokları OPSİYONEL.
 * Hakkımızda üçünü de kullanıyor; misyon/vizyon/kalite ve yasal sayfalar
 * yalnızca MDX gövdesi. Blok yoksa bölüm hiç render edilmez.
 */
export const pageFrontmatterSchema = seoFrontmatterSchema.extend({
  sidebarImage: imageRef('/images/', 'görsel').optional(),
  sidebarImageAlt: z.string().min(10).optional(),
  approach: z
    .object({
      eyebrow: z.string().min(2),
      title: z.string().min(5),
      items: z.array(featureItemSchema).length(3),
    })
    .optional(),
  timeline: z
    .object({
      eyebrow: z.string().min(2),
      title: z.string().min(5),
      rows: z
        .array(
          z.object({
            label: z.string().min(1),
            description: z.string().min(5),
          }),
        )
        .min(2),
    })
    .optional(),
  ctaLabel: z.string().min(2).optional(),
});

export const legalFrontmatterSchema = seoFrontmatterSchema.extend({
  noindex: z.boolean().default(false),
});

export const faqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(5),
  answer: z.string().min(10),
  category: z.string().optional(),
});

export const faqListSchema = z.array(faqItemSchema);

export const clinicSchema = z.object({
  name: z.string().min(2),
  legalName: z.string().min(2),
  slogan: z.string().min(5),
  description: z.string().min(20),
  foundingDate: z.string().nullable(),
  doctor: z.object({
    name: z.string().min(2),
    title: z.string().min(2),
    specialty: z.string().min(2),
  }),
  contact: z.object({
    phone: z.string().min(5),
    phoneFormatted: z.string().min(5),
    whatsapp: z.string().min(5),
    whatsappFormatted: z.string().min(5),
    email: z.string().email(),
    appointmentEmail: z.string().email(),
  }),
  address: z.object({
    street: z.string().min(3),
    district: z.string().min(2),
    city: z.string().min(2),
    postalCode: z.string().min(2),
    country: z.string().min(2),
    formatted: z.string().min(5),
    geo: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .nullable(),
  }),
  social: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    youtube: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }),
  openingHours: z
    .array(
      z.object({
        days: z.array(z.string()),
        opens: z.string(),
        closes: z.string(),
      }),
    )
    .nullable(),
});

/**
 * Anasayfa yapılandırılmış içerik şeması.
 *
 * Anasayfa uzun metin değil bölüm verisi taşıdığı için MDX yerine JSON.
 * `items`/`steps` sayıları tasarıma bağlıdır ve şemada sabittir — eksik
 * veya fazla kayıt sessizce bozuk bir grid üretmesin diye.
 */

export const homeSchema = z.object({
  seo: z.object({
    title: z.string().min(3).max(90),
    description: z.string().min(120).max(165),
    ogImage: imageRef('/images/', 'görsel'),
  }),
  hero: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
    image: imageRef('/images/', 'görsel'),
    imageAlt: z.string().min(10),
    primaryCta: z.string().min(2),
    secondaryCta: z.string().min(2),
    doctorCard: z.object({
      name: z.string().min(2),
      title: z.string().min(2),
      photo: imageRef('/images/', 'görsel'),
      photoAlt: z.string().min(10),
    }),
  }),
  about: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
    chips: z.array(z.string().min(2)).length(3),
    image: imageRef('/images/', 'görsel'),
    imageAlt: z.string().min(10),
    ctaLabel: z.string().min(2),
  }),
  services: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    ctaLabel: z.string().min(2),
  }),
  whyUs: z.object({
    title: z.string().min(10),
    items: z
      .array(
        z.object({
          icon: homeIconSchema,
          title: z.string().min(3),
          description: z.string().min(10),
        }),
      )
      .length(3),
  }),
  process: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    steps: z
      .array(
        z.object({
          title: z.string().min(3),
          description: z.string().min(10),
        }),
      )
      .length(4),
  }),
  faq: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    image: imageRef('/images/', 'görsel'),
    imageAlt: z.string().min(10),
  }),
  blog: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
  }),
  cta: z.object({
    image: imageRef('/images/', 'görsel'),
    imageAlt: z.string().min(10),
  }),
});

/**
 * Liste sayfalarının çerçeve metni (banner + giriş).
 * Bir hizmete/yazıya değil, sayfaya aittir; SPEC-008 ve SPEC-009
 * tarafından da kullanılacağı için genel tip olarak kuruldu.
 */
export const listingBaseSchema = z.object({
  seo: z.object({
    title: z.string().min(3).max(90),
    description: z.string().min(120).max(165),
    ogImage: imageRef('/images/', 'görsel'),
  }),
  banner: z.object({
    title: z.string().min(3),
    image: imageRef('/images/', 'görsel'),
    imageAlt: z.string().min(10),
  }),
  intro: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
  }),
});

export const servicesListingSchema = listingBaseSchema.extend({
  approach: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
    steps: z
      .array(
        z.object({
          title: z.string().min(3),
          description: z.string().min(5),
        }),
      )
      .length(4),
  }),
});

export const teamListingSchema = listingBaseSchema.extend({
  approach: z.object({
    items: z.array(featureItemSchema).length(3),
  }),
});

export const faqListingSchema = listingBaseSchema.extend({
  intro: listingBaseSchema.shape.intro.extend({
    image: imageRef('/images/', 'görsel'),
    imageAlt: z.string().min(10),
  }),
});

export const appointmentListingSchema = listingBaseSchema.extend({
  info: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(5),
    description: z.string().min(20),
  }),
  form: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(5),
    submitLabel: z.string().min(2),
  }),
  process: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(5),
    steps: z
      .array(z.object({ title: z.string().min(2), description: z.string().min(5) }))
      .length(4),
  }),
});

export const contactListingSchema = listingBaseSchema.extend({
  info: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(5),
  }),
  form: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(5),
    submitLabel: z.string().min(2),
  }),
  map: z.object({ label: z.string().min(5), image: imageRef('/images/', 'görsel') }),
});

export const listingSchemas = {
  services: servicesListingSchema,
  // Blog ve galeri listeleri `approach` taşımaz; taban şema yeterli.
  blog: listingBaseSchema,
  gallery: listingBaseSchema,
  team: teamListingSchema,
  faq: faqListingSchema,
  appointment: appointmentListingSchema,
  contact: contactListingSchema,
} as const;

export type ListingKey = keyof typeof listingSchemas;
