/**
 * Panelin ortak className token'ları. `/manage` altındaki her liste, form,
 * kart ve buton rengi/yarıçapı buradan okur; hiçbir ekran ham hex ya da
 * keyfi piksel yazmaz. Değerler sitenin `globals.css` içindeki tasarım
 * token'larına çözülür — panel, siteyle aynı görsel dili konuşur.
 */

export function cn(...values: readonly (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

/* ---------------------------------------------------------------- Yerleşim */

export const pageShell = 'mx-auto w-full max-w-6xl';

export const card = 'rounded-lg border border-border-default bg-bg-base shadow-xs';

export const cardPadded = `${card} p-5`;

export const dashedCard =
  'rounded-lg border border-dashed border-border-default bg-bg-surface p-12 text-center';

/* -------------------------------------------------------------- Tipografi */

export const eyebrow =
  'text-[10px] font-bold uppercase tracking-[0.12em] text-accent-primary';

export const sectionTitle = 'text-sm font-bold text-text-primary';

export const helpText = 'text-xs text-text-muted';

/* ----------------------------------------------------------------- Formlar */

export const fieldLabel =
  'block text-xs font-bold uppercase tracking-wider text-text-muted';

export const fieldHint =
  'mt-1 block text-xs font-normal normal-case tracking-normal text-text-muted';

export const fieldInput =
  'mt-1.5 block w-full rounded-md border border-border-default bg-bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none disabled:opacity-60';

export const fieldTextarea = `${fieldInput} resize-y leading-6`;

export const checkboxInput =
  'size-4 rounded-md border-border-default text-accent-primary focus:ring-accent-primary';

export const fieldError =
  'mt-1.5 rounded-md border border-state-error/30 bg-state-error/5 px-3 py-2 text-sm text-state-error';

export const fieldSuccess =
  'mt-1.5 rounded-md border border-state-success/30 bg-state-success/5 px-3 py-2 text-sm text-state-success';

/* ----------------------------------------------------------------- Butonlar */

export const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-accent-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-inverse transition-colors hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60';

export const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-border-default bg-bg-base px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-primary transition-colors hover:bg-bg-surface disabled:cursor-wait disabled:opacity-60';

export const invertButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-bg-inverse px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-inverse transition-colors hover:opacity-90 disabled:cursor-wait disabled:opacity-60';

export const dangerLinkButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider text-state-error transition-colors hover:bg-state-error/10 disabled:cursor-wait disabled:opacity-60';

export const iconButton =
  'flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary';

/* ------------------------------------------------------------------ Tablolar */

export const tableWrap = `${card} overflow-x-auto`;

export const table = 'w-full text-sm';

export const tableHeadRow =
  'border-b border-border-default bg-bg-surface text-start text-[10px] font-bold uppercase tracking-wider text-text-muted';

export const tableHeadCell = 'px-5 py-3.5 text-start font-bold';

export const tableBody = 'divide-y divide-border-default';

export const tableRow = 'transition-colors hover:bg-bg-surface';

export const tableCell = 'px-5 py-3.5 align-middle text-sm text-text-primary';

/* --------------------------------------------------------------- Dil sekmesi */

export const localeTabBar =
  'flex items-center gap-1 rounded-lg border border-border-default bg-bg-surface p-1';

export const localeTab =
  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-text-primary';

export const localeTabActive = 'bg-bg-base text-text-primary shadow-xs';
