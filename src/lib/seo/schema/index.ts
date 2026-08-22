import type {
  BlogPosting,
  DayOfWeek,
  Service as ServiceSchemaType,
  BreadcrumbList,
  FAQPage,
  ImageObject,
  MedicalClinic,
  MedicalProcedure,
  Person,
  WebSite,
  WithContext,
} from 'schema-dts';
import { getClinic } from '@/lib/content';
import type { Clinic, FaqItem, GalleryItem, Post, Service, TeamMember } from '@/lib/content/types';
import type { Locale } from '@/lib/i18n';
import { SITE_NAME, absoluteUrl } from '../config';

/** Klinik tekil bir varlıktır; her şemada yeniden tanımlanmaz, @id ile işaret edilir. */
export const CLINIC_ID = absoluteUrl('/#clinic');

function postalAddress(clinic: Clinic) {
  return {
    '@type': 'PostalAddress' as const,
    streetAddress: clinic.address.street,
    addressLocality: clinic.address.district,
    addressRegion: clinic.address.city,
    postalCode: clinic.address.postalCode,
    addressCountry: clinic.address.country,
  };
}

/**
 * `description` dışarıdan verilir (çağıran yer `getTranslations` ile
 * çözer) çünkü tanıtım metni dile göre değişir; `clinic.json`'daki alan
 * yalnızca künye (telefon, adres) taşır, tek dilli bir açıklama değil.
 */
export function clinicSchema(
  locale: Locale,
  description: string,
): WithContext<MedicalClinic> {
  const clinic = getClinic();
  const sameAs = Object.values(clinic.social).filter(Boolean) as string[];

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': CLINIC_ID,
    name: SITE_NAME[locale],
    legalName: clinic.legalName,
    description,
    url: absoluteUrl(`/${locale}`),
    telephone: clinic.contact.phone,
    email: clinic.contact.email,
    address: postalAddress(clinic),
    medicalSpecialty: 'https://schema.org/Dermatology',
    areaServed: [
      { '@type': 'City', name: 'İstanbul' },
      { '@type': 'AdministrativeArea', name: 'Küçükçekmece' },
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
    // Koordinat ve çalışma saatleri doğrulanmadı — uydurulmaz, boşsa üretilmez.
    ...(clinic.address.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: clinic.address.geo.latitude,
            longitude: clinic.address.geo.longitude,
          },
        }
      : {}),
    ...(clinic.foundingDate ? { foundingDate: clinic.foundingDate } : {}),
    ...(clinic.openingHours && clinic.openingHours.length > 0
      ? {
          openingHoursSpecification: clinic.openingHours.map((slot) => ({
            '@type': 'OpeningHoursSpecification' as const,
            dayOfWeek: slot.days.map(
              (day) => `https://schema.org/${day}` as DayOfWeek,
            ),
            opens: slot.opens,
            closes: slot.closes,
          })),
        }
      : {}),
  };
}

export function websiteSchema(locale: Locale, url: string): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: SITE_NAME[locale],
    url,
    inLanguage: locale,
    publisher: { '@id': CLINIC_ID },
  };
}

/**
 * Hizmet sayfası iki şema üretir: uygulamanın kendisi (MedicalProcedure)
 * ve kliniğin sunduğu hizmet (Service). provider bilgisi Service üzerinde
 * durur — MedicalProcedure bu alanı taşımaz.
 */
export function serviceSchema(
  service: Service,
  url: string,
): [WithContext<MedicalProcedure>, WithContext<ServiceSchemaType>] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'MedicalProcedure',
      '@id': `${url}#procedure`,
      name: service.title,
      description: service.description,
      url,
      image: absoluteUrl(service.frontmatter.heroImage),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${url}#service`,
      name: service.title,
      description: service.description,
      url,
      serviceType: service.title,
      provider: { '@id': CLINIC_ID },
      areaServed: { '@type': 'City', name: 'İstanbul' },
    },
  ];
}

export function postSchema(
  post: Post,
  locale: Locale,
  url: string,
): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: post.title,
    description: post.description,
    url,
    inLanguage: locale,
    image: absoluteUrl(post.frontmatter.heroImage),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Person', name: post.frontmatter.author },
    publisher: { '@id': CLINIC_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

export function personSchema(
  member: TeamMember,
  locale: Locale,
  url: string,
): WithContext<Person> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    name: member.frontmatter.name,
    jobTitle: member.frontmatter.role,
    url,
    // Fotoğrafı olmayan üyede `image` alanı hiç üretilmez — olmayan bir
    // görsele referans vermektense alanı yazmamak doğru.
    ...(member.frontmatter.photo
      ? { image: absoluteUrl(member.frontmatter.photo) }
      : {}),
    worksFor: { '@id': CLINIC_ID },
    knowsLanguage: locale,
  };
}

export function faqSchema(items: FaqItem[], url: string): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: items.map((item) => ({
      '@type': 'Question' as const,
      name: item.question,
      acceptedAnswer: { '@type': 'Answer' as const, text: item.answer },
    })),
  };
}

export function breadcrumbSchema(
  crumbs: Array<{ name: string; url: string }>,
): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem' as const,
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function imageObjectSchema(item: GalleryItem): WithContext<ImageObject> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: absoluteUrl(item.image),
    name: item.alt,
    description: item.alt,
  };
}
