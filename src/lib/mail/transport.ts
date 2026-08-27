import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP transport'u modül seviyesinde bir kez kurulur.
 *
 * Bilgiler eksikse `null` döner — build kırılmaz, sayfa çalışır, form
 * denendiğinde anlaşılır bir hata verir. Sessizce "gönderildi" demek
 * yasak: kaybolan bir randevu talebi, görünen bir hatadan kötüdür.
 */
let cached: Transporter | null | undefined;

export type MailConfig = {
  from: string;
  to: string;
};

/**
 * Parola değişkeni iki adla da okunur.
 *
 * Vercel panelinde `SMTP_PASS` yazmak yaygın (çoğu şablon böyle);
 * bu proje `SMTP_PASSWORD` ile başlamıştı. İkisini de kabul etmek,
 * yanlış isim yüzünden formun sessizce ölmesini engeller.
 */
function smtpPassword(): string | undefined {
  return process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
}

/**
 * @param fallbackTo `MAIL_TO` tanımsızsa kullanılacak klinik adresi.
 *   Çağıran taraf künyeden (clinic.json) verir — randevu talebinin
 *   gideceği yer, unutulmuş bir ortam değişkenine bağlı olamaz.
 *   Mail modülü içerik katmanını kendisi OKUMAZ; bağımlılık tek yönlü kalır.
 */
export function getMailConfig(fallbackTo?: string): MailConfig | null {
  // Outlook/Hotmail SMTP, gönderen adresinin kimlik doğrulanan kullanıcıyla
  // aynı olmasını şart koşar; SMTP_FROM boşsa SMTP_USER'a düşmek doğru
  // davranış — "eksik" diye formu kapatmaktan iyi.
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const to = process.env.MAIL_TO || fallbackTo;

  if (!from || !to) return null;
  return { from, to };
}

export function getTransport(): Transporter | null {
  if (cached !== undefined) return cached;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = smtpPassword();

  if (!host || !port || !user || !pass) {
    console.warn(
      '[mail] SMTP yapılandırması eksik — form gönderimleri mail_failed dönecek. ' +
        'Gerekli değişkenler: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM',
    );
    cached = null;
    return cached;
  }

  cached = nodemailer.createTransport({
    host,
    port: Number(port),
    // 465 → örtük TLS; 587/25 → STARTTLS ile yükseltilir.
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return cached;
}
