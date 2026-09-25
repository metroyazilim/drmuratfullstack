'use client';

import { ArrowRight, Download, Plus, Trash2 } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { EmptyState } from '@/components/admin/EmptyState';
import { Toast } from '@/components/admin/Toast';
import {
  cardPadded,
  checkboxInput,
  dangerLinkButton,
  fieldInput,
  fieldLabel,
  fieldTextarea,
  primaryButton,
  secondaryButton,
  table,
  tableBody,
  tableCell,
  tableHeadCell,
  tableHeadRow,
  tableRow,
  tableWrap,
} from '@/components/admin/ui';
import {
  createRedirectAction,
  deleteRedirectAction,
  importLegacyRedirectsAction,
  type RedirectActionResult,
  updateRedirectAction,
} from './actions';

export type RedirectRow = Readonly<{
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
  isActive: boolean;
  note: string | null;
  chainDestination: string | null;
}>;

export type LegacyRedirectRow = Readonly<{
  source: string;
  destination: string;
  imported: boolean;
}>;

const INITIAL_RESULT: RedirectActionResult = { ok: true };

function ResultMessage({ result }: { result: RedirectActionResult }) {
  if (result.ok && !result.message) return null;
  return <Toast message={result.ok ? (result.message ?? '') : result.error} tone={result.ok ? 'success' : 'error'} />;
}

function CreateRedirectForm() {
  const [result, action, pending] = useActionState(createRedirectAction, INITIAL_RESULT);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result.ok && result.message) formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={action} className={`${cardPadded} space-y-4`}>
      <div className="flex items-center gap-2">
        <Plus className="size-4 text-accent-primary" aria-hidden="true" />
        <h2 className="text-sm font-bold text-text-primary">Yeni yönlendirme</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={fieldLabel}>
          Kaynak adres
          <input
            name="source"
            required
            placeholder="/eski-adres"
            autoComplete="off"
            className={fieldInput}
          />
        </label>
        <label className={fieldLabel}>
          Hedef adres
          <input
            name="destination"
            required
            placeholder="/tr/yeni-adres"
            autoComplete="off"
            className={fieldInput}
          />
        </label>
      </div>
      <label className={fieldLabel}>
        Not
        <textarea name="note" rows={2} className={fieldTextarea} />
      </label>
      <div className="flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input name="permanent" type="checkbox" defaultChecked className={checkboxInput} />
          Kalıcı yönlendirme (308)
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input name="isActive" type="checkbox" defaultChecked className={checkboxInput} />
          Etkin
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ResultMessage result={result} />
        <button type="submit" disabled={pending} className={primaryButton}>
          <Plus className="size-4" aria-hidden="true" />
          {pending ? 'Ekleniyor…' : 'Yönlendirme ekle'}
        </button>
      </div>
    </form>
  );
}

function RedirectEditor({ redirect }: { redirect: RedirectRow }) {
  const [updateResult, updateAction, updatePending] = useActionState(
    updateRedirectAction,
    INITIAL_RESULT,
  );
  const [deleteResult, deleteAction, deletePending] = useActionState(
    deleteRedirectAction,
    INITIAL_RESULT,
  );

  return (
    <div className={cardPadded}>
      <form action={updateAction} className="space-y-4">
        <input type="hidden" name="id" value={redirect.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className={fieldLabel}>
            Kaynak adres
            <input name="source" defaultValue={redirect.source} required className={fieldInput} />
          </label>
          <label className={fieldLabel}>
            Hedef adres
            <input
              name="destination"
              defaultValue={redirect.destination}
              required
              className={fieldInput}
            />
          </label>
        </div>
        <label className={fieldLabel}>
          Not
          <textarea name="note" defaultValue={redirect.note ?? ''} rows={2} className={fieldTextarea} />
        </label>
        <div className="flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              name="permanent"
              type="checkbox"
              defaultChecked={redirect.permanent}
              className={checkboxInput}
            />
            Kalıcı (308)
          </label>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={redirect.isActive}
              className={checkboxInput}
            />
            Etkin
          </label>
        </div>
        {redirect.chainDestination ? (
          <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-accent-primary">
            Zincir uyarısı: hedef adres başka bir kaynağa bağlı ve ardından{' '}
            {redirect.chainDestination} adresine yönleniyor.
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4">
          <ResultMessage result={updateResult} />
          <button type="submit" disabled={updatePending} className={secondaryButton}>
            {updatePending ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
          </button>
        </div>
      </form>
      <form action={deleteAction} className="mt-3 flex items-center justify-between gap-3">
        <input type="hidden" name="id" value={redirect.id} />
        <ResultMessage result={deleteResult} />
        <ConfirmButton
          type="submit"
          confirmText="Bu yönlendirmeyi kalıcı olarak silmek istiyor musunuz?"
          disabled={deletePending}
          className={dangerLinkButton}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {deletePending ? 'Siliniyor…' : 'Sil'}
        </ConfirmButton>
      </form>
    </div>
  );
}

function LegacyRedirects({ redirects }: { redirects: readonly LegacyRedirectRow[] }) {
  const [result, action, pending] = useActionState(importLegacyRedirectsAction, INITIAL_RESULT);
  const missingCount = redirects.filter((redirect) => !redirect.imported).length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Kod içindeki yönlendirmeler</h2>
          <p className="mt-1 text-sm text-text-muted">
            Eski siteden taşınan bu liste salt okunurdur. Eksik kayıtları veritabanına aktarabilirsiniz.
          </p>
        </div>
        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="confirm" value="legacy" />
          <ResultMessage result={result} />
          <button type="submit" disabled={pending || missingCount === 0} className={secondaryButton}>
            <Download className="size-4" aria-hidden="true" />
            {pending ? 'İçe aktarılıyor…' : `${missingCount} eksik kaydı içe aktar`}
          </button>
        </form>
      </div>
      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr className={tableHeadRow}>
              <th className={tableHeadCell}>Kaynak</th>
              <th className={tableHeadCell}>Hedef</th>
              <th className={tableHeadCell}>Durum</th>
            </tr>
          </thead>
          <tbody className={tableBody}>
            {redirects.map((redirect) => (
              <tr key={redirect.source} className={tableRow}>
                <td className={tableCell}>{redirect.source}</td>
                <td className={tableCell}>
                  <span className="flex items-center gap-2">
                    <ArrowRight className="size-4 text-text-muted" aria-hidden="true" />
                    {redirect.destination}
                  </span>
                </td>
                <td className={tableCell}>
                  <span
                    className={
                      redirect.imported
                        ? 'text-sm font-semibold text-state-success'
                        : 'text-sm font-semibold text-text-muted'
                    }
                  >
                    {redirect.imported ? 'Kayıtlı' : 'Eksik'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RedirectsManager({
  redirects,
  legacyRedirects,
}: {
  redirects: readonly RedirectRow[];
  legacyRedirects: readonly LegacyRedirectRow[];
}) {
  return (
    <div className="space-y-8">
      <CreateRedirectForm />
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-text-primary">Veritabanı yönlendirmeleri</h2>
        {redirects.length === 0 ? (
          <EmptyState title="Henüz veritabanı yönlendirmesi yok" />
        ) : (
          <div className="space-y-4">
            {redirects.map((redirect) => (
              <RedirectEditor key={redirect.id} redirect={redirect} />
            ))}
          </div>
        )}
      </section>
      <LegacyRedirects redirects={legacyRedirects} />
    </div>
  );
}
