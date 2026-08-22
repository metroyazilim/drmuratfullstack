import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Breadcrumbs, type Crumb } from './breadcrumbs';

type PageBannerProps = {
  title: string;
  image: string;
  imageAlt: string;
  crumbs: Crumb[];
};

/** İç sayfaların üst bloğu. Görsel sayfanın LCP'sidir → priority. */
export function PageBanner({ title, image, imageAlt, crumbs }: PageBannerProps) {
  return (
    <Container className="pt-6">
      <div className="relative h-55 overflow-hidden rounded-xl md:h-75">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'var(--overlay-image)' }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Breadcrumbs items={crumbs} inverse />
          <h1 className="text-text-inverse text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
        </div>
      </div>
    </Container>
  );
}
