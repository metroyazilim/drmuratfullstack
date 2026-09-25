'use server';

import { headers } from 'next/headers';
import { getTranslations } from '@/lib/strings';
import type { SubmissionKind } from '@prisma/client';
import {
  appointmentSchema,
  contactSchema,
  type FormResult,
} from '@/lib/schemas/forms';
import { buildMail } from '@/lib/mail/templates';
import { sendFormMails } from '@/lib/mail/send';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClinic, getServiceById } from '@/lib/content';
import { LOCALE, type Locale } from '@/lib/site-routes';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { getSubmissionRetentionDays } from '@/lib/admin/site-settings';

/** Botların form doldurma hızının altında kalan insan yoktur. */
const MIN_FILL_MS = 3000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

async function clientIp(): Promise<string> {
  const store = await headers();
  return (
    store.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    store.get('x-real-ip') ??
    'unknown'
  );
}

function zodFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return errors;
}

function resolveLocale(_value: unknown): Locale {
  return LOCALE;
}

async function persistSubmission(input: {
  kind: SubmissionKind;
  locale: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDate?: string | null;
  serviceKey?: string | null;
  message?: string | null;
}): Promise<string | null> {
  if (!hasDatabase()) return null;

  try {
    const retentionDays = await getSubmissionRetentionDays();
    const submission = await prisma.formSubmission.create({
      data: {
        ...input,
        retentionUntil: new Date(Date.now() + retentionDays * DAY_IN_MS),
      },
      select: { id: true },
    });
    return submission.id;
  } catch (error) {
    console.error('[form] Talep veritabanına kaydedilemedi.', error);
    return null;
  }
}

async function updateMailDelivery(submissionId: string | null, delivered: boolean): Promise<void> {
  if (!submissionId) return;

  try {
    await prisma.formSubmission.update({
      where: { id: submissionId },
      data: { mailDelivered: delivered },
    });
  } catch (error) {
    console.error('[form] Talebin e-posta teslim durumu güncellenemedi.', error);
  }
}

/**
 * Sıra sabittir: doğrula → honeypot/süre → oran sınırı → kaydet → e-posta.
 * E-posta başarısız olsa da veritabanındaki talep korunur.
 */
export async function submitAppointment(
  raw: unknown,
  localeInput: string,
): Promise<FormResult> {
  const locale = resolveLocale(localeInput);
  const parsed = appointmentSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: 'validation',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    console.warn('[form] Bot şüphesi, gönderim sessizce yok sayıldı.');
    return { ok: true };
  }

  if (!(await checkRateLimit(await clientIp(), 'appointment'))) {
    return { ok: false, error: 'rate_limit' };
  }

  const [t, clinic, service, submissionId] = await Promise.all([
    getTranslations('mail'),
    getClinic(),
    data.serviceId === 'other'
      ? Promise.resolve(null)
      : getServiceById(locale, data.serviceId),
    persistSubmission({
      kind: 'APPOINTMENT',
      locale,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      preferredDate: data.preferredDate || null,
      serviceKey: data.serviceId,
      message: data.message || null,
    }),
  ]);

  const rows = [
    { label: t('fields.fullName'), value: data.fullName },
    { label: t('fields.phone'), value: data.phone },
    { label: t('fields.email'), value: data.email },
    { label: t('fields.preferredDate'), value: data.preferredDate ?? '' },
    { label: t('fields.service'), value: service?.title ?? t('fields.otherService') },
    { label: t('fields.message'), value: data.message ?? '' },
  ];

  const { clinicSent } = await sendFormMails({
    userEmail: data.email,
    fallbackTo: clinic.contact.appointmentEmail,
    clinic: buildMail(
      `${t('appointment.clinicSubject')} — ${data.fullName}`,
      t('appointment.clinicTitle'),
      rows,
    ),
    user: buildMail(
      t('appointment.userSubject'),
      t('appointment.userTitle'),
      rows,
      t('appointment.userFooter', { phone: clinic.contact.phoneFormatted }),
    ),
  });

  await updateMailDelivery(submissionId, clinicSent);
  return clinicSent ? { ok: true } : { ok: false, error: 'mail_failed' };
}

export async function submitContact(raw: unknown, localeInput: string): Promise<FormResult> {
  const locale = resolveLocale(localeInput);
  const parsed = contactSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: 'validation',
      fieldErrors: zodFieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    console.warn('[form] Bot şüphesi, gönderim sessizce yok sayıldı.');
    return { ok: true };
  }

  if (!(await checkRateLimit(await clientIp(), 'contact'))) {
    return { ok: false, error: 'rate_limit' };
  }

  const [t, clinic, submissionId] = await Promise.all([
    getTranslations('mail'),
    getClinic(),
    persistSubmission({
      kind: 'CONTACT',
      locale,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.message,
    }),
  ]);

  const rows = [
    { label: t('fields.fullName'), value: data.fullName },
    { label: t('fields.email'), value: data.email },
    { label: t('fields.phone'), value: data.phone },
    { label: t('fields.message'), value: data.message },
  ];

  const { clinicSent } = await sendFormMails({
    userEmail: data.email,
    fallbackTo: clinic.contact.appointmentEmail,
    clinic: buildMail(
      `${t('contact.clinicSubject')} — ${data.fullName}`,
      t('contact.clinicTitle'),
      rows,
    ),
    user: buildMail(
      t('contact.userSubject'),
      t('contact.userTitle'),
      rows,
      t('contact.userFooter', { phone: clinic.contact.phoneFormatted }),
    ),
  });

  await updateMailDelivery(submissionId, clinicSent);
  return clinicSent ? { ok: true } : { ok: false, error: 'mail_failed' };
}
