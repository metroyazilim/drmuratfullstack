import Image from 'next/image';
import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-svh bg-bg-base">
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <Image
                src="/images/brand/logo.png"
                alt="Dr. Murat Irmak"
                width={52}
                height={52}
                className="size-12 rounded-full object-contain"
                priority
              />
              <div>
                <p className="text-sm font-bold text-text-primary">Dr. Murat Irmak</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Klinik yönetimi
                </p>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">{title}</h1>
            {description ? <p className="mt-2 text-sm text-text-muted">{description}</p> : null}
          </div>
          {children}
        </div>
      </section>

      <section className="relative hidden flex-1 overflow-hidden bg-bg-inverse lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="h-1 w-20 rounded-md bg-accent-primary" aria-hidden="true" />
        <div>
          <p className="max-w-lg text-3xl font-bold leading-tight tracking-tight text-text-inverse">
            Kliniğin dijital içeriği tek, güvenli bir çalışma alanında.
          </p>
          <p className="mt-4 max-w-md text-sm leading-6 text-text-inverse/70">
            İçerikleri, talepleri, medyayı ve site ayarlarını buradan yönetin.
          </p>
          <p className="mt-8 text-xs font-bold uppercase tracking-wider text-text-inverse/60">
            Güvenli yönetici erişimi
          </p>
        </div>
      </section>
    </main>
  );
}
