import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { DEFAULT_SUBMISSION_RETENTION_DAYS } from '@/lib/admin/site-settings';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { getMailSettingsSource } from '@/lib/mail/transport';
import { EmailSettingsForm } from './EmailSettingsForm';

function valueOrFallback(value: string | null | undefined, fallback: string | undefined): string {
  return value?.trim() || fallback?.trim() || '';
}

export default async function EmailSettingsPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  const session = await requireSuperAdmin();
  const [settings, source] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { singleton: true },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        smtpUser: true,
        smtpPasswordEnc: true,
        smtpFrom: true,
        mailTo: true,
        submissionRetentionDays: true,
      },
    }),
    getMailSettingsSource(),
  ]);

  const environmentPort = Number(process.env.SMTP_PORT);
  const fallbackPort = Number.isInteger(environmentPort) ? environmentPort : null;
  const port = settings?.smtpPort ?? fallbackPort;

  return (
    <div className={`${pageShell} space-y-6`}>
      <PageHeader
        title="E-posta ayarları"
        description="SMTP gönderimini ve taleplerin saklama süresini yönetin."
      />
      <EmailSettingsForm
        adminEmail={session.email}
        hasStoredPassword={Boolean(settings?.smtpPasswordEnc)}
        source={source}
        settings={{
          smtpHost: valueOrFallback(settings?.smtpHost, process.env.SMTP_HOST),
          smtpPort: port,
          smtpSecure: settings?.smtpSecure ?? port === 465,
          smtpUser: valueOrFallback(settings?.smtpUser, process.env.SMTP_USER),
          smtpFrom: valueOrFallback(
            settings?.smtpFrom,
            process.env.SMTP_FROM || process.env.SMTP_USER,
          ),
          mailTo: valueOrFallback(settings?.mailTo, process.env.MAIL_TO),
          submissionRetentionDays:
            settings?.submissionRetentionDays ?? DEFAULT_SUBMISSION_RETENTION_DAYS,
        }}
      />
    </div>
  );
}
