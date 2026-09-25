'use client';

import type { AdminRole } from '@prisma/client';
import { KeyRound, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { useActionState, useEffect, useRef } from 'react';
import { SelectField } from '@/components/ui/select-field';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { EmptyState } from '@/components/admin/EmptyState';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { Toast } from '@/components/admin/Toast';
import {
  cardPadded,
  dangerLinkButton,
  fieldHint,
  fieldInput,
  fieldLabel,
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
  changeAdminUserRoleAction,
  changeAdminUserStatusAction,
  createAdminUserAction,
  deleteAdminUserAction,
  sendAdminPasswordResetAction,
  type UserActionResult,
} from './actions';

export type AdminUserRow = Readonly<{
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}>;

const INITIAL_RESULT: UserActionResult = { ok: true };
const ROLES: readonly AdminRole[] = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'];
const ROLE_LABELS: Readonly<Record<AdminRole, string>> = {
  SUPER_ADMIN: 'Süper yönetici',
  ADMIN: 'Yönetici',
  EDITOR: 'Editör',
};

function ResultMessage({ result }: { result: UserActionResult }) {
  if (result.ok && !result.message) return null;
  return <Toast message={result.ok ? (result.message ?? '') : result.error} tone={result.ok ? 'success' : 'error'} />;
}

function CreateUserForm() {
  const [result, action, pending] = useActionState(createAdminUserAction, INITIAL_RESULT);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (result.ok && result.message) formRef.current?.reset();
  }, [result]);

  return (
    <form ref={formRef} action={action} className={`${cardPadded} space-y-4`}>
      <div>
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-accent-primary" aria-hidden="true" />
          <h2 className="text-sm font-bold text-text-primary">Yeni kullanıcı</h2>
        </div>
        <p className={fieldHint}>
          Kullanıcının ilk girişinde değiştirebileceği en az 12 karakterlik geçici parola belirleyin.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className={fieldLabel}>
          Ad soyad
          <input name="name" required autoComplete="off" className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          E-posta
          <input name="email" type="email" required autoComplete="off" className={fieldInput} />
        </label>
        <label className={fieldLabel}>
          Rol
          <SelectField
            name="role"
            defaultValue="EDITOR"
            placeholder="Rol seçin"
            className={fieldInput}
            options={ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
          />
        </label>
        <label className={fieldLabel}>
          Geçici parola
          <PasswordInput name="password" autoComplete="new-password" required />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ResultMessage result={result} />
        <button type="submit" disabled={pending} className={primaryButton}>
          <UserPlus className="size-4" aria-hidden="true" />
          {pending ? 'Oluşturuluyor…' : 'Kullanıcı oluştur'}
        </button>
      </div>
    </form>
  );
}

function UserActions({ user, currentUserId }: { user: AdminUserRow; currentUserId: string }) {
  const [roleResult, roleAction, rolePending] = useActionState(
    changeAdminUserRoleAction,
    INITIAL_RESULT,
  );
  const [statusResult, statusAction, statusPending] = useActionState(
    changeAdminUserStatusAction,
    INITIAL_RESULT,
  );
  const [resetResult, resetAction, resetPending] = useActionState(
    sendAdminPasswordResetAction,
    INITIAL_RESULT,
  );
  const [deleteResult, deleteAction, deletePending] = useActionState(
    deleteAdminUserAction,
    INITIAL_RESULT,
  );
  const isCurrentUser = user.id === currentUserId;

  return (
    <div className="min-w-64 space-y-3">
      <form action={roleAction} className="flex items-end gap-2">
        <input type="hidden" name="id" value={user.id} />
        <label className={`${fieldLabel} flex-1`}>
          Rol
          <SelectField
            name="role"
            defaultValue={user.role}
            disabled={isCurrentUser || rolePending}
            placeholder="Rol seçin"
            className={`${fieldInput} mt-1 py-1.5`}
            options={ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
          />
        </label>
        <button type="submit" disabled={isCurrentUser || rolePending} className={secondaryButton}>
          Kaydet
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <form action={statusAction}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="isActive" value={user.isActive ? 'false' : 'true'} />
          {user.isActive ? (
            <ConfirmButton
              type="submit"
              confirmText="Bu kullanıcı pasifleştirilecek ve açık oturumları kapatılacak. Devam edilsin mi?"
              disabled={isCurrentUser || statusPending}
              className={secondaryButton}
            >
              {statusPending ? 'İşleniyor…' : 'Pasifleştir'}
            </ConfirmButton>
          ) : (
            <button type="submit" disabled={statusPending} className={secondaryButton}>
              {statusPending ? 'İşleniyor…' : 'Etkinleştir'}
            </button>
          )}
        </form>
        <form action={resetAction}>
          <input type="hidden" name="id" value={user.id} />
          <button type="submit" disabled={!user.isActive || resetPending} className={secondaryButton}>
            <Mail className="size-4" aria-hidden="true" />
            {resetPending ? 'Gönderiliyor…' : 'Parola sıfırlama e-postası'}
          </button>
        </form>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={user.id} />
          <ConfirmButton
            type="submit"
            confirmText="Bu yönetim kullanıcısını kalıcı olarak silmek istiyor musunuz?"
            disabled={isCurrentUser || deletePending}
            className={dangerLinkButton}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {deletePending ? 'Siliniyor…' : 'Sil'}
          </ConfirmButton>
        </form>
      </div>
      <ResultMessage result={roleResult} />
      <ResultMessage result={statusResult} />
      <ResultMessage result={resetResult} />
      <ResultMessage result={deleteResult} />
    </div>
  );
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: readonly AdminUserRow[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-6">
      <CreateUserForm />
      {users.length === 0 ? (
        <EmptyState icon={Users} title="Henüz yönetim kullanıcısı yok" />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr className={tableHeadRow}>
                <th className={tableHeadCell}>Kullanıcı</th>
                <th className={tableHeadCell}>Rol ve durum</th>
                <th className={tableHeadCell}>Son giriş</th>
                <th className={tableHeadCell}>İşlemler</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {users.map((user) => (
                <tr key={user.id} className={tableRow}>
                  <td className={tableCell}>
                    <p className="font-semibold text-text-primary">{user.name}</p>
                    <p className="mt-1 text-xs text-text-muted">{user.email}</p>
                    {user.id === currentUserId ? (
                      <p className="mt-1 text-xs font-semibold text-accent-primary">Bu sizin hesabınız</p>
                    ) : null}
                  </td>
                  <td className={tableCell}>
                    <p className="font-semibold text-text-primary">{ROLE_LABELS[user.role]}</p>
                    <p
                      className={
                        user.isActive
                          ? 'mt-1 text-xs font-semibold text-state-success'
                          : 'mt-1 text-xs font-semibold text-state-error'
                      }
                    >
                      {user.isActive ? 'Etkin' : 'Pasif'}
                    </p>
                  </td>
                  <td className={`${tableCell} whitespace-nowrap`}>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString('tr-TR')
                      : 'Henüz giriş yapmadı'}
                  </td>
                  <td className={tableCell}>
                    <UserActions user={user} currentUserId={currentUserId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="flex items-center gap-2 text-xs text-text-muted">
        <KeyRound className="size-4" aria-hidden="true" />
        Pasifleştirilen kullanıcıların açık oturumları otomatik olarak kapatılır.
      </p>
    </div>
  );
}
