import type { Metadata } from 'next';
import {
  DEFAULT_OG_IMAGE,
  OG_LOCALE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from './config';
import { buildAlternates } from './alternates';

export type BuildMetadataInput = {
  title: string;
  description: string;
  /** Tek kanonik mutlak URL. */
  urls: Record<'tr', string>;
  ogImage?: string;
  ogImageAlt?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  noindex?: boolean;
  /** Anasayfada başlık şablonu uygulanmaz. */
  isHome?: boolean;
};

/**
 * Projedeki tüm metadata'nın tek çıkışı.
 * Sayfa dosyalarında elle Metadata nesnesi kurulmaz (architecture.md → Invariant 3).
 */
export function buildMetadata({
  title,
  description,
  urls,
  ogImage,
  ogImageAlt,
  type = 'website',
  publishedAt,
  updatedAt,
  noindex = false,
  isHome = false,
}: BuildMetadataInput): Metadata {
  const siteName = SITE_NAME;
  const fullTitle = isHome ? title : `${title} | ${siteName}`;
  const image = absoluteUrl(ogImage ?? DEFAULT_OG_IMAGE);

  return {
    metadataBase: new URL(SITE_URL),
    // `absolute`, kök layout'taki `title.template`'in markayı ikinci kez
    // eklemesini engeller. Marka son ekinin tek sahibi burasıdır.
    title: { absolute: fullTitle },
    description,
    alternates: buildAlternates(urls),
    robots: noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      siteName,
      title: fullTitle,
      description,
      url: urls.tr,
      locale: OG_LOCALE,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: ogImageAlt ?? title,
        },
      ],
      ...(type === 'article' && publishedAt
        ? { publishedTime: publishedAt, modifiedTime: updatedAt ?? publishedAt }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
