'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, Eye, FileText } from 'lucide-react';
import { cn, fieldTextarea, helpText, secondaryButton } from './ui';

type MdxEditorProps = {
  name?: string;
  value: string;
  direction?: 'ltr' | 'rtl';
};

type PreviewBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'callout'; text: string }
  | { kind: 'steps'; text: string };

function buildPreview(source: string): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];
  const lines = source.split('\n');
  let paragraph: string[] = [];
  let list: string[] = [];
  let specialKind: 'callout' | 'steps' | null = null;
  let special: string[] = [];

  const flushParagraph = () => {
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ kind: 'paragraph', text });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length > 0) blocks.push({ kind: 'list', items: list });
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (specialKind) {
      const closingTag = specialKind === 'callout' ? '</Callout>' : '</Steps>';
      if (trimmed === closingTag) {
        const text = special
          .join(' ')
          .replace(/<\/?Step(?:\s+title="[^"]*")?>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        blocks.push({ kind: specialKind, text });
        specialKind = null;
        special = [];
      } else {
        special.push(trimmed);
      }
      continue;
    }

    if (trimmed.startsWith('<Callout')) {
      flushParagraph();
      flushList();
      specialKind = 'callout';
      continue;
    }
    if (trimmed === '<Steps>') {
      flushParagraph();
      flushList();
      specialKind = 'steps';
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', text: trimmed.slice(3) });
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    paragraph.push(trimmed.replace(/\*\*(.*?)\*\*/g, '$1'));
  }

  flushParagraph();
  flushList();
  if (specialKind && special.length > 0) {
    blocks.push({ kind: specialKind, text: special.join(' ') });
  }
  return blocks;
}

export function MdxEditor({ name = 'body', value, direction = 'ltr' }: MdxEditorProps) {
  const [source, setSource] = useState(value);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasHeadingOne = source.split('\n').some((line) => line.startsWith('# '));
  const hasRawHtml = /<(div|span)(\s|>)/i.test(source) || /<\/(div|span)>/i.test(source);

  const wrapSelection = (before: string, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? source.length;
    const end = textarea?.selectionEnd ?? source.length;
    const selected = source.slice(start, end) || placeholder;
    const next = `${source.slice(0, start)}${before}${selected}${after}${source.slice(end)}`;
    setSource(next);
    requestAnimationFrame(() => {
      if (!textarea) return;
      const selectionStart = start + before.length;
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionStart + selected.length);
    });
  };

  const preview = buildPreview(source);

  return (
    <div>
      <input type="hidden" name={name} value={source} />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={secondaryButton} onClick={() => wrapSelection('## ', '', 'Başlık')}>
            ## Başlık
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => wrapSelection('<Callout type="info">\n', '\n</Callout>', 'Bilgi metni')}
          >
            {'<Callout type="info">…</Callout>'}
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() =>
              wrapSelection('<Steps>\n<Step title="Adım">\n', '\n</Step>\n</Steps>', 'Adım açıklaması')
            }
          >
            {'<Steps><Step>…</Step></Steps>'}
          </button>
          <button type="button" className={secondaryButton} onClick={() => wrapSelection('**', '**', 'kalın metin')}>
            Kalın
          </button>
          <button type="button" className={secondaryButton} onClick={() => wrapSelection('- ', '', 'Liste öğesi')}>
            Liste
          </button>
          <button type="button" className={secondaryButton} onClick={() => wrapSelection('[', '](https://)', 'bağlantı metni')}>
            Bağlantı
          </button>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            className={cn(secondaryButton, mode === 'edit' && 'bg-bg-surface')}
            onClick={() => setMode('edit')}
          >
            <FileText className="size-4" aria-hidden="true" />
            Düzenle
          </button>
          <button
            type="button"
            className={cn(secondaryButton, mode === 'preview' && 'bg-bg-surface')}
            onClick={() => setMode('preview')}
          >
            <Eye className="size-4" aria-hidden="true" />
            Önizleme
          </button>
        </div>
      </div>

      {hasHeadingOne ? (
        <p className="mb-2 flex items-center gap-2 rounded-md border border-state-error/30 bg-state-error/5 px-3 py-2 text-sm text-state-error">
          <AlertTriangle className="size-4" aria-hidden="true" />
          MDX içinde h1 kullanılmaz, h2 ile başlayın.
        </p>
      ) : null}
      {hasRawHtml ? (
        <p className="mb-2 flex items-center gap-2 rounded-md border border-state-error/30 bg-state-error/5 px-3 py-2 text-sm text-state-error">
          <AlertTriangle className="size-4" aria-hidden="true" />
          MDX içinde ham HTML kullanılmaz.
        </p>
      ) : null}

      {mode === 'edit' ? (
        <textarea
          ref={textareaRef}
          dir={direction}
          value={source}
          rows={22}
          className={`${fieldTextarea} font-mono text-start`}
          onChange={(event) => setSource(event.target.value)}
          aria-label="MDX içeriği"
        />
      ) : (
        <div dir={direction} className="min-h-96 rounded-md border border-border-default bg-bg-base p-5 text-start">
          {preview.length === 0 ? <p className={helpText}>Önizlenecek içerik yok.</p> : null}
          <div className="space-y-4">
            {preview.map((block, index) => {
              if (block.kind === 'heading') {
                return <h3 key={index} className="text-lg font-bold text-text-primary">{block.text}</h3>;
              }
              if (block.kind === 'list') {
                return <ul key={index} className="list-disc space-y-1 ps-5 text-sm text-text-primary">{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>;
              }
              if (block.kind === 'callout') {
                return <aside key={index} className="rounded-md border border-accent-primary/30 bg-accent-soft p-4 text-sm text-text-primary">{block.text}</aside>;
              }
              if (block.kind === 'steps') {
                return <div key={index} className="rounded-md border border-border-default bg-bg-surface p-4 text-sm text-text-primary"><strong>Adımlar</strong><p className="mt-2">{block.text}</p></div>;
              }
              return <p key={index} className="text-sm leading-7 text-text-primary">{block.text}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
