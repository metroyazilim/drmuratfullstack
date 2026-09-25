import Image from 'next/image';
import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/section-label';
import { Link } from '@/lib/site-routes';

type CtaBandProps = {
  image: string;
  imageAlt: string;
  title?: string;
  description?: string;
};

/** Hizmet, blog ve anasayfa sonlarında tekrar kullanılan randevu bandı. */
export async function CtaBand({
  image,
  imageAlt,
  title,
  description,
}: CtaBandProps) {
  const t = await getTranslations('cta');

  return (
    <Container className="py-16 md:py-24">
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'var(--overlay-image)' }}
        />
        <div className="relative flex flex-col items-center gap-4 px-6 py-16 text-center md:px-16 md:py-20">
          <SectionLabel className="text-text-inverse/80">
            {t('eyebrow')}
          </SectionLabel>
          <h2 className="text-text-inverse max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
            {title ?? t('title')}
          </h2>
          <p className="text-text-inverse/70 max-w-xl text-sm md:text-base">
            {description ?? t('description')}
          </p>
          <Link href="/appointment" className="mt-2">
            <Button variant="primary" size="lg">
              {t('button')}
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
