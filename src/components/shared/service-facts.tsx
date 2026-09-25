import { Activity, CalendarCheck, Clock3, Sparkles } from 'lucide-react';
import type { ServiceFrontmatter } from '@/lib/content/types';

const icons = [Activity, Sparkles, Clock3, CalendarCheck] as const;

type ServiceKpisProps = {
  kpis: ServiceFrontmatter['kpis'];
};

export function ServiceKpis({ kpis }: ServiceKpisProps) {
  return (
    <section aria-label="Uygulama özeti" className="mt-8 grid gap-3 sm:grid-cols-2">
      {kpis.map((kpi, index) => {
        const Icon = icons[index % icons.length] ?? Activity;
        return (
          <div
            key={`${kpi.label}-${kpi.value}`}
            className="border-border-default bg-bg-surface rounded-2xl border p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Icon className="text-accent-primary size-4" aria-hidden="true" />
              <p className="text-text-muted text-xs font-bold uppercase tracking-[0.14em]">{kpi.label}</p>
            </div>
            <p className="text-text-primary mt-3 text-xl font-bold tracking-tight">{kpi.value}</p>
            <p className="text-text-muted mt-2 text-sm leading-relaxed">{kpi.detail}</p>
          </div>
        );
      })}
    </section>
  );
}
