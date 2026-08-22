import Image from 'next/image';
import { Link } from '@/lib/i18n';
import type { ServiceSummary } from '@/lib/content/types';

type ServiceCardProps = {
  service: ServiceSummary;
  sizes?: string;
};

/**
 * Fotoğraf üzerine gradient + başlık. Kartın tamamı tıklanabilir.
 * SPEC-007'de hizmet listesinde yeniden kullanılır.
 */
export function ServiceCard({
  service,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: ServiceCardProps) {
  return (
    <Link
      href={{ pathname: '/services/[slug]', params: { slug: service.slug } }}
      className="group focus-visible:ring-accent-primary relative block h-64 overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <Image
        src={service.cardImage}
        alt={service.cardImageAlt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
      />
      {/* Alttan yukarı koyu gradient — metnin okunabilirliği için. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="text-text-inverse text-lg font-semibold">
          {service.title}
        </h3>
        {/* Ayırıcı nokta CSS ile üretilir; içerik dosyasına tipografik
            işaret yazılmaz (RTL'de yanlış yöne akar). */}
        <ul className="text-text-inverse/70 mt-1 flex flex-wrap gap-x-1.5 text-xs">
          {service.cardTags.map((tag, index) => (
            <li
              key={tag}
              className={
                index > 0
                  ? "before:me-1.5 before:content-['•']"
                  : undefined
              }
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
