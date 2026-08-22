import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface FigureProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Figure({
  src,
  alt,
  caption,
  width = 1200,
  height = 675,
  className,
  priority = false,
}: FigureProps) {
  if (!alt || alt.trim() === '') {
    throw new Error(
      `[MDX Figure]: 'alt' prop is required and cannot be empty for image '${src}'`,
    );
  }

  return (
    <figure className={cn('my-8', className)}>
      <div className="border-border-default bg-bg-surface relative overflow-hidden rounded-xl border">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className="h-auto w-full object-cover"
          sizes="(min-width: 1200px) 1120px, (min-width: 768px) 90vw, 100vw"
        />
      </div>
      {caption && (
        <figcaption className="text-text-muted mt-2.5 text-center text-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
