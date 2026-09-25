import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/site-routes';
import { Reveal } from '@/components/shared/reveal';
import { RichText } from '@/components/RichText';
import type { Home } from '@/lib/content/types';

export function AboutSummary({ about }: { about: Home['about'] }) {
  return (
    <Section variant="base">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="left">
            <SectionLabel>{about.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {about.title}
            </h2>
            <RichText
              html={about.description}
              className="text-text-muted mt-5 text-sm leading-relaxed md:text-base"
            />

            <ul className="mt-6 flex flex-wrap gap-2">
              {about.chips.map((chip) => (
                <li
                  key={chip}
                  className="bg-bg-surface text-text-muted rounded-md px-3 py-1.5 text-xs font-medium"
                >
                  {chip}
                </li>
              ))}
            </ul>

            <Link href="/about" className="mt-7 inline-block">
              <Button variant="primary">{about.ctaLabel}</Button>
            </Link>
          </Reveal>

          <Reveal direction="right" className="relative h-90 overflow-hidden rounded-xl lg:h-112">
            <Image
              src={about.image}
              alt={about.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
