import { z } from 'zod';

/**
 * Form şemaları — istemci (react-hook-form) ve sunucu (Server Action)
 * AYNI şemayı kullanır. İki yerde tanımlanırsa er geç ayrışırlar ve
 * istemcide geçen bir değer sunucuda reddedilir.
 *
 * Hata mesajları anahtar olarak tutulur; metin `messages` üzerinden
 * dört dilde çevrilir (code-standards.md → Server Actions ve Formlar).
 */

/** TR ve uluslararası biçimleri kabul eder: 0542..., +90542..., boşluklu. */
const phonePattern = /^[+]?[\d\s()-]{10,20}$/;

/**
 * Bot tuzağı: gerçek kullanıcı bu alanı göremez, dolduramaz.
 *
 * Şema burada REDDETMEZ — dolu gelirse doğrulama hatası dönerdi ve bu,
 * bota "bu alanı boş bırak" diye öğretirdi. Alan serbestçe kabul edilir;
 * Server Action dolu olduğunu görünce sessizce BAŞARI döner ve mail
 * göndermez (SPEC-010 kararı).
 */
const honeypot = z.string().optional();

const baseFields = {
  fullName: z.string().trim().min(2, 'fullNameMin').max(80, 'fullNameMax'),
  email: z.string().trim().email('emailInvalid'),
  phone: z.string().trim().regex(phonePattern, 'phoneInvalid'),
  /**
   * Onay kutusu.
   *
   * Tarayıcı, `value` verilmemiş bir checkbox'a varsayılan olarak "on"
   * atar ve react-hook-form bunu boolean yerine string olarak iletir.
   * Sunucu tarafında ise düz boolean gelir. preprocess ikisini de
   * normalleştirir — aksi halde onay verilmiş form "onay verilmedi"
   * diye reddedilir.
   */
  consent: z.preprocess(
    (value) => value === true || value === 'on',
    z.literal(true, { errorMap: () => ({ message: 'consentRequired' }) }),
  ),
  website: honeypot,
  startedAt: z.number().int().positive(),
};

export const appointmentSchema = z.object({
  ...baseFields,
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'preferredDateInvalid')
    .refine((value) => {
      // Geçmiş tarihe randevu talebi anlamsız; bugün dahil kabul edilir.
      const today = new Date().toISOString().slice(0, 10);
      return value >= today;
    }, 'preferredDatePast')
    .optional()
    .or(z.literal('')),
  serviceId: z.string().trim().min(1, 'serviceIdRequired'),
  message: z.string().trim().max(2000, 'messageMax').optional(),
});

export const contactSchema = z.object({
  ...baseFields,
  message: z.string().trim().min(10, 'messageMin').max(2000, 'messageMax'),
});

/**
 * İstemci sürümleri sunucu şemasından TÜRETİLİR — ikinci bir tanım değil.
 * `startedAt` form alanı değil; bileşen mount anında üretip gönderim
 * sırasında ekler. Form state'inde tutmak `Date.now()`'ı render'a sokuyordu.
 */
export const appointmentClientSchema = appointmentSchema.omit({ startedAt: true });
export const contactClientSchema = contactSchema.omit({ startedAt: true });

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
/**
 * `consent` preprocess'li olduğu için şemanın GİRDİ ve ÇIKTI tipleri farklı:
 * girdide `unknown` (checkbox "on" da olabilir), çıktıda `true`.
 * Form state girdi tipini, submit handler çıktı tipini kullanır.
 */
export type AppointmentFormValues = z.input<typeof appointmentClientSchema>;
export type ContactFormValues = z.input<typeof contactClientSchema>;
export type AppointmentClientInput = z.output<typeof appointmentClientSchema>;
export type ContactClientInput = z.output<typeof contactClientSchema>;

/** Action'ların tek tip dönüşü — istemci `error` koduna göre metin seçer. */
export type FormResult =
  | { ok: true }
  | {
      ok: false;
      error: 'validation' | 'rate_limit' | 'mail_failed';
      fieldErrors?: Record<string, string>;
    };
