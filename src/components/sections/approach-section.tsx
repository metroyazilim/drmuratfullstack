import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { Reveal } from '@/components/shared/reveal';
import type { ServicesListing } from '@/lib/content/types';

/**
 * Anasayfanın ProcessSteps'i ile KARIŞTIRILMAMALI: orada 4 kart yan yana
 * ve tint zemin var, burada 2 sütun + 2×2 mini kart ve surface zemin.
 * Tek bileşene sıkıştırmak varyant bayrağı üretir ve ikisini de bozar.
 */
export function ApproachSection({
  approach,
}: {
  approach: ServicesListing['approach'];
}) {
  return (
    <Section variant="surface">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionLabel>{approach.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {approach.title}
            </h2>
            <p className="text-text-muted mt-5 text-sm leading-relaxed md:text-base">
              {approach.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {approach.steps.map((step, index) => (
              <Reveal
                key={step.title}
                direction="right"
                delay={index * 80}
                className="border-border-default bg-bg-base rounded-lg border p-5"
              >
                <span
                  className="bg-accent-soft text-accent-primary flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-text-primary mt-4 text-sm font-semibold">
                  {step.title}
                </h3>
                <p className="text-text-muted mt-1.5 text-xs leading-relaxed">
                  {step.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
