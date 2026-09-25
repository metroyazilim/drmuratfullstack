'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { recordAudit, requireSuperAdmin } from '@/lib/admin-auth';
import { sealSecret } from '@/lib/secret-box';
import {
  getMailConfig,
  getTransport,
  resetTransportCache,
} from '@/lib/mail/transport';

export type EmailActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function blankAsUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const optionalEmail = z.preprocess(
  blankAsUndefined,
  z.string().trim().email('Geçerli bir e-posta adresi girin.').optional(),
);

const emailSettingsSchema = z.object({
  smtpHost: z.preprocess(
    blankAsUndefined,
    z.string().trim().max(253, 'SMTP sunucusu çok uzun.').optional(),
  ),
  smtpPort: z.preprocess(
    blankAsUndefined,
    z.coerce.number().int().min(1, 'Port en az 1 olmalıdır.').max(65_535).optional(),
  ),
  smtpSecure: z.boolean(),
  smtpUser: z.preprocess(
    blankAsUndefined,
    z.string().trim().max(320, 'SMTP kullanıcı adı çok uzun.').optional(),
  ),
  smtpPassword: z.preprocess(
    blankAsUndefined,
    z.string().max(1_000, 'SMTP parolası çok uzun.').optional(),
  ),
  smtpFrom: optionalEmail,
  mailTo: optionalEmail,
  submissionRetentionDays: z.coerce
    .number()
    .int()
    .min(7, 'Saklama süresi en az 7 gün olmalıdır.')
    .max(3650, 'Saklama süresi en fazla 3650 gün olmalıdır.'),
});

const recipientSchema = z.string().trim().email('Geçerli bir alıcı e-posta adresi girin.');

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Alanları kontrol edin.';
}

function operatorError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function saveEmailSettingsAction(
  _previous: EmailActionResult,
  formData: FormData,
): Promise<EmailActionResult> {
  const session = await requireSuperAdmin();
  const parsed = emailSettingsSchema.safeParse({
    smtpHost: formData.get('smtpHost'),
    smtpPort: formData.get('smtpPort'),
    smtpSecure: formData.get('smtpSecure') === 'on',
    smtpUser: formData.get('smtpUser'),
    smtpPassword: formData.get('smtpPassword'),
    smtpFrom: formData.get('smtpFrom'),
    mailTo: formData.get('mailTo'),
    submissionRetentionDays: formData.get('submissionRetentionDays'),
  });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  try {
    const encryptedPassword = parsed.data.smtpPassword
      ? sealSecret(parsed.data.smtpPassword)
      : undefined;
    await prisma.siteSettings.upsert({
      where: { singleton: true },
      create: {
        singleton: true,
        smtpHost: parsed.data.smtpHost ?? null,
        smtpPort: parsed.data.smtpPort ?? null,
        smtpSecure: parsed.data.smtpSecure,
        smtpUser: parsed.data.smtpUser ?? null,
        smtpPasswordEnc: encryptedPassword ?? null,
        smtpFrom: parsed.data.smtpFrom ?? null,
        mailTo: parsed.data.mailTo ?? null,
        submissionRetentionDays: parsed.data.submissionRetentionDays,
      },
      update: {
        smtpHost: parsed.data.smtpHost ?? null,
        smtpPort: parsed.data.smtpPort ?? null,
        smtpSecure: parsed.data.smtpSecure,
        smtpUser: parsed.data.smtpUser ?? null,
        smtpFrom: parsed.data.smtpFrom ?? null,
        mailTo: parsed.data.mailTo ?? null,
        submissionRetentionDays: parsed.data.submissionRetentionDays,
        ...(encryptedPassword ? { smtpPasswordEnc: encryptedPassword } : {}),
      },
    });
    resetTransportCache();
    await recordAudit({
      action: 'settings.email.update',
      entity: 'SiteSettings',
      actorId: session.id,
      actorEmail: session.email,
      summary: 'SMTP ve talep saklama ayarları güncellendi',
      metadata: {
        source: parsed.data.smtpHost ? 'database' : 'environment',
        retentionDays: parsed.data.submissionRetentionDays,
        passwordChanged: Boolean(encryptedPassword),
      },
    });
    revalidatePath('/manage/ayarlar/eposta');
    revalidatePath('/manage/talepler');
    return { ok: true, message: 'E-posta ayarları kaydedildi.' };
  } catch (error) {
    console.error('[manage/settings/email] Ayarlar kaydedilemedi.', error);
    return { ok: false, error: 'E-posta ayarları kaydedilemedi.' };
  }
}

export async function testMailConnectionAction(): Promise<EmailActionResult> {
  const session = await requireSuperAdmin();
  try {
    const transport = await getTransport();
    if (!transport) throw new Error('SMTP yapılandırması eksik.');
    await transport.verify();
    await recordAudit({
      action: 'settings.email.verify',
      entity: 'SiteSettings',
      actorId: session.id,
      actorEmail: session.email,
      summary: 'SMTP bağlantısı test edildi',
    });
    return { ok: true, message: 'SMTP bağlantısı başarılı.' };
  } catch (error) {
    const message = operatorError(error);
    console.error('[manage/settings/email] SMTP bağlantı testi başarısız.', error);
    return { ok: false, error: message };
  }
}

export async function sendTestEmailAction(
  _previous: EmailActionResult,
  formData: FormData,
): Promise<EmailActionResult> {
  const session = await requireSuperAdmin();
  const recipient = recipientSchema.safeParse(formData.get('recipient'));
  if (!recipient.success) return { ok: false, error: firstIssue(recipient.error) };

  let result: EmailActionResult;
  try {
    const [transport, config] = await Promise.all([getTransport(), getMailConfig()]);
    if (!transport || !config) throw new Error('SMTP yapılandırması eksik.');
    await transport.sendMail({
      from: config.from,
      to: recipient.data,
      subject: 'Dr. Murat Irmak Kliniği — SMTP testi',
      text: 'Bu ileti yönetim panelindeki SMTP ayarlarını test etmek için gönderildi.',
      html: '<p>Bu ileti yönetim panelindeki SMTP ayarlarını test etmek için gönderildi.</p>',
    });
    result = { ok: true, message: `Test e-postası ${recipient.data} adresine gönderildi.` };
  } catch (error) {
    console.error('[manage/settings/email] Test e-postası gönderilemedi.', error);
    result = { ok: false, error: operatorError(error) };
  }

  try {
    await recordAudit({
      action: 'settings.email.test',
      entity: 'SiteSettings',
      actorId: session.id,
      actorEmail: session.email,
      summary: result.ok ? 'Test e-postası gönderildi' : 'Test e-postası gönderilemedi',
      metadata: { recipient: recipient.data, delivered: result.ok },
    });
  } catch (error) {
    console.error('[manage/settings/email] Test e-postası denetim kaydı yazılamadı.', error);
  }

  return result;
}
