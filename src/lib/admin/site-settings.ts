import 'server-only';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { clinicSchema } from '@/lib/content/schemas';
import type { Clinic } from '@/lib/content/types';

export const DEFAULT_SUBMISSION_RETENTION_DAYS = 180;

export async function getClinicSettings(): Promise<Clinic | null> {
  if (!hasDatabase()) return null;

  const settings = await prisma.siteSettings.findUnique({
    where: { singleton: true },
    select: { clinic: true },
  });
  if (!settings?.clinic) return null;

  const parsed = clinicSchema.safeParse(settings.clinic);
  if (!parsed.success) {
    console.error('[site-settings] Veritabanındaki klinik künyesi geçersiz.', parsed.error);
    return null;
  }
  return parsed.data;
}

export async function saveClinicSettings(clinic: Prisma.InputJsonValue): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { singleton: true },
    create: { singleton: true, clinic },
    update: { clinic },
  });
}

export async function getSubmissionRetentionDays(): Promise<number> {
  if (!hasDatabase()) return DEFAULT_SUBMISSION_RETENTION_DAYS;

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { singleton: true },
      select: { submissionRetentionDays: true },
    });
    return settings?.submissionRetentionDays ?? DEFAULT_SUBMISSION_RETENTION_DAYS;
  } catch (error) {
    console.error('[site-settings] Talep saklama süresi okunamadı.', error);
    return DEFAULT_SUBMISSION_RETENTION_DAYS;
  }
}

export async function purgeExpiredSubmissions(now = new Date()): Promise<number> {
  if (!hasDatabase()) return 0;

  try {
    const result = await prisma.formSubmission.deleteMany({
      where: { retentionUntil: { lte: now } },
    });
    return result.count;
  } catch (error) {
    console.error('[site-settings] Süresi dolan talepler silinemedi.', error);
    return 0;
  }
}
