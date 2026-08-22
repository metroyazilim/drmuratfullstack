import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n';
import type { Home } from '@/lib/content/types';

/** Hero görseli sayfanın LCP'sidir → priority. Sayfada tek priority budur. */
export function Hero({ hero }: { hero: Home['hero'] }) {
  return (
    <Container className="pt-6">
      <div className="relative overflow-hidden rounded-xl">
        <Image
          src={hero.image}
          alt={hero.imageAlt}
          width={1600}
          height={900}
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="h-100 w-full object-cover md:h-125"
        />
        {/* Düz overlay yerine yönlü gradient: metnin oturduğu başlangıç
            kenarı koyu, fotoğraf tarafı açık. Düz %55 overlay'de hero
            kırpması fotoğrafın boş kısmına denk geldiğinde alan düz griye
            dönüyordu; bu haliyle hem metin kontrastı hem fotoğraf korunuyor. */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20 rtl:bg-gradient-to-l"
        />

        <div className="absolute inset-0 flex items-center">
          <div className="w-full px-6 md:px-12">
            <p className="text-text-inverse/80 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase">
              <span
                className="bg-accent-primary h-1.5 w-1.5 rounded-full"
                aria-hidden="true"
              />
              {hero.eyebrow}
            </p>

            <h1 className="text-text-inverse mt-3 max-w-xl text-2xl leading-tight font-bold tracking-tight sm:text-3xl md:mt-4 md:text-5xl">
              {hero.title}
            </h1>

            {/* Mobilde açıklama gizli: 400px'lik görsel alanına başlık,
                açıklama ve iki buton birlikte sığmıyor ve metin taşıyordu.
                Aynı metin hemen altındaki "Hakkımızda" bölümünde zaten var. */}
            <p className="text-text-inverse/75 mt-4 hidden max-w-lg text-sm leading-relaxed sm:block md:text-base">
              {hero.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-3 md:mt-7">
              <Link href="/appointment">
                <Button variant="primary" size="lg">
                  {hero.primaryCta}
                </Button>
              </Link>
              <Link href="/services">
                <Button variant="onImage" size="lg">
                  {hero.secondaryCta}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Doktor kartı — md altında görselin altına iner. */}
        <div className="border-border-default bg-bg-base absolute end-8 bottom-8 hidden items-center gap-3 rounded-lg border p-3 md:flex">
          <Image
            src={hero.doctorCard.photo}
            alt={hero.doctorCard.photoAlt}
            width={48}
            height={48}
            className="h-12 w-12 rounded-md object-cover"
          />
          <div>
            <p className="text-text-primary text-sm font-semibold">
              {hero.doctorCard.name}
            </p>
            <p className="text-text-muted text-xs">{hero.doctorCard.title}</p>
          </div>
        </div>
      </div>

      <div className="border-border-default bg-bg-base mt-4 flex items-center gap-3 rounded-lg border p-3 md:hidden">
        <Image
          src={hero.doctorCard.photo}
          alt={hero.doctorCard.photoAlt}
          width={48}
          height={48}
          className="h-12 w-12 rounded-md object-cover"
        />
        <div>
          <p className="text-text-primary text-sm font-semibold">
            {hero.doctorCard.name}
          </p>
          <p className="text-text-muted text-xs">{hero.doctorCard.title}</p>
        </div>
      </div>
    </Container>
  );
}
