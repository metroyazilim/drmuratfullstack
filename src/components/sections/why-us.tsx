import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { FeatureCard } from '@/components/shared/feature-card';
import { Reveal } from '@/components/shared/reveal';
import type { Home } from '@/lib/content/types';

export function WhyUs({ whyUs }: { whyUs: Home['whyUs'] }) {
  return (
    <Section variant="base">
      <Container>
        <h2 className="text-text-primary mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight md:text-4xl">
          {whyUs.title}
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {whyUs.items.map((item, index) => (
            <Reveal key={item.title} direction="up" delay={index * 90}>
              <FeatureCard
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
