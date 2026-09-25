import { DatabaseZap } from 'lucide-react';
import { card } from './ui';

export function DatabaseNotConfigured() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl items-center px-5 py-16">
      <section className={`${card} w-full p-8`}>
        <div className="flex items-center gap-2 text-state-error">
          <DatabaseZap className="size-5" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider">Yönetim paneli</p>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">
          Veritabanı yapılandırılmamış
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Yönetim panelini kullanmak için veritabanı bağlantısının sunucu ortamında
          yapılandırılması gerekir. Lütfen sistem yöneticinizle görüşün.
        </p>
      </section>
    </main>
  );
}
