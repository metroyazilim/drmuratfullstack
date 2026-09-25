'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { useActionState, useState } from 'react';
import type { Clinic } from '@/lib/content/types';
import {
  cardPadded,
  fieldError,
  fieldHint,
  fieldInput,
  fieldLabel,
  fieldSuccess,
  fieldTextarea,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from '@/components/admin/ui';
import { saveClinicSettingsAction, type ClinicSettingsActionResult } from './actions';

const initialState: ClinicSettingsActionResult = { ok: true };
type OpeningHour = NonNullable<Clinic['openingHours']>[number];
function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  required = true,
  step,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className={fieldLabel}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className={fieldInput}
      />
    </label>
  );
}

export function ClinicSettingsForm({ clinic }: { clinic: Clinic }) {
  const [state, action, pending] = useActionState(saveClinicSettingsAction, initialState);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(clinic.openingHours ?? []);

  function updateOpeningHour(index: number, value: OpeningHour) {
    setOpeningHours((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="openingHours" value={JSON.stringify(openingHours)} />

      <section className={cardPadded}>
        <h2 className={sectionTitle}>Klinik kimliği</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Klinik adı" name="name" defaultValue={clinic.name} />
          <Field label="Yasal unvan" name="legalName" defaultValue={clinic.legalName} />
          <Field label="Slogan" name="slogan" defaultValue={clinic.slogan} />
          <Field
            label="Kuruluş tarihi"
            name="foundingDate"
            type="date"
            required={false}
            defaultValue={clinic.foundingDate ?? ''}
          />
          <label className={`${fieldLabel} md:col-span-2`}>
            Açıklama
            <textarea
              name="description"
              defaultValue={clinic.description}
              required
              rows={5}
              className={fieldTextarea}
            />
          </label>
        </div>
      </section>

      <section className={cardPadded}>
        <h2 className={sectionTitle}>Hekim bilgileri</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="Ad soyad" name="doctor.name" defaultValue={clinic.doctor.name} />
          <Field label="Unvan" name="doctor.title" defaultValue={clinic.doctor.title} />
          <Field
            label="Uzmanlık"
            name="doctor.specialty"
            defaultValue={clinic.doctor.specialty}
          />
        </div>
      </section>

      <section className={cardPadded}>
        <h2 className={sectionTitle}>İletişim bilgileri</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Telefon" name="contact.phone" defaultValue={clinic.contact.phone} />
          <Field
            label="Telefon görünümü"
            name="contact.phoneFormatted"
            defaultValue={clinic.contact.phoneFormatted}
          />
          <Field label="WhatsApp" name="contact.whatsapp" defaultValue={clinic.contact.whatsapp} />
          <Field
            label="WhatsApp görünümü"
            name="contact.whatsappFormatted"
            defaultValue={clinic.contact.whatsappFormatted}
          />
          <Field
            label="E-posta"
            name="contact.email"
            type="email"
            defaultValue={clinic.contact.email}
          />
          <Field
            label="Randevu e-postası"
            name="contact.appointmentEmail"
            type="email"
            defaultValue={clinic.contact.appointmentEmail}
          />
        </div>
      </section>

      <section className={cardPadded}>
        <h2 className={sectionTitle}>Adres</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={`${fieldLabel} md:col-span-2`}>
            Sokak adresi
            <textarea
              name="address.street"
              defaultValue={clinic.address.street}
              required
              rows={3}
              className={fieldTextarea}
            />
          </label>
          <Field
            label="İlçe"
            name="address.district"
            defaultValue={clinic.address.district}
          />
          <Field label="Şehir" name="address.city" defaultValue={clinic.address.city} />
          <Field
            label="Posta kodu"
            name="address.postalCode"
            defaultValue={clinic.address.postalCode}
          />
          <Field label="Ülke kodu" name="address.country" defaultValue={clinic.address.country} />
          <label className={`${fieldLabel} md:col-span-2`}>
            Biçimlendirilmiş adres
            <textarea
              name="address.formatted"
              defaultValue={clinic.address.formatted}
              required
              rows={3}
              className={fieldTextarea}
            />
          </label>
          <Field
            step="any"
            label="Enlem"
            name="address.geo.latitude"
            type="number"
            required={false}
            defaultValue={clinic.address.geo?.latitude ?? ''}
          />
          <Field
            label="Boylam"
            name="address.geo.longitude"
            type="number"
            required={false}
            defaultValue={clinic.address.geo?.longitude ?? ''}
          />
        </div>
      </section>

      <section className={cardPadded}>
        <h2 className={sectionTitle}>Sosyal medya</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field
            label="Instagram"
            name="social.instagram"
            type="url"
            required={false}
            defaultValue={clinic.social.instagram ?? ''}
          />
          <Field
            label="Facebook"
            name="social.facebook"
            type="url"
            required={false}
            defaultValue={clinic.social.facebook ?? ''}
          />
          <Field
            label="YouTube"
            name="social.youtube"
            type="url"
            required={false}
            defaultValue={clinic.social.youtube ?? ''}
          />
          <Field
            label="LinkedIn"
            name="social.linkedin"
            type="url"
            required={false}
            defaultValue={clinic.social.linkedin ?? ''}
          />
        </div>
      </section>

      <section className={cardPadded}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={sectionTitle}>Çalışma saatleri</h2>
            <p className={fieldHint}>Günleri virgülle ayırın: Pazartesi, Salı, Çarşamba</p>
          </div>
          <button
            type="button"
            className={secondaryButton}
            onClick={() =>
              setOpeningHours((current) => [
                ...current,
                { days: ['Pazartesi'], opens: '09:00', closes: '18:00' },
              ])
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Satır ekle
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {openingHours.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border-default bg-bg-surface p-5 text-sm text-text-muted">
              Çalışma saati tanımlanmamış.
            </p>
          ) : null}
          {openingHours.map((item, index) => (
            <div
              key={`${index}-${item.opens}`}
              className="grid gap-3 rounded-lg border border-border-default bg-bg-surface p-4 md:grid-cols-4"
            >
              <label className={`${fieldLabel} md:col-span-2`}>
                Günler
                <input
                  value={item.days.join(', ')}
                  onChange={(event) =>
                    updateOpeningHour(index, {
                      ...item,
                      days: event.target.value
                        .split(',')
                        .map((day) => day.trim())
                        .filter(Boolean),
                    })
                  }
                  className={fieldInput}
                />
              </label>
              <label className={fieldLabel}>
                Açılış
                <input
                  type="time"
                  value={item.opens}
                  onChange={(event) =>
                    updateOpeningHour(index, { ...item, opens: event.target.value })
                  }
                  className={fieldInput}
                />
              </label>
              <label className={fieldLabel}>
                Kapanış
                <input
                  type="time"
                  value={item.closes}
                  onChange={(event) =>
                    updateOpeningHour(index, { ...item, closes: event.target.value })
                  }
                  className={fieldInput}
                />
              </label>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-state-error md:col-span-4"
                onClick={() =>
                  setOpeningHours((current) =>
                    current.filter((_hour, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Satırı sil
              </button>
            </div>
          ))}
        </div>
      </section>

      {!state.ok ? (
        <div className={fieldError} role="alert">
          <p>{state.error}</p>
          {state.fieldErrors ? (
            <ul className="mt-2 list-disc ps-5 text-xs">
              {Object.entries(state.fieldErrors).map(([field, message]) => (
                <li key={field}>
                  {field}: {message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : state.message ? (
        <p className={fieldSuccess} role="status">
          {state.message}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={primaryButton}>
        <Save className="size-4" aria-hidden="true" />
        {pending ? 'Kaydediliyor…' : 'Klinik künyesini kaydet'}
      </button>
    </form>
  );
}
