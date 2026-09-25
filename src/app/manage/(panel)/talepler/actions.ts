'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';

export type SubmissionActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const idSchema = z.string().trim().min(1);
const statusSchema = z.enum(['READ', 'ARCHIVED']);

export async function updateSubmissionStatusAction(
  id: string,
  status: 'READ' | 'ARCHIVED',
): Promise<SubmissionActionResult> {
  const session = await requireAdmin();
  const input = z.object({ id: idSchema, status: statusSchema }).safeParse({ id, status });
  if (!input.success) return { ok: false, error: 'Geçersiz talep işlemi.' };

  try {
    const submission = await prisma.formSubmission.update({
      where: { id: input.data.id },
      data: {
        status: input.data.status,
        ...(input.data.status === 'READ' ? { readAt: new Date() } : {}),
      },
      select: { fullName: true },
    });
    await recordAudit({
      action: input.data.status === 'READ' ? 'submission.read' : 'submission.archive',
      entity: 'FormSubmission',
      entityId: input.data.id,
      actorId: session.id,
      actorEmail: session.email,
      summary:
        input.data.status === 'READ'
          ? `${submission.fullName} talebi okundu işaretlendi`
          : `${submission.fullName} talebi arşivlendi`,
    });
    revalidatePath('/manage/talepler');
    revalidatePath(`/manage/talepler/${input.data.id}`);
    return {
      ok: true,
      message: input.data.status === 'READ' ? 'Talep okundu işaretlendi.' : 'Talep arşivlendi.',
    };
  } catch (error) {
    console.error('[manage/submissions] Talep durumu güncellenemedi.', error);
    return { ok: false, error: 'Talep durumu güncellenemedi.' };
  }
}

export async function deleteSubmissionAction(id: string): Promise<SubmissionActionResult> {
  const session = await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'Geçersiz talep kaydı.' };

  try {
    const submission = await prisma.formSubmission.delete({
      where: { id: parsedId.data },
      select: { fullName: true },
    });
    await recordAudit({
      action: 'submission.delete',
      entity: 'FormSubmission',
      entityId: parsedId.data,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${submission.fullName} talebi silindi`,
    });
    revalidatePath('/manage/talepler');
    return { ok: true, message: 'Talep kalıcı olarak silindi.' };
  } catch (error) {
    console.error('[manage/submissions] Talep silinemedi.', error);
    return { ok: false, error: 'Talep silinemedi.' };
  }
}
