import { z } from 'zod';

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
  ogImage: z
    .string()
    .startsWith('/images/og/', "ogImage '/images/og/' ile başlamalıdır"),
  heroImage: z
    .string()
    .startsWith('/images/', "heroImage '/images/' ile başlamalıdır"),
  heroImageAlt: z.string().min(10, 'heroImageAlt en az 10 karakter olmalıdır'),
  noindex: z.boolean().default(false),
});

export const serviceFrontmatterSchema = seoFrontmatterSchema.extend({
  shortDescription: z
    .string()
    .min(20, 'Kısa açıklama en az 20 karakter olmalıdır'),
  cardImage: z
    .string()
    .startsWith('/images/', "cardImage '/images/' ile başlamalıdır"),
  cardImageAlt: z.string().min(10, 'cardImageAlt en az 10 karakter olmalıdır'),
  // Kart üzerindeki kısa etiket satırı (tasarım: "Dinamik çizgiler •
  // hacim desteği • yüz oranları"). Cümle değil; ayırıcı nokta CSS ile
  // üretilir, içeriğe yazılmaz.
  cardTags: z
    .array(z.string().min(2))
    .min(2, 'cardTags en az 2 etiket içermelidir')
    .max(3, 'cardTags en fazla 3 etiket içerebilir'),
  order: z.number().int().positive(),
  relatedPosts: z.array(z.string()).default([]),
  features: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().min(10),
      }),
    )
    .default([]),
});

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
});

export const teamFrontmatterSchema = seoFrontmatterSchema.extend({
  name: z.string().min(3),
  role: z.string().min(3),
  // Fotoğraf OPSİYONEL: tasarım, fotoğrafı olmayan üyeler için baş harf
  // monogramı kullanıyor (MK, EB). Fotoğraf sonradan gelirse yalnızca
  // frontmatter'a eklenir, kod değişmez.
  photo: z
    .string()
    .startsWith('/images/', "photo '/images/' ile başlamalıdır")
    .optional(),
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
  sidebarImage: z.string().startsWith('/images/').optional(),
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
    ogImage: z.string().startsWith('/images/'),
  }),
  hero: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
    image: z.string().startsWith('/images/'),
    imageAlt: z.string().min(10),
    primaryCta: z.string().min(2),
    secondaryCta: z.string().min(2),
    doctorCard: z.object({
      name: z.string().min(2),
      title: z.string().min(2),
      photo: z.string().startsWith('/images/'),
      photoAlt: z.string().min(10),
    }),
  }),
  about: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
    description: z.string().min(20),
    chips: z.array(z.string().min(2)).length(3),
    image: z.string().startsWith('/images/'),
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
    image: z.string().startsWith('/images/'),
    imageAlt: z.string().min(10),
  }),
  blog: z.object({
    eyebrow: z.string().min(2),
    title: z.string().min(10),
  }),
  cta: z.object({
    image: z.string().startsWith('/images/'),
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
    ogImage: z.string().startsWith('/images/'),
  }),
  banner: z.object({
    title: z.string().min(3),
    image: z.string().startsWith('/images/'),
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
    image: z.string().startsWith('/images/'),
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
  map: z.object({ label: z.string().min(5), image: z.string().startsWith('/images/') }),
});

export const listingSchemas = {
  services: servicesListingSchema,
  // Blog, galeri ve video listeleri `approach` taşımaz; taban şema yeterli.
  blog: listingBaseSchema,
  gallery: listingBaseSchema,
  video: listingBaseSchema,
  team: teamListingSchema,
  faq: faqListingSchema,
  appointment: appointmentListingSchema,
  contact: contactListingSchema,
} as const;

export type ListingKey = keyof typeof listingSchemas;
