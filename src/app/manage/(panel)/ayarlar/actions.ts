'use server';

import { revalidatePath } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { clinicSchema } from '@/lib/content/schemas';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { saveClinicSettings } from '@/lib/admin/site-settings';

export type ClinicSettingsActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(formData: FormData, name: string): string | undefined {
  return text(formData, name) || undefined;
}

export async function saveClinicSettingsAction(
  _previous: ClinicSettingsActionResult,
  formData: FormData,
): Promise<ClinicSettingsActionResult> {
  const session = await requireAdmin();
  let openingHours: unknown = null;
  try {
    const rawOpeningHours = text(formData, 'openingHours');
    openingHours = rawOpeningHours ? (JSON.parse(rawOpeningHours) as unknown) : null;
  } catch {
    return { ok: false, error: 'Çalışma saatleri okunamadı.' };
  }

  const latitude = text(formData, 'address.geo.latitude');
  const longitude = text(formData, 'address.geo.longitude');
  const parsed = clinicSchema.safeParse({
    name: text(formData, 'name'),
    legalName: text(formData, 'legalName'),
    slogan: text(formData, 'slogan'),
    description: text(formData, 'description'),
    foundingDate: text(formData, 'foundingDate') || null,
    doctor: {
      name: text(formData, 'doctor.name'),
      title: text(formData, 'doctor.title'),
      specialty: text(formData, 'doctor.specialty'),
    },
    contact: {
      phone: text(formData, 'contact.phone'),
      phoneFormatted: text(formData, 'contact.phoneFormatted'),
      whatsapp: text(formData, 'contact.whatsapp'),
      whatsappFormatted: text(formData, 'contact.whatsappFormatted'),
      email: text(formData, 'contact.email'),
      appointmentEmail: text(formData, 'contact.appointmentEmail'),
    },
    address: {
      street: text(formData, 'address.street'),
      district: text(formData, 'address.district'),
      city: text(formData, 'address.city'),
      postalCode: text(formData, 'address.postalCode'),
      country: text(formData, 'address.country'),
      formatted: text(formData, 'address.formatted'),
      geo:
        latitude || longitude
          ? { latitude: Number(latitude), longitude: Number(longitude) }
          : null,
    },
    social: {
      instagram: optionalText(formData, 'social.instagram'),
      facebook: optionalText(formData, 'social.facebook'),
      youtube: optionalText(formData, 'social.youtube'),
      linkedin: optionalText(formData, 'social.linkedin'),
    },
    openingHours,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path.join('.')] ??= issue.message;
    }
    return {
      ok: false,
      error: 'Klinik künyesindeki alanları kontrol edin.',
      fieldErrors,
    };
  }

  try {
    // Zod doğrulamasından geçen düz JSON nesnesi Prisma JSON giriş sözleşmesine uygundur.
    await saveClinicSettings(parsed.data as Prisma.InputJsonValue);
    await recordAudit({
      action: 'settings.clinic.update',
      entity: 'SiteSettings',
      actorId: session.id,
      actorEmail: session.email,
      summary: 'Klinik künyesi güncellendi',
    });
    revalidatePath('/manage/ayarlar');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Klinik künyesi kaydedildi.' };
  } catch (error) {
    console.error('[manage/settings] Klinik künyesi kaydedilemedi.', error);
    return { ok: false, error: 'Klinik künyesi kaydedilemedi.' };
  }
}
