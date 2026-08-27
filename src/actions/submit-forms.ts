'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import {
  appointmentSchema,
  contactSchema,
  type FormResult,
} from '@/lib/schemas/forms';
import { buildMail } from '@/lib/mail/templates';
import { sendFormMails } from '@/lib/mail/send';
import { checkRateLimit } from '@/lib/rate-limit';
import { getClinic, getServiceById } from '@/lib/content';
import { routing, type Locale } from '@/lib/i18n';

/** Botların form doldurma hızının altında kalan insan yoktur. */
const MIN_FILL_MS = 3000;

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

function resolveLocale(value: unknown): Locale {
  return routing.locales.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

/**
 * Sıra sabittir: doğrula → honeypot → süre → oran sınırı → mail.
 * Doğrulama geçmeden hiçbir yan etki tetiklenmez.
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

  // Honeypot ve süre kontrolü: bota BAŞARI gösterilir ama hiçbir şey
  // gönderilmez. Hata gösterirsek bot alanı boş bırakmayı öğrenir.
  if (data.website || Date.now() - data.startedAt < MIN_FILL_MS) {
    console.warn('[form] Bot şüphesi, gönderim sessizce yok sayıldı.');
    return { ok: true };
  }

  if (!(await checkRateLimit(await clientIp(), 'appointment'))) {
    return { ok: false, error: 'rate_limit' };
  }

  const t = await getTranslations({ locale, namespace: 'mail' });
  const clinic = getClinic();
  const service =
    data.serviceId === 'other'
      ? null
      : await getServiceById(locale, data.serviceId);

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

  return clinicSent ? { ok: true } : { ok: false, error: 'mail_failed' };
}

export async function submitContact(
  raw: unknown,
  localeInput: string,
): Promise<FormResult> {
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

  const t = await getTranslations({ locale, namespace: 'mail' });
  const clinic = getClinic();

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

  return clinicSent ? { ok: true } : { ok: false, error: 'mail_failed' };
}
