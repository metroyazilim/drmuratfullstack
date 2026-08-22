'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { submitContact } from '@/actions/submit-forms';
import {
  contactClientSchema,
  type ContactClientInput,
  type ContactFormValues,
} from '@/lib/schemas/forms';
import type { FormResult } from '@/lib/schemas/forms';

type ContactFormProps = {
  locale: string;
  submitLabel: string;
};

export function ContactForm({
  locale,
  submitLabel,
}: ContactFormProps) {
  const t = useTranslations('form');
  const [result, setResult] = useState<FormResult | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues, unknown, ContactClientInput>({
    resolver: zodResolver(contactClientSchema),
    defaultValues: { website: '' },
  });

  // Form açılış anı; sunucu bunu bot tespitinde kullanır.
  // useState'in lazy initializer'ı, Date.now()'u render'dan uzak tutar.
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (result?.ok) successRef.current?.focus();
  }, [result]);

  const message = (key?: string) => (key ? t(`errors.${key}`) : undefined);

  if (result?.ok) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border-state-success/30 bg-bg-base rounded-lg border p-6 text-center"
      >
        <CheckCircle2 className="text-state-success mx-auto h-8 w-8" aria-hidden="true" />
        <p className="text-text-primary mt-3 text-base font-semibold">
          {t('successTitle')}
        </p>
        <p className="text-text-muted mt-1 text-sm">{t('successBody')}</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        setResult(await submitContact({ ...values, startedAt }, locale));
        reset(values);
      })}
      className="space-y-4"
    >
      <p className="text-text-muted text-xs">{t('required')}</p>

      <div className="grid gct-4 sm:grid-cols-2">
        <Field id="ct-name" label={t('labels.fullName')} required error={message(errors.fullName?.message)}>
          {(p) => <Input {...p} {...register('fullName')} autoComplete="name" />}
        </Field>
        <Field id="ct-email" label={t('labels.email')} required error={message(errors.email?.message)}>
          {(p) => <Input {...p} {...register('email')} type="email" autoComplete="email" />}
        </Field>
      </div>

      <div>
        <Field id="ct-phone" label={t('labels.phone')} required error={message(errors.phone?.message)}>
          {(p) => <Input {...p} {...register('phone')} type="tel" autoComplete="tel" />}
        </Field>
      </div>

      <Field id="ct-message" label={t('labels.message')} required error={message(errors.message?.message)}>
        {(p) => <Textarea {...p} {...register('message')} />}
      </Field>

      {/* Honeypot: ekran okuyucudan ve klavyeden gizli, ama display:none
          değil — bazı botlar öyle alanları atlar. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="ct-website">Website</label>
        <input id="ct-website" tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="bg-bg-tint rounded-md p-4">
        <label className="flex items-start gct-2.5 text-xs leading-relaxed">
          <input
            type="checkbox"
            {...register('consent')}
            aria-invalid={errors.consent ? true : undefined}
            className="accent-accent-primary mt-0.5 h-4 w-4 shrink-0"
          />
          <span className="text-text-primary">
            {t('consentLabel')}
            <span className="text-state-error ms-0.5" aria-hidden="true">*</span>
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="text-state-error mt-1.5 text-[0.8125rem]">
            {message(errors.consent.message)}
          </p>
        )}
      </div>

      {result && !result.ok && (
        <p role="alert" className="text-state-error text-sm">
          {t(`errors.${result.error}`)}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('submitting') : submitLabel}
      </Button>
    </form>
  );
}
