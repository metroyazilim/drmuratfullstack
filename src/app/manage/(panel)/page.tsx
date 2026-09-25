import Link from 'next/link';
import { ContentType } from '@prisma/client';
import { FileText, Images, Inbox, Newspaper, Stethoscope, Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { card, cn, helpText, pageShell } from '@/components/admin/ui';
import { CONTENT_TYPES } from '@/lib/admin/content-model';
import { ADMIN_LOCALES, LOCALE_SHORT_LABELS } from '@/lib/admin/locales';
import { prisma } from '@/lib/db';
import { getRecentAuditEntries } from '@/lib/manage-audit';

const AUDIT_ACTION_LABELS: Readonly<Record<string, string>> = {
  login: 'Giriş',
  logout: 'Çıkış',
  create: 'Oluşturma',
  update: 'Güncelleme',
  publish: 'Yayınlama',
  archive: 'Arşivleme',
  delete: 'Silme',
  'password-reset-requested': 'Parola isteği',
  'password-reset-applied': 'Parola yenileme',
};

const AUDIT_ENTITY_LABELS: Readonly<Record<string, string>> = {
  AdminUser: 'Yönetici',
  ContentEntry: 'İçerik',
  ContentLocale: 'Çeviri',
  FaqEntry: 'SSS',
  GalleryImage: 'Galeri görseli',
  MediaAsset: 'Medya',
  FormSubmission: 'Talep',
  Redirect: 'Yönlendirme',
  SiteSettings: 'Ayarlar',
};

export default async function ManageDashboardPage() {
  const [contentEntries, pendingSubmissions, mediaCount, recentAudit] = await Promise.all([
    prisma.contentEntry.findMany({
      orderBy: [{ type: 'asc' }, { key: 'asc' }],
      select: {
        id: true,
        type: true,
        key: true,
        locales: { select: { locale: true } },
      },
    }),
    prisma.formSubmission.count({ where: { status: 'NEW' } }),
    prisma.mediaAsset.count({ where: { archived: false } }),
    getRecentAuditEntries(10),
  ]);

  const contentStats: Record<ContentType, { total: number; complete: number }> = {
    [ContentType.SERVICE]: { total: 0, complete: 0 },
    [ContentType.POST]: { total: 0, complete: 0 },
    [ContentType.TEAM]: { total: 0, complete: 0 },
    [ContentType.PAGE]: { total: 0, complete: 0 },
    [ContentType.LEGAL]: { total: 0, complete: 0 },
  };
  const incompleteEntries: Array<{
    id: string;
    type: ContentType;
    key: string;
    missingLocales: string[];
  }> = [];

  for (const entry of contentEntries) {
    const missingLocales = ADMIN_LOCALES.filter(
      (locale) => !entry.locales.some((translation) => translation.locale === locale),
    );
    contentStats[entry.type].total += 1;
    if (missingLocales.length === 0) {
      contentStats[entry.type].complete += 1;
    } else {
      incompleteEntries.push({
        id: entry.id,
        type: entry.type,
        key: entry.key,
        missingLocales: missingLocales.map((locale) => LOCALE_SHORT_LABELS[locale]),
      });
    }
  }

  return (
    <div className={pageShell}>
      <PageHeader
        title="Gösterge paneli"
        description="Klinik sitesinin içerik, talep ve medya durumuna genel bakış."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Hizmetler"
          value={contentStats.SERVICE.total}
          hint={`${contentStats.SERVICE.complete} kaydın dört dili tamam`}
          icon={Stethoscope}
          href="/manage/icerik/hizmetler"
        />
        <StatCard
          label="Blog"
          value={contentStats.POST.total}
          hint={`${contentStats.POST.complete} kaydın dört dili tamam`}
          icon={Newspaper}
          href="/manage/icerik/blog"
        />
        <StatCard
          label="Ekip"
          value={contentStats.TEAM.total}
          hint={`${contentStats.TEAM.complete} kaydın dört dili tamam`}
          icon={Users}
          href="/manage/icerik/ekip"
        />
        <StatCard
          label="Bekleyen talepler"
          value={pendingSubmissions}
          hint="Yeni randevu ve iletişim talebi"
          icon={Inbox}
          href="/manage/talepler"
        />
        <StatCard
          label="Medya varlıkları"
          value={mediaCount}
          hint="Arşivlenmemiş dosya"
          icon={Images}
          href="/manage/medya"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className={cn(card, 'overflow-hidden')} aria-labelledby="missing-translations">
          <div className="flex items-center gap-2 border-b border-border-default px-5 py-4">
            <FileText className="size-4 text-accent-primary" aria-hidden="true" />
            <h2 id="missing-translations" className="text-sm font-bold text-text-primary">
              Eksik çeviriler
            </h2>
          </div>
          {incompleteEntries.length === 0 ? (
            <p className={`${helpText} px-5 py-6`}>Tüm içeriklerin dört dili tamam.</p>
          ) : (
            <ul className="divide-y divide-border-default">
              {incompleteEntries.map((entry) => {
                const type = CONTENT_TYPES[entry.type];
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/manage/icerik/${type.segment}/${entry.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wider text-accent-primary">
                          {type.singular}
                        </span>
                        <span className="block truncate text-sm font-medium text-text-primary">
                          {entry.key}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-text-muted">
                        Eksik: {entry.missingLocales.join(', ')}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={cn(card, 'overflow-hidden')} aria-labelledby="recent-activity">
          <div className="flex items-center justify-between gap-3 border-b border-border-default px-5 py-4">
            <h2 id="recent-activity" className="text-sm font-bold text-text-primary">
              Son işlemler
            </h2>
            <Link
              href="/manage/islem-kaydi"
              className="text-xs font-bold uppercase tracking-wider text-accent-primary hover:underline"
            >
              Tümünü gör
            </Link>
          </div>
          <div className="overflow-hidden rounded-b-lg bg-[#0b0f14]">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#161b22] px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f56]" aria-hidden="true" />
              <span className="size-2.5 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
              <span className="size-2.5 rounded-full bg-[#27c93f]" aria-hidden="true" />
              <span className="ml-2 text-xs text-white/40">son-islemler.log</span>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto p-4 font-mono text-[13px]">
              {recentAudit.length === 0 ? (
                <span className="text-slate-500">{'// henüz kaydedilmiş işlem yok'}</span>
              ) : (
                recentAudit.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 whitespace-pre-wrap break-all"
                  >
                    <span className="text-emerald-400">$</span>
                    <span className="text-slate-500">
                      [{entry.createdAt.toLocaleString('tr-TR')}]
                    </span>
                    <span className="text-cyan-400">{entry.actorEmail}</span>
                    <span className="text-yellow-300">
                      {AUDIT_ACTION_LABELS[entry.action] ?? `Diğer işlem (${entry.action})`}
                    </span>
                    <span className="text-fuchsia-400">
                      {AUDIT_ENTITY_LABELS[entry.entity] ?? `Diğer varlık (${entry.entity})`}
                      {entry.entityId ? `#${entry.entityId}` : ''}
                    </span>
                    <span className="text-slate-300">
                      {entry.summary ?? 'Özet belirtilmedi'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
