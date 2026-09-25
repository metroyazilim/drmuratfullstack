import * as React from 'react';
import { Link } from '@/lib/site-routes';
import { Callout } from './Callout';
import { Figure } from './Figure';
import { Steps, Step } from './Steps';
import { cn } from '@/lib/utils/cn';

export const mdxComponents = {
  h1: () => {
    throw new Error(
      "[MDX Error]: 'h1' başlığı MDX içinde kullanılamaz. Sayfanın h1'i şablondan gelir; lütfen 'h2' ile başlayın.",
    );
  },
  img: () => {
    throw new Error(
      '[MDX Error]: Ham <img> etiketi MDX içinde yasaktır. Lütfen <Figure src alt caption /> bileşenini kullanın.',
    );
  },
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn(
        'text-text-primary mt-10 mb-4 text-2xl font-bold tracking-tight md:text-3xl',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className={cn(
        'text-text-primary mt-8 mb-3 text-xl font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className={cn(
        'text-text-primary my-4 text-base leading-relaxed',
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className={cn(
        'text-text-primary my-4 list-disc space-y-2 ps-6 text-base leading-relaxed',
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className={cn(
        'text-text-primary my-4 list-decimal space-y-2 ps-6 text-base leading-relaxed',
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn('leading-relaxed', className)} {...props} />
  ),
  a: ({
    href,
    className,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (!href) return <span className={className}>{children}</span>;

    const isInternal = href.startsWith('/') || href.startsWith('#');
    if (isInternal) {
      return (
        <Link
          href={href as any}
          className={cn(
            'text-accent-primary hover:text-accent-hover font-medium underline underline-offset-4 transition-colors',
            className,
          )}
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'text-accent-primary hover:text-accent-hover font-medium underline underline-offset-4 transition-colors',
          className,
        )}
        {...props}
      >
        {children}
      </a>
    );
  },
  Callout,
  Figure,
  Steps,
  Step,
};
