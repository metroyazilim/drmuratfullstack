import { AlertTriangle, CircleHelp, Info, ListChecks } from 'lucide-react';
import type { ServiceBlock } from '@/lib/content/types';

type ServiceBlocksProps = {
  blocks: ServiceBlock[];
};

export function ServiceBlocks({ blocks }: ServiceBlocksProps) {
  return (
    <div className="mt-10 space-y-10">
      {blocks.map((block, index) => {
        if (block.type === 'text') {
          return (
            <section key={`${block.type}-${block.title}`}>
              <h2 className="text-text-primary text-2xl font-bold tracking-tight md:text-3xl">{block.title}</h2>
              <p className="text-text-primary mt-4 text-base leading-relaxed">{block.body}</p>
            </section>
          );
        }

        if (block.type === 'steps') {
          return (
            <section key={`${block.type}-${block.title}`} aria-labelledby={`service-steps-${index}`}>
              <div className="flex items-center gap-3">
                <span className="bg-accent-soft text-accent-primary flex size-10 items-center justify-center rounded-xl">
                  <ListChecks className="size-5" aria-hidden="true" />
                </span>
                <h2 id={`service-steps-${index}`} className="text-text-primary text-2xl font-bold tracking-tight">
                  {block.title}
                </h2>
              </div>
              <ol className="mt-5 grid gap-3">
                {block.items.map((item, itemIndex) => (
                  <li key={item.title} className="border-border-default bg-bg-surface grid grid-cols-[2.5rem_1fr] gap-4 rounded-2xl border p-5">
                    <span className="bg-accent-primary text-text-inverse flex size-10 items-center justify-center rounded-xl text-sm font-bold">
                      {String(itemIndex + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-text-primary font-bold">{item.title}</h3>
                      <p className="text-text-muted mt-1 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          );
        }

        if (block.type === 'faq') {
          return (
            <section key={`${block.type}-${block.title}`} aria-labelledby={`service-faq-${index}`}>
              <div className="flex items-center gap-3">
                <CircleHelp className="text-accent-primary size-6" aria-hidden="true" />
                <h2 id={`service-faq-${index}`} className="text-text-primary text-2xl font-bold tracking-tight">
                  {block.title}
                </h2>
              </div>
              <div className="border-border-default mt-5 overflow-hidden rounded-2xl border">
                {block.items.map((item) => (
                  <details key={item.question} className="border-border-default group bg-bg-base border-b last:border-b-0">
                    <summary className="text-text-primary cursor-pointer list-none px-5 py-4 pe-12 text-base font-semibold marker:content-none">
                      {item.question}
                    </summary>
                    <p className="text-text-muted px-5 pb-5 text-sm leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        const Icon = block.tone === 'warning' ? AlertTriangle : Info;
        return (
          <aside
            key={`${block.type}-${block.title}`}
            className={block.tone === 'warning' ? 'rounded-2xl border border-state-error/30 bg-state-error/5 p-5' : 'bg-accent-soft rounded-2xl border border-accent-primary/20 p-5'}
          >
            <div className="flex gap-3">
              <Icon className={block.tone === 'warning' ? 'text-state-error mt-0.5 size-5 shrink-0' : 'text-accent-primary mt-0.5 size-5 shrink-0'} aria-hidden="true" />
              <div>
                <h2 className="text-text-primary font-bold">{block.title}</h2>
                <p className="text-text-muted mt-2 text-sm leading-relaxed">{block.body}</p>
              </div>
            </div>
          </aside>
        );
      })}
    </div>
  );
}
