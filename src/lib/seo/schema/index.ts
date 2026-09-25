import type {
  BlogPosting,
  ContactPage,
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
import type {
  Clinic,
  FaqItem,
  GalleryItem,
  Post,
  Service,
  ServiceSummary,
  TeamMember,
  TeamSummary,
} from '@/lib/content/types';
import type { Locale } from '@/lib/site-routes';
import { SITE_NAME, absoluteUrl } from '../config';

/** Klinik tekil bir varlıktır; her şemada yeniden tanımlanmaz, @id ile işaret edilir. */
export const CLINIC_ID = absoluteUrl('/#clinic');

/** Hekim de tekil: ekip sayfası, klinik şeması ve yazar alanı aynı @id'yi kullanır. */
export const PHYSICIAN_ID = absoluteUrl('/#physician');

/** Google logo alanında opak ve kare görsel bekler. */
const LOGO_URL = absoluteUrl('/images/brand/logo-square.png');

/**
 * `image`, işletmenin GERÇEK fotoğrafı olmalı — logo koymak Google'ın
 * yerel panel görselini markaya değil, boş bir amblem karesine düşürür.
 */
const CLINIC_IMAGES = [
  absoluteUrl('/images/gallery/klinik-giris.webp'),
  absoluteUrl('/images/gallery/muayene-odasi.webp'),
  absoluteUrl('/images/gallery/uygulama-odasi.webp'),
];

const SUPPORTED_LANGUAGES = ['Turkish'];

/**
 * Hizmet detay URL'i. Yol dile göre çevrildiği için (`/hizmetler`,
 * `/uslugi`, `/الخدمات`) elle birleştirilmez; routing tablosundan çözülür.
 */
function serviceUrl(_locale: Locale, slug: string): string {
  return absoluteUrl(`/hizmetler/${slug}`);
}

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
  clinic: Clinic,
  /**
   * Klinikte sunulan hizmetler. Verildiğinde `availableService` üretilir —
   * yanıt motorları "bu klinik ne yapıyor?" sorusunu şemadan cevaplayabilir.
   */
  services: ServiceSummary[] = [],
): WithContext<MedicalClinic> {
  const sameAs = Object.values(clinic.social).filter(Boolean) as string[];
  const geo = clinic.address.geo;

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    '@id': CLINIC_ID,
    name: SITE_NAME,
    legalName: clinic.legalName,
    description,
    url: absoluteUrl('/'),
    telephone: clinic.contact.phone,
    email: clinic.contact.email,
    address: postalAddress(clinic),
    logo: LOGO_URL,
    image: CLINIC_IMAGES,
    medicalSpecialty: 'https://schema.org/Dermatology',
    // Kliniği tekil bir varlık olarak tanıtan hekim; ekip sayfasıyla aynı @id.
    founder: { '@id': PHYSICIAN_ID },
    employee: { '@id': PHYSICIAN_ID },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: clinic.contact.phone,
      email: clinic.contact.email,
      availableLanguage: SUPPORTED_LANGUAGES,
    },
    areaServed: [
      { '@type': 'City', name: 'İstanbul' },
      { '@type': 'AdministrativeArea', name: 'Küçükçekmece' },
    ],
    ...(services.length > 0
      ? {
          // Yalnızca ad + URL: aynı nesne her sayfada basıldığı için
          // açıklamaları da taşımak HTML'i gereksiz şişirirdi.
          availableService: services.map((service) => ({
            '@type': 'MedicalProcedure' as const,
            name: service.title,
            url: serviceUrl(locale, service.slug),
          })),
          knowsAbout: services.map((service) => service.title),
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    // Harita bağlantısı koordinattan türetilir; elle yazılan bir Maps
    // linki adres değişince sessizce yanlış yeri göstermeye başlar.
    ...(geo
      ? {
          hasMap: `https://www.google.com/maps/search/?api=1&query=${geo.latitude},${geo.longitude}`,
        }
      : {}),
    // Çalışma saatleri doğrulanmadı — uydurulmaz, boşsa üretilmez.
    ...(geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: geo.latitude,
            longitude: geo.longitude,
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

/**
 * Kliniği tanıtan hekim.
 *
 * `MedicalClinic.founder`/`employee` bu @id'ye işaret ettiği için şema
 * klinikle BİRLİKTE basılır — aksi halde grafikte boşta bir referans kalır.
 * Bir sağlık sitesinde E-E-A-T'nin taşıyıcısı hekimin kimliğidir; bunu
 * yalnızca ekip sayfasında bırakmak sinyali tek sayfaya hapseder.
 *
 * Ekip listesinde eşleşen kayıt yoksa `null` döner — uydurma bir hekim
 * kimliği üretmektense şemayı hiç basmamak doğru.
 */
export function physicianSchema(
  _locale: Locale,
  member: TeamSummary | undefined,
  clinic: Clinic,
): WithContext<Person> | null {
  if (!member) return null;

  return {
    '@context': 'https://schema.org',
    // schema.org'da `Physician` bir KURUM tipidir (MedicalOrganization'dan
    // türer), insan değil. Hekimin kendisi `Person`; tıbbi uzmanlık
    // MedicalClinic tarafında `medicalSpecialty` ile zaten beyan ediliyor.
    '@type': 'Person',
    '@id': PHYSICIAN_ID,
    name: member.name,
    jobTitle: member.role,
    url: absoluteUrl(`/ekibimiz/${member.slug}`),
    ...(member.photo ? { image: absoluteUrl(member.photo) } : {}),
    telephone: clinic.contact.phone,
    email: clinic.contact.email,
    address: postalAddress(clinic),
    worksFor: { '@id': CLINIC_ID },
    knowsLanguage: SUPPORTED_LANGUAGES,
  };
}

/**
 * İletişim sayfası. `ContactPage` + `mainEntity` → klinik; Google'a
 * "kliniğin künyesi BU sayfada" der, NAP sinyalini tek yere bağlar.
 */
export function contactPageSchema(
  locale: Locale,
  url: string,
  name: string,
): WithContext<ContactPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${url}#contact`,
    name,
    url,
    inLanguage: locale,
    mainEntity: { '@id': CLINIC_ID },
    isPartOf: { '@id': `${absoluteUrl(`/${locale}`)}#website` },
  };
}

export function websiteSchema(locale: Locale, url: string): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${url}#website`,
    name: SITE_NAME,
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

/**
 * Ekip üyesi.
 *
 * Kliniği kuran hekim için `Person` değil `Physician` üretilir ve klinik
 * şemasındaki `founder`/`employee` ile AYNI @id kullanılır — aynı insan
 * için iki ayrı varlık basmak bilgi grafiğinde ikizleme yaratır.
 */
export function personSchema(
  member: TeamMember,
  locale: Locale,
  url: string,
  clinic: Clinic,
): WithContext<Person> {
  const isLeadPhysician = member.frontmatter.name === clinic.doctor.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': isLeadPhysician ? PHYSICIAN_ID : `${url}#person`,
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
