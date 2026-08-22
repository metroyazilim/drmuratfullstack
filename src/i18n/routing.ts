import { defineRouting } from 'next-intl/routing';

export const locales = ['tr', 'en', 'ar', 'ru'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'tr',
  localePrefix: 'always',
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/about': {
      tr: '/hakkimizda',
      en: '/about-us',
      ar: '/من-نحن',
      ru: '/o-nas',
    },
    '/mission': {
      tr: '/misyonumuz',
      en: '/our-mission',
      ar: '/رسالتنا',
      ru: '/nasha-missiya',
    },
    '/vision': {
      tr: '/vizyonumuz',
      en: '/our-vision',
      ar: '/رؤيتنا',
      ru: '/nashe-videnie',
    },
    '/quality': {
      tr: '/kalite-politikamiz',
      en: '/quality-policy',
      ar: '/سياسة-الجودة',
      ru: '/politika-kachestva',
    },
    '/team': {
      tr: '/ekibimiz',
      en: '/our-team',
      ar: '/فريقنا',
      ru: '/nasha-komanda',
    },
    '/team/[slug]': {
      tr: '/ekibimiz/[slug]',
      en: '/our-team/[slug]',
      ar: '/فريقنا/[slug]',
      ru: '/nasha-komanda/[slug]',
    },
    '/services': {
      tr: '/hizmetler',
      en: '/services',
      ar: '/الخدمات',
      ru: '/uslugi',
    },
    '/services/[slug]': {
      tr: '/hizmetler/[slug]',
      en: '/services/[slug]',
      ar: '/الخدمات/[slug]',
      ru: '/uslugi/[slug]',
    },
    '/blog': {
      tr: '/blog',
      en: '/blog',
      ar: '/المدونة',
      ru: '/blog',
    },
    '/blog/[slug]': {
      tr: '/blog/[slug]',
      en: '/blog/[slug]',
      ar: '/المدونة/[slug]',
      ru: '/blog/[slug]',
    },
    '/gallery': {
      tr: '/galeri',
      en: '/gallery',
      ar: '/معرض-الصور',
      ru: '/galereya',
    },
    '/video': {
      tr: '/video-galeri',
      en: '/video-gallery',
      ar: '/معرض-الفيديو',
      ru: '/video-galereya',
    },
    '/faq': {
      tr: '/sss',
      en: '/faq',
      ar: '/الأسئلة-الشائعة',
      ru: '/chasto-zadavaemye-voprosy',
    },
    '/appointment': {
      tr: '/randevu-al',
      en: '/book-appointment',
      ar: '/حجز-موعد',
      ru: '/zapis-na-priem',
    },
    '/contact': {
      tr: '/iletisim',
      en: '/contact',
      ar: '/اتصل-بنا',
      ru: '/kontakty',
    },
    '/legal/[slug]': {
      tr: '/yasal/[slug]',
      en: '/legal/[slug]',
      ar: '/قانوني/[slug]',
      ru: '/pravovaya-informaciya/[slug]',
    },
  },
});
