import {
  CalendarCheck,
  Check,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

/** Şemadaki z.enum ile aynı küme — çalışma zamanında kırılmaz. */
const icons: Record<string, LucideIcon> = {
  ShieldCheck,
  UserCheck,
  Sparkles,
  HeartPulse,
  Stethoscope,
  CalendarCheck,
};

type FeatureCardProps = {
  /** Verilmezse tik işareti kullanılır (hizmet detayı özellik kartları). */
  icon?: string;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const Icon = icon ? (icons[icon] ?? ShieldCheck) : Check;

  return (
    <div className="border-border-default bg-bg-base hover:border-accent-primary rounded-lg border p-6 transition-colors duration-150">
      <span className="bg-accent-soft text-accent-primary flex h-11 w-11 items-center justify-center rounded-md">
        <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3 className="text-text-primary mt-5 text-base font-semibold">{title}</h3>
      <p className="text-text-muted mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
