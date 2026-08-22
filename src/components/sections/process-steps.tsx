import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { StepCard } from '@/components/shared/step-card';
import { Reveal } from '@/components/shared/reveal';
import type { Home } from '@/lib/content/types';

export function ProcessSteps({ process }: { process: Home['process'] }) {
  return (
    <Section variant="tint">
      <Container>
        <div className="text-center">
          <SectionLabel>{process.eyebrow}</SectionLabel>
          <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
            {process.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {process.steps.map((step, index) => (
            <Reveal key={step.title} direction="left" delay={index * 80}>
              <StepCard
                index={index}
                title={step.title}
                description={step.description}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
