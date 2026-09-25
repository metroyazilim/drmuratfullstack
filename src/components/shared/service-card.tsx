import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/lib/site-routes';
import { RichText } from '@/components/RichText';
import type { ServiceSummary } from '@/lib/content/types';

type ServiceCardProps = {
  service: ServiceSummary;
  sizes?: string;
};

export function ServiceCard({
  service,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: ServiceCardProps) {
  return (
    <Link
      href={`/hizmetler/${service.slug}`}
      className="group border-border-default bg-bg-base focus-visible:ring-accent-primary block overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-accent-primary hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={service.cardImage}
          alt={service.cardImageAlt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        <span className="absolute bottom-4 start-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900">
          {String(service.order).padStart(2, '0')}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-text-primary text-xl font-bold tracking-tight">{service.title}</h3>
          <span className="bg-accent-soft text-accent-primary flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:rotate-45">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
        <RichText
          html={service.shortDescription}
          className="text-text-muted mt-3 line-clamp-3 text-sm leading-relaxed"
        />
      </div>
    </Link>
  );
}
