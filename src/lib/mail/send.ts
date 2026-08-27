import { getMailConfig, getTransport } from './transport';
import type { MailBody } from './templates';

type SendResult = { clinicSent: boolean; userSent: boolean };

/**
 * İki mail gönderir: kliniğe talep, kullanıcıya onay.
 *
 * Kullanıcı maili gönderilemezse akış BAŞARILI sayılır — klinik maili
 * gittiyse talep kaybolmamıştır (code-standards.md → Mail).
 */
export async function sendFormMails(options: {
  clinic: MailBody;
  user: MailBody;
  userEmail: string;
  /** MAIL_TO tanımsızsa kullanılacak klinik adresi (clinic.json künyesi). */
  fallbackTo?: string;
}): Promise<SendResult> {
  const transport = getTransport();
  const config = getMailConfig(options.fallbackTo);

  if (!transport || !config) {
    return { clinicSent: false, userSent: false };
  }

  let clinicSent = false;
  let userSent = false;

  try {
    await transport.sendMail({
      from: config.from,
      to: config.to,
      // Klinik doğrudan yanıtlayabilsin diye kullanıcının adresi.
      replyTo: options.userEmail,
      subject: options.clinic.subject,
      text: options.clinic.text,
      html: options.clinic.html,
    });
    clinicSent = true;
  } catch (error) {
    console.error('[mail] Klinik maili gönderilemedi:', error);
    return { clinicSent: false, userSent: false };
  }

  try {
    await transport.sendMail({
      from: config.from,
      to: options.userEmail,
      subject: options.user.subject,
      text: options.user.text,
      html: options.user.html,
    });
    userSent = true;
  } catch (error) {
    // Kullanıcı onay maili kritik değil; talep kliniğe ulaştı.
    console.error('[mail] Kullanıcı onay maili gönderilemedi:', error);
  }

  return { clinicSent, userSent };
}
