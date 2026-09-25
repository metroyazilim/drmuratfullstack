import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/shared/service-card';
import { Reveal } from '@/components/shared/reveal';
import { Link } from '@/lib/site-routes';
import type { Home } from '@/lib/content/types';
import type { ServiceSummary } from '@/lib/content/types';

type ServicesGridProps = {
  copy: Home['services'];
  services: ServiceSummary[];
};

export function ServicesGrid({ copy, services }: ServicesGridProps) {
  return (
    <Section variant="surface">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionLabel>{copy.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {copy.title}
            </h2>
          </div>
          <Link href="/services">
            <Button variant="primary" size="sm">
              {copy.ctaLabel}
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.id} direction="up" delay={(index % 3) * 90}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
