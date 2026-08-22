/** Kullanıcı girdisi HTML gövdeye kaçışlanarak yazılır. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type MailBody = { subject: string; text: string; html: string };

type Row = { label: string; value: string };

function rows(items: Row[]): Row[] {
  return items.filter((item) => item.value.trim().length > 0);
}

function renderHtml(title: string, items: Row[], footer?: string): string {
  const body = items
    .map(
      (item) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5D6162;font-size:13px;white-space:nowrap">${escapeHtml(
          item.label,
        )}</td><td style="padding:6px 0;color:#141615;font-size:14px">${escapeHtml(
          item.value,
        ).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('');

  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px">
<h1 style="color:#141615;font-size:18px;margin:0 0 16px">${escapeHtml(title)}</h1>
<table style="border-collapse:collapse;width:100%">${body}</table>
${footer ? `<p style="color:#5D6162;font-size:12px;margin-top:20px">${escapeHtml(footer)}</p>` : ''}
</div>`;
}

function renderText(title: string, items: Row[], footer?: string): string {
  return [
    title,
    '',
    ...items.map((item) => `${item.label}: ${item.value}`),
    footer ? `\n${footer}` : '',
  ].join('\n');
}

export function buildMail(
  subject: string,
  title: string,
  items: Row[],
  footer?: string,
): MailBody {
  const filtered = rows(items);
  return {
    subject,
    text: renderText(title, filtered, footer),
    html: renderHtml(title, filtered, footer),
  };
}
