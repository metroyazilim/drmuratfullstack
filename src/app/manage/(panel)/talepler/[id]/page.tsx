import { ArrowLeft, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { cardPadded, pageShell, secondaryButton, sectionTitle } from '@/components/admin/ui';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { SubmissionActions } from '../SubmissionsView';

type Params = Promise<{ id: string }>;

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{value || '—'}</dd>
    </div>
  );
}

function formatDate(value: Date | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(value);
}

export default async function SubmissionDetailPage({ params }: { params: Params }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  const session = await requireAdmin();
  const { id } = await params;
  const submission = await prisma.formSubmission.findUnique({ where: { id } });
  if (!submission) notFound();

  await recordAudit({
    action: 'submission.view',
    entity: 'FormSubmission',
    entityId: submission.id,
    actorId: session.id,
    actorEmail: session.email,
    summary: `${submission.fullName} talebi görüntülendi`,
  });

  return (
    <div className={`${pageShell} space-y-6`}>
      <PageHeader
        title={submission.fullName}
        description={submission.kind === 'APPOINTMENT' ? 'Randevu talebi' : 'İletişim talebi'}
        actions={
          <Link href="/manage/talepler" className={secondaryButton}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Talep kutusuna dön
          </Link>
        }
      />

      <section className={cardPadded}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitle}>Talep durumu</h2>
          <StatusBadge status={submission.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`mailto:${submission.email}`} className={secondaryButton}>
            <Mail className="size-4" aria-hidden="true" />
            E-posta gönder
          </a>
          <a href={`tel:${submission.phone}`} className={secondaryButton}>
            <Phone className="size-4" aria-hidden="true" />
            Telefon et
          </a>
        </div>
        <div className="mt-5 border-t border-border-default pt-5">
          <SubmissionActions submissionId={submission.id} status={submission.status} />
        </div>
      </section>

      <section className={cardPadded}>
        <h2 className={sectionTitle}>İletişim bilgileri</h2>
        <dl className="mt-4 grid gap-5 md:grid-cols-2">
          <Detail label="Ad soyad" value={submission.fullName} />
          <Detail label="E-posta" value={submission.email} />
          <Detail label="Telefon" value={submission.phone} />
          <Detail label="Dil" value={submission.locale.toUpperCase()} />
        </dl>
      </section>

      <section className={cardPadded}>
        <h2 className={sectionTitle}>Talep ayrıntıları</h2>
        <dl className="mt-4 grid gap-5 md:grid-cols-2">
          <Detail
            label="Talep türü"
            value={submission.kind === 'APPOINTMENT' ? 'Randevu' : 'İletişim'}
          />
          <Detail label="Tercih edilen tarih" value={submission.preferredDate} />
          <Detail label="Hizmet" value={submission.serviceKey} />
          <Detail label="Gönderim tarihi" value={formatDate(submission.createdAt)} />
          <Detail label="Okunma tarihi" value={formatDate(submission.readAt)} />
          <Detail label="Saklama bitişi" value={formatDate(submission.retentionUntil)} />
          <Detail
            label="E-posta teslimi"
            value={submission.mailDelivered ? 'Gönderildi' : 'Mail gitmedi'}
          />
        </dl>
        <div className="mt-5 border-t border-border-default pt-5">
          <Detail label="Mesaj" value={submission.message} />
        </div>
      </section>
    </div>
  );
}
