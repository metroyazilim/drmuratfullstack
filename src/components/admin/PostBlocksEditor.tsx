'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { postBlockSchema } from '@/lib/content/schemas';
import type { PostBlock, ServiceKpi } from '@/lib/content/types';
import { SelectField } from '@/components/ui/select-field';
import { RichTextEditor } from './RichTextEditor';
import { fieldHint, fieldInput, fieldLabel, fieldTextarea, iconButton, secondaryButton } from './ui';

type BlockKind = PostBlock['type'];
type Props = { name: string; value: unknown; direction: 'ltr' | 'rtl' };

function makeBlock(type: BlockKind): PostBlock {
  if (type === 'text') return { type, title: 'Yeni başlık', body: '' };
  if (type === 'richText') return { type, title: 'Yeni metin', html: '<p></p>' };
  if (type === 'kpis') return { type, title: 'Öne çıkan bilgiler', items: [{ label: 'Başlık', value: 'Değer', detail: 'Kısa açıklama' }, { label: 'Başlık', value: 'Değer', detail: 'Kısa açıklama' }] };
  if (type === 'steps') return { type, title: 'Uygulama adımları', items: [{ title: 'İlk adım', description: '' }, { title: 'İkinci adım', description: '' }] };
  if (type === 'faq') return { type, title: 'Sık sorulan sorular', items: [{ question: 'Soru', answer: '' }, { question: 'Soru', answer: '' }] };
  return { type, title: 'Önemli bilgi', body: '', tone: 'info' };
}

function readBlocks(value: unknown): PostBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((block) => {
    const parsed = postBlockSchema.safeParse(block);
    return parsed.success ? [parsed.data] : [];
  });
}

