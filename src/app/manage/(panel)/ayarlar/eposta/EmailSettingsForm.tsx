'use client';

import { PlugZap, Save, Send } from 'lucide-react';
import { useActionState, useState, useTransition } from 'react';
import { PasswordInput } from '@/components/admin/PasswordInput';
import {
  cardPadded,
  checkboxInput,
  fieldError,
  fieldHint,
  fieldInput,
  fieldLabel,
  fieldSuccess,
  helpText,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from '@/components/admin/ui';
import {
  saveEmailSettingsAction,
  sendTestEmailAction,
  testMailConnectionAction,
  type EmailActionResult,
} from './actions';

export type EmailSettingsValues = {
  smtpHost: string;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string;
  smtpFrom: string;
  mailTo: string;
  submissionRetentionDays: number;
};

type Props = {
  settings: EmailSettingsValues;
  hasStoredPassword: boolean;
  source: 'database' | 'environment' | null;
  adminEmail: string;
};

const initialState: EmailActionResult = { ok: true };

function ResultMessage({ result }: { result: EmailActionResult | null }) {
  if (!result || (result.ok && !result.message)) return null;
  return (
    <p className={result.ok ? fieldSuccess : fieldError} role="status">
      {result.ok ? (result.message ?? '') : result.error}
    </p>
  );
}

function SourceBadge({ source }: { source: Props['source'] }) {
  const label =
    source === 'database'
      ? 'Veritabanı ayarları'
      : source === 'environment'
        ? 'Ortam değişkenleri'
        : 'Yapılandırılmamış';
  const tone =
    source === 'database'
      ? 'bg-state-success/10 text-state-success'
      : source === 'environment'
        ? 'bg-accent-soft text-accent-primary'
        : 'bg-state-error/10 text-state-error';

  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${tone}`}>
      {label}
    </span>
  );
}

export function EmailSettingsForm({
  settings,
  hasStoredPassword,
  source,
  adminEmail,
}: Props) {
  const [saveState, saveAction, savePending] = useActionState(
    saveEmailSettingsAction,
    initialState,
  );
  const [sendState, sendAction, sendPending] = useActionState(
    sendTestEmailAction,
    initialState,
  );
  const [connectionResult, setConnectionResult] = useState<EmailActionResult | null>(null);
  const [connectionPending, startConnectionTransition] = useTransition();

  function testConnection() {
    setConnectionResult(null);
    startConnectionTransition(async () => {
      setConnectionResult(await testMailConnectionAction());
    });
  }

  return (
    <div className="space-y-6">
      <section className={cardPadded}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={sectionTitle}>SMTP ayarları</h2>
            <p className={`${helpText} mt-1`}>
              Veritabanı ayarları varsa ortam değişkenlerinden önce kullanılır.
            </p>
          </div>
          <SourceBadge source={source} />
        </div>

        <form action={saveAction} className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className={fieldLabel}>
              SMTP sunucusu
              <input
                name="smtpHost"
                defaultValue={settings.smtpHost}
                placeholder="smtp.example.com"
                autoComplete="off"
                className={fieldInput}
              />
            </label>
            <label className={fieldLabel}>
              Port
              <input
                name="smtpPort"
                type="number"
                min={1}
                max={65_535}
                defaultValue={settings.smtpPort ?? ''}
                placeholder="465"
                className={fieldInput}
              />
            </label>
            <label className={fieldLabel}>
              Kullanıcı adı
              <input
                name="smtpUser"
                defaultValue={settings.smtpUser}
                autoComplete="username"
                className={fieldInput}
              />
            </label>
            <label className={fieldLabel}>
              Parola
              <PasswordInput
                name="smtpPassword"
                autoComplete="new-password"
                placeholder="Mevcut parolayı korumak için boş bırakın"
              />
              <span className={fieldHint}>
                {hasStoredPassword
                  ? 'Şifreli bir parola kayıtlıdır. Yalnızca değiştirmek için yeni parola girin.'
                  : 'Kayıtlı parola yoksa SMTP_PASS veya SMTP_PASSWORD ortam değişkeni kullanılır.'}
              </span>
            </label>
            <label className={fieldLabel}>
              Gönderen adresi
              <input
                name="smtpFrom"
                type="email"
                defaultValue={settings.smtpFrom}
                placeholder="klinik@example.com"
                className={fieldInput}
              />
            </label>
            <label className={fieldLabel}>
              Taleplerin gönderileceği adres
              <input
                name="mailTo"
                type="email"
                defaultValue={settings.mailTo}
                placeholder="randevu@example.com"
                className={fieldInput}
              />
            </label>
            <label className={fieldLabel}>
              Talep saklama süresi (gün)
              <input
                name="submissionRetentionDays"
                type="number"
                min={7}
                max={3650}
                required
                defaultValue={settings.submissionRetentionDays}
                className={fieldInput}
              />
              <span className={fieldHint}>7 ile 3650 gün arasında olmalıdır.</span>
            </label>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-text-primary">
            <input
              name="smtpSecure"
              type="checkbox"
              defaultChecked={settings.smtpSecure}
              className={checkboxInput}
            />
            Örtük TLS kullan (genellikle 465 portu)
          </label>

          <button type="submit" disabled={savePending} className={primaryButton}>
            <Save className="size-4" aria-hidden="true" />
            {savePending ? 'Kaydediliyor…' : 'E-posta ayarlarını kaydet'}
          </button>
          <ResultMessage result={saveState} />
        </form>
      </section>

      <section className={`${cardPadded} space-y-5`}>
        <div>
          <h2 className={sectionTitle}>SMTP testleri</h2>
          <p className={`${helpText} mt-1`}>
            Etkin ayarlarla bağlantıyı doğrulayın veya gerçek bir test e-postası gönderin.
          </p>
        </div>

        <div className="space-y-3 border-b border-border-default pb-5">
          <button
            type="button"
            onClick={testConnection}
            disabled={connectionPending}
            className={secondaryButton}
          >
            <PlugZap className="size-4" aria-hidden="true" />
            {connectionPending ? 'Test ediliyor…' : 'Bağlantıyı test et'}
          </button>
          <ResultMessage result={connectionResult} />
        </div>

        <form action={sendAction} className="space-y-3">
          <label className={fieldLabel}>
            Test alıcısı
            <input
              name="recipient"
              type="email"
              required
              defaultValue={adminEmail}
              className={fieldInput}
            />
          </label>
          <button type="submit" disabled={sendPending} className={secondaryButton}>
            <Send className="size-4" aria-hidden="true" />
            {sendPending ? 'Gönderiliyor…' : 'Test e-postası gönder'}
          </button>
          <ResultMessage result={sendState} />
        </form>
      </section>
    </div>
  );
}
