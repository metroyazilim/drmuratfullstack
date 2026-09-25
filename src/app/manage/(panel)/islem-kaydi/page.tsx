import type { Prisma } from '@prisma/client';
import Link from 'next/link';
import { z } from 'zod';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { Pagination } from '@/components/admin/Pagination';
import { SelectField } from '@/components/ui/select-field';
import {
  fieldInput,
  fieldLabel,
  pageShell,
  secondaryButton,
} from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { getRecentAuditEntries, type AuditEntryView } from '@/lib/manage-audit';

const PAGE_SIZE = 30;
const querySchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  action: z.string().trim().max(100).optional().catch(undefined),
  entity: z.string().trim().max(100).optional().catch(undefined),
});

const ACTION_LABELS: Readonly<Record<string, string>> = {
  create: 'Oluşturma',
  update: 'Güncelleme',
  delete: 'Silme',
  import: 'İçe aktarma',
  activate: 'Etkinleştirme',
  deactivate: 'Pasifleştirme',
  'seo.update': 'SEO güncellemesi',
  'role.update': 'Rol güncellemesi',
  'password.reset.email': 'Parola sıfırlama e-postası',
  'password.reset.email.failed': 'Başarısız parola sıfırlama e-postası',
  'status.update': 'Durum güncellemesi',
};

const ENTITY_LABELS: Readonly<Record<string, string>> = {
  AdminUser: 'Yönetim kullanıcısı',
  AuditLog: 'İşlem kaydı',
  ContentEntry: 'İçerik',
  ContentLocale: 'İçerik dili',
  FaqEntry: 'Sık sorulan soru',
  GalleryImage: 'Galeri görseli',
  HomeContent: 'Anasayfa metni',
  ListingContent: 'Liste sayfası metni',
  MediaAsset: 'Medya varlığı',
  Redirect: 'Yönlendirme',
  SiteSettings: 'Site ayarı',
  FormSubmission: 'Talep',
};

function actionLabel(value: string): string {
  return ACTION_LABELS[value] ?? `Diğer işlem (${value})`;
}

function entityLabel(value: string): string {
  return ENTITY_LABELS[value] ?? `Diğer varlık (${value})`;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const parsed = querySchema.safeParse(await searchParams);
  const query = parsed.success ? parsed.data : { page: 1, action: undefined, entity: undefined };
  const where: Prisma.AuditLogWhereInput = {
    ...(query.action ? { action: query.action } : {}),
    ...(query.entity ? { entity: query.entity } : {}),
  };
  const filtered = Boolean(query.action || query.entity);

  const [total, actions, entities] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ['action'],
      orderBy: { action: 'asc' },
      select: { action: true },
    }),
    prisma.auditLog.findMany({
      distinct: ['entity'],
      orderBy: { entity: 'asc' },
      select: { entity: true },
    }),
  ]);

  let entries: AuditEntryView[];
  if (filtered) {
    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        actorEmail: true,
        summary: true,
        createdAt: true,
        metadata: true,
      },
    });
    entries = rows;
  } else {
    const recent = await getRecentAuditEntries(query.page * PAGE_SIZE);
    entries = recent.slice((query.page - 1) * PAGE_SIZE);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={pageShell}>
      <PageHeader
        title="İşlem kaydı"
        description="Yönetim panelinde yapılan değişiklikleri tarih, aktör, eylem ve varlık bilgileriyle izleyin."
      />

      <form method="get" className="mb-5 grid gap-4 rounded-lg border border-border-default bg-bg-base p-4 md:grid-cols-3">
        <label className={fieldLabel}>
          Eylem
          <SelectField
            name="action"
            defaultValue={query.action ?? ''}
            clearLabel="Tüm eylemler"
            placeholder="Tüm eylemler"
            className={fieldInput}
            options={actions.map((item) => ({ value: item.action, label: actionLabel(item.action) }))}
          />
        </label>
        <label className={fieldLabel}>
          Varlık
          <SelectField
            name="entity"
            defaultValue={query.entity ?? ''}
            clearLabel="Tüm varlıklar"
            placeholder="Tüm varlıklar"
            className={fieldInput}
            options={entities.map((item) => ({ value: item.entity, label: entityLabel(item.entity) }))}
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={secondaryButton}>
            Filtrele
          </button>
          <Link href="/manage/islem-kaydi" className={secondaryButton}>
            Temizle
          </Link>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-black/40 bg-[#0b0f14] shadow-lg">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#161b22] px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f56]" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-[#27c93f]" aria-hidden="true" />
          <span className="ml-2 text-xs text-white/40">islem-kaydi.log</span>
        </div>
        <div className="max-h-[70vh] space-y-1 overflow-y-auto p-4 font-mono text-[13px]">
          {entries.length === 0 ? (
            <span className="text-slate-500">{'// filtrelerle eşleşen işlem kaydı yok'}</span>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 whitespace-pre-wrap break-all"
              >
                <span className="text-emerald-400">$</span>
                <span className="text-slate-500">
                  [{entry.createdAt.toLocaleString('tr-TR')}]
                </span>
                <span className="text-cyan-400">{entry.actorEmail}</span>
                <span className="text-yellow-300">{actionLabel(entry.action)}</span>
                <span className="text-fuchsia-400">
                  {entityLabel(entry.entity)}
                  {entry.entityId ? `#${entry.entityId}` : ''}
                </span>
                <span className="text-slate-300">{entry.summary ?? 'Özet belirtilmedi'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {entries.length > 0 ? (
        <Pagination
          page={query.page}
          totalPages={totalPages}
          basePath="/manage/islem-kaydi"
          query={{ action: query.action, entity: query.entity }}
        />
      ) : null}
    </div>
  );
}