export function PostBlocksEditor({ name, value, direction }: Props) {
  const [blocks, setBlocks] = useState<PostBlock[]>(() => readBlocks(value));
  const [kind, setKind] = useState<BlockKind>('richText');
  const replace = (index: number, block: PostBlock) => setBlocks((items) => items.map((item, itemIndex) => itemIndex === index ? block : item));
  const move = (index: number, offset: number) => setBlocks((items) => { const next = [...items]; const destination = index + offset; const current = next[index]; const target = next[destination]; if (!current || !target) return items; next[index] = target; next[destination] = current; return next; });

  return (
    <section className="rounded-lg border border-border-default bg-bg-base p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-sm font-bold text-text-primary">İçerik blokları</h2><p className="mt-1 text-xs text-text-muted">MDX yok. Her bölüm kendi alanında düzenlenir ve sayfada aynı sırayla yayınlanır.</p></div>
        <div className="flex gap-2">
          <SelectField
            value={kind}
            onValueChange={(value) => setKind(value as BlockKind)}
            placeholder="Blok türü seçin"
            options={[
              { value: 'richText', label: 'Zengin metin' },
              { value: 'text', label: 'Metin' },
              { value: 'kpis', label: 'KPI' },
              { value: 'steps', label: 'Adımlar' },
              { value: 'faq', label: 'SSS' },
              { value: 'callout', label: 'Bilgi kutusu' },
            ]}
          />
          <button type="button" className={secondaryButton} onClick={() => setBlocks((items) => [...items, makeBlock(kind)])}><Plus className="size-4" />Blok ekle</button>
        </div>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />
      <div className="mt-5 space-y-4">
        {blocks.map((block, index) => <div key={`${block.type}-${index}`} className="rounded-lg border border-border-default bg-bg-surface p-4">
          <div className="mb-4 flex items-center justify-between gap-3"><span className="text-xs font-bold tracking-wider text-accent-primary uppercase">{block.type === 'richText' ? 'Zengin metin' : block.type === 'kpis' ? 'KPI' : block.type === 'steps' ? 'Adımlar' : block.type === 'faq' ? 'SSS' : block.type === 'callout' ? 'Bilgi kutusu' : 'Metin'}</span><div className="flex items-center gap-1"><button type="button" className={iconButton} onClick={() => move(index, -1)} disabled={index === 0} aria-label="Bloğu yukarı taşı"><ChevronUp className="size-4" /></button><button type="button" className={iconButton} onClick={() => move(index, 1)} disabled={index === blocks.length - 1} aria-label="Bloğu aşağı taşı"><ChevronDown className="size-4" /></button><button type="button" className={`${iconButton} text-state-error`} onClick={() => setBlocks((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Bloğu kaldır"><Trash2 className="size-4" /></button></div></div>
          {block.type === 'text' ? <><label className={fieldLabel}>Başlık<input value={block.title} onChange={(event) => replace(index, { ...block, title: event.target.value })} className={fieldInput} /></label><label className={`${fieldLabel} mt-3`}>Metin<textarea value={block.body} onChange={(event) => replace(index, { ...block, body: event.target.value })} className={fieldTextarea} rows={5} /></label></> : null}
          {block.type === 'richText' ? <><label className={fieldLabel}>Başlık <span className={fieldHint}>İsteğe bağlı</span><input value={block.title ?? ''} onChange={(event) => replace(index, { ...block, title: event.target.value || undefined })} className={fieldInput} /></label><div className="mt-3"><RichTextEditor value={block.html} onChange={(html) => replace(index, { ...block, html })} label="Zengin metin" dir={direction} /></div></> : null}
          {block.type === 'callout' ? <><label className={fieldLabel}>Başlık<input value={block.title} onChange={(event) => replace(index, { ...block, title: event.target.value })} className={fieldInput} /></label><label className={`${fieldLabel} mt-3`}>Tür<SelectField value={block.tone} onValueChange={(tone) => replace(index, { ...block, tone: tone as 'info' | 'warning' })} placeholder="Tür seçin" className={fieldInput} options={[{ value: 'info', label: 'Bilgi' }, { value: 'warning', label: 'Uyarı' }]} /></label><label className={`${fieldLabel} mt-3`}>Metin<textarea value={block.body} onChange={(event) => replace(index, { ...block, body: event.target.value })} className={fieldTextarea} rows={4} /></label></> : null}
          {block.type === 'kpis' ? <BlockItems title={block.title ?? ''} onTitle={(title) => replace(index, { ...block, title })} items={block.items} kind="kpis" onItems={(items) => replace(index, { ...block, items: items as ServiceKpi[] })} /> : null}
          {block.type === 'steps' ? <BlockItems title={block.title} onTitle={(title) => replace(index, { ...block, title })} items={block.items} kind="steps" onItems={(items) => replace(index, { ...block, items: items as { title: string; description: string }[] })} /> : null}
          {block.type === 'faq' ? <BlockItems title={block.title} onTitle={(title) => replace(index, { ...block, title })} items={block.items} kind="faq" onItems={(items) => replace(index, { ...block, items: items as { question: string; answer: string }[] })} /> : null}
        </div>)}
      </div>
    </section>
  );
}

type ItemKind = 'kpis' | 'steps' | 'faq';
type Item = ServiceKpi | { title: string; description: string } | { question: string; answer: string };
function BlockItems({ title, onTitle, items, kind, onItems }: { title: string; onTitle: (value: string) => void; items: Item[]; kind: ItemKind; onItems: (items: Item[]) => void }) {
  const add = () => onItems([...items, kind === 'kpis' ? { label: '', value: '', detail: '' } : kind === 'steps' ? { title: '', description: '' } : { question: '', answer: '' }]);
  return <><label className={fieldLabel}>Başlık<input value={title} onChange={(event) => onTitle(event.target.value)} className={fieldInput} /></label><div className="mt-3 space-y-3">{items.map((item, index) => <div key={index} className="rounded-md border border-border-default bg-bg-base p-3"><div className="grid gap-3 md:grid-cols-2">{kind === 'kpis' ? <><Input label="Etiket" value={(item as ServiceKpi).label} onChange={(label) => onItems(items.map((row, i) => i === index ? { ...(row as ServiceKpi), label } : row))} /><Input label="Değer" value={(item as ServiceKpi).value} onChange={(value) => onItems(items.map((row, i) => i === index ? { ...(row as ServiceKpi), value } : row))} /><Input label="Açıklama" full value={(item as ServiceKpi).detail} onChange={(detail) => onItems(items.map((row, i) => i === index ? { ...(row as ServiceKpi), detail } : row))} /></> : kind === 'steps' ? <><Input label="Adım" value={(item as { title: string }).title} onChange={(title) => onItems(items.map((row, i) => i === index ? { ...(row as { title: string; description: string }), title } : row))} /><Input label="Açıklama" value={(item as { description: string }).description} onChange={(description) => onItems(items.map((row, i) => i === index ? { ...(row as { title: string; description: string }), description } : row))} /></> : <><Input label="Soru" value={(item as { question: string }).question} onChange={(question) => onItems(items.map((row, i) => i === index ? { ...(row as { question: string; answer: string }), question } : row))} /><Input label="Cevap" value={(item as { answer: string }).answer} onChange={(answer) => onItems(items.map((row, i) => i === index ? { ...(row as { question: string; answer: string }), answer } : row))} /></>} </div><button type="button" className="mt-2 text-xs font-bold text-state-error" onClick={() => onItems(items.filter((_, i) => i !== index))}>Kaldır</button></div>)}</div><button type="button" className={`${secondaryButton} mt-3`} onClick={add}><Plus className="size-4" />Satır ekle</button></>;
}
function Input({ label, value, onChange, full }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) { return <label className={`${fieldLabel} ${full ? 'md:col-span-2' : ''}`}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} className={fieldInput} /></label>; }
