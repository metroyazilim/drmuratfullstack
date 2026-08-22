import type { Locale } from '@/lib/i18n';
import type { ReactNode } from 'react';

export type ContentType = 'services' | 'blog' | 'team' | 'pages' | 'legal';

export interface SeoFrontmatter {
  title: string;
  description: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  ogImage: string;
  heroImage: string;
  heroImageAlt: string;
  noindex?: boolean;
}

export interface FeatureItem {
  title: string;
  description: string;
}

export interface ServiceFrontmatter extends SeoFrontmatter {
  shortDescription: string;
  cardImage: string;
  cardImageAlt: string;
  cardTags: string[];
  order: number;
  relatedPosts: string[];
  features: FeatureItem[];
}

export interface PostFrontmatter extends SeoFrontmatter {
  publishedAt: string;
  updatedAt?: string;
  category: string;
  relatedServices: string[];
  author: string;
}

export interface TeamFrontmatter extends SeoFrontmatter {
  name: string;
  role: string;
  /** Opsiyonel: yoksa baş harf monogramı gösterilir. */
  photo?: string;
  photoAlt?: string;
  duties?: { title: string; description: string }[];
  order: number;
}

export interface FeatureItemContent {
  icon: string;
  title: string;
  description: string;
}

export interface PageFrontmatter extends SeoFrontmatter {
  sidebarImage?: string;
  sidebarImageAlt?: string;
  approach?: { eyebrow: string; title: string; items: FeatureItemContent[] };
  timeline?: {
    eyebrow: string;
    title: string;
    rows: { label: string; description: string }[];
  };
  ctaLabel?: string;
}

export interface LegalFrontmatter extends SeoFrontmatter {
  noindex?: boolean;
}

export interface ServiceSummary {
  id: string;
  locale: Locale;
  title: string;
  description: string;
  shortDescription: string;
  slug: string;
  cardImage: string;
  cardImageAlt: string;
  cardTags: string[];
  order: number;
}

export interface Service extends ServiceSummary {
  frontmatter: ServiceFrontmatter;
  content: ReactNode;
}

export interface PostSummary {
  id: string;
  locale: Locale;
  title: string;
  description: string;
  slug: string;
  heroImage: string;
  heroImageAlt: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  author: string;
}

export interface Post extends PostSummary {
  frontmatter: PostFrontmatter;
  content: ReactNode;
}

export interface TeamSummary {
  id: string;
  locale: Locale;
  name: string;
  role: string;
  slug: string;
  /** Opsiyonel: yoksa baş harf monogramı gösterilir. */
  photo?: string;
  photoAlt?: string;
  order: number;
}

export interface TeamMember extends TeamSummary {
  frontmatter: TeamFrontmatter;
  content: ReactNode;
}

export interface Page {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  frontmatter: PageFrontmatter;
  content: ReactNode;
}

export interface Legal {
  id: string;
  locale: Locale;
  title: string;
  slug: string;
  frontmatter: LegalFrontmatter;
  content: ReactNode;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface GalleryItem {
  image: string;
  alt: string;
}

export interface VideoItem {
  id: string;
  youtubeId: string;
  coverImage: string;
  title: string;
  description: string;
}

export interface Clinic {
  name: string;
  legalName: string;
  slogan: string;
  description: string;
  foundingDate: string | null;
  doctor: {
    name: string;
    title: string;
    specialty: string;
  };
  contact: {
    phone: string;
    phoneFormatted: string;
    whatsapp: string;
    whatsappFormatted: string;
    email: string;
    appointmentEmail: string;
  };
  address: {
    street: string;
    district: string;
    city: string;
    postalCode: string;
    country: string;
    formatted: string;
    geo: {
      latitude: number;
      longitude: number;
    } | null;
  };
  social: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
  };
  openingHours: Array<{
    days: string[];
    opens: string;
    closes: string;
  }> | null;
}

export interface HomeFeature {
  icon: string;
  title: string;
  description: string;
}

export interface Home {
  seo: { title: string; description: string; ogImage: string };
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    primaryCta: string;
    secondaryCta: string;
    doctorCard: { name: string; title: string; photo: string; photoAlt: string };
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    chips: string[];
    image: string;
    imageAlt: string;
    ctaLabel: string;
  };
  services: { eyebrow: string; title: string; ctaLabel: string };
  whyUs: { title: string; items: HomeFeature[] };
  process: {
    eyebrow: string;
    title: string;
    steps: { title: string; description: string }[];
  };
  faq: { eyebrow: string; title: string; image: string; imageAlt: string };
  blog: { eyebrow: string; title: string };
  cta: { image: string; imageAlt: string };
}

export interface ListingBase {
  seo: { title: string; description: string; ogImage: string };
  banner: { title: string; image: string; imageAlt: string };
  intro: { eyebrow: string; title: string; description: string };
}

export interface ServicesListing extends ListingBase {
  approach: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { title: string; description: string }[];
  };
}

export interface TeamListing extends ListingBase {
  approach: { items: FeatureItemContent[] };
}

export interface FaqListing extends ListingBase {
  intro: ListingBase['intro'] & { image: string; imageAlt: string };
}

export interface AppointmentListing extends ListingBase {
  info: { eyebrow: string; title: string; description: string };
  form: { eyebrow: string; title: string; submitLabel: string };
  process: {
    eyebrow: string;
    title: string;
    steps: { title: string; description: string }[];
  };
}

export interface ContactListing extends ListingBase {
  info: { eyebrow: string; title: string };
  form: { eyebrow: string; title: string; submitLabel: string };
  map: { label: string; image: string };
}
