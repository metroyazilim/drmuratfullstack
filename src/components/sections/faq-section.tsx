import Image from 'next/image';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { FaqAccordion } from '@/components/shared/faq-accordion';
import { Reveal } from '@/components/shared/reveal';
import type { FaqItem, Home } from '@/lib/content/types';

type FaqSectionProps = {
  copy: Home['faq'];
  items: FaqItem[];
};

/**
 * NOT: Anasayfa FAQPage JSON-LD üretmez. Aynı sorular hem burada hem
 * /faq sayfasında yayınlanırsa iki sayfa aynı yapısal veriyle yarışır;
 * şema sahipliği /faq sayfasındadır (SPEC-006 kararı).
 */
export function FaqSection({ copy, items }: FaqSectionProps) {
  return (
    <Section variant="base">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="left" className="relative h-80 overflow-hidden rounded-xl lg:h-100">
            <Image
              src={copy.image}
              alt={copy.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </Reveal>

          <Reveal direction="right">
            <SectionLabel>{copy.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {copy.title}
            </h2>
            <div className="mt-6">
              <FaqAccordion items={items} />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
