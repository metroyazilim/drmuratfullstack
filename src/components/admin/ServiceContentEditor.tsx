'use client';

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { serviceBlockSchema, serviceKpiSchema } from '@/lib/content/schemas';
import type { ServiceBlock, ServiceKpi } from '@/lib/content/types';
import { SelectField } from '@/components/ui/select-field';
import { fieldInput, fieldLabel, fieldTextarea, iconButton, secondaryButton } from './ui';

type Props = { kpis: unknown; blocks: unknown; direction: 'ltr' | 'rtl' };
type BlockKind = ServiceBlock['type'];

function readKpis(value: unknown): ServiceKpi[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => { const parsed = serviceKpiSchema.safeParse(item); return parsed.success ? [parsed.data] : []; });
}
function readBlocks(value: unknown): ServiceBlock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => { const parsed = serviceBlockSchema.safeParse(item); return parsed.success ? [parsed.data] : []; });
}
function makeBlock(type: BlockKind): ServiceBlock {
  if (type === 'text') return { type, title: 'Yeni başlık', body: '' };
  if (type === 'steps') return { type, title: 'Uygulama adımları', items: [{ title: 'İlk adım', description: '' }, { title: 'İkinci adım', description: '' }] };
  if (type === 'faq') return { type, title: 'Sık sorulan sorular', items: [{ question: 'Soru', answer: '' }, { question: 'Soru', answer: '' }] };
  return { type, title: 'Önemli bilgi', body: '', tone: 'info' };
}

export function ServiceContentEditor({ kpis: initialKpis, blocks: initialBlocks, direction }: Props) {
  const [kpis, setKpis] = useState<ServiceKpi[]>(() => readKpis(initialKpis));
  const [blocks, setBlocks] = useState<ServiceBlock[]>(() => readBlocks(initialBlocks));
  const [kind, setKind] = useState<BlockKind>('text');
  const replaceBlock = (index: number, block: ServiceBlock) => setBlocks((items) => items.map((item, itemIndex) => itemIndex === index ? block : item));
  const moveBlock = (index: number, offset: number) => setBlocks((items) => { const next = [...items]; const destination = index + offset; const current = next[index]; const target = next[destination]; if (!current || !target) return items; next[index] = target; next[destination] = current; return next; });

  return <div className="space-y-5 md:col-span-2" dir={direction}>
    <section className="rounded-lg border border-border-default bg-bg-base p-5">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-bold text-text-primary">KPI kartları</h2><p className="mt-1 text-xs text-text-muted">Hizmet detayının öne çıkan kısa bilgileri. En az 3, en fazla 4 kart.</p></div><button type="button" className={secondaryButton} disabled={kpis.length >= 4} onClick={() => setKpis((items) => [...items, { label: '', value: '', detail: '' }])}><Plus className="size-4" />KPI ekle</button></div>
      <input type="hidden" name="kpis" value={JSON.stringify(kpis)} />
      <div className="mt-4 grid gap-3 md:grid-cols-2">{kpis.map((kpi, index) => <div key={index} className="rounded-lg border border-border-default bg-bg-surface p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold tracking-wider text-accent-primary uppercase">KPI {index + 1}</span><button type="button" className={`${iconButton} text-state-error`} disabled={kpis.length <= 3} onClick={() => setKpis((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="KPI kaldır"><Trash2 className="size-4" /></button></div><div className="grid gap-3"><TextInput label="Etiket" value={kpi.label} onChange={(label) => setKpis((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item))} /><TextInput label="Değer" value={kpi.value} onChange={(value) => setKpis((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, value } : item))} /><TextInput label="Açıklama" value={kpi.detail} onChange={(detail) => setKpis((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, detail } : item))} /></div></div>)}</div>
    </section>
    <section className="rounded-lg border border-border-default bg-bg-base p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-bold text-text-primary">Hizmet içerik blokları</h2><p className="mt-1 text-xs text-text-muted">Metin, adımlar, SSS ve bilgi kutularını sayfadaki sırayla yönetin.</p></div><div className="flex gap-2"><SelectField value={kind} onValueChange={(value) => setKind(value as BlockKind)} placeholder="Blok türü" options={[{ value: 'text', label: 'Metin' }, { value: 'steps', label: 'Adımlar' }, { value: 'faq', label: 'SSS' }, { value: 'callout', label: 'Bilgi kutusu' }]} /><button type="button" className={secondaryButton} disabled={blocks.length >= 8} onClick={() => setBlocks((items) => [...items, makeBlock(kind)])}><Plus className="size-4" />Blok ekle</button></div></div>
      <input type="hidden" name="blocks" value={JSON.stringify(blocks)} />
      <div className="mt-5 space-y-4">{blocks.map((block, index) => <div key={`${block.type}-${index}`} className="rounded-lg border border-border-default bg-bg-surface p-4"><div className="mb-4 flex items-center justify-between gap-3"><span className="text-xs font-bold tracking-wider text-accent-primary uppercase">{block.type === 'text' ? 'Metin' : block.type === 'steps' ? 'Adımlar' : block.type === 'faq' ? 'SSS' : 'Bilgi kutusu'}</span><div className="flex gap-1"><button type="button" className={iconButton} disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="Bloğu yukarı taşı"><ChevronUp className="size-4" /></button><button type="button" className={iconButton} disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)} aria-label="Bloğu aşağı taşı"><ChevronDown className="size-4" /></button><button type="button" className={`${iconButton} text-state-error`} disabled={blocks.length <= 3} onClick={() => setBlocks((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Bloğu kaldır"><Trash2 className="size-4" /></button></div></div><ServiceBlockFields block={block} onChange={(next) => replaceBlock(index, next)} /></div>)}</div>
    </section>
  </div>;
}

function ServiceBlockFields({ block, onChange }: { block: ServiceBlock; onChange: (block: ServiceBlock) => void }) {
  if (block.type === 'text') return <><TextInput label="Başlık" value={block.title} onChange={(title) => onChange({ ...block, title })} /><TextArea label="Metin" value={block.body} onChange={(body) => onChange({ ...block, body })} /></>;
  if (block.type === 'callout') return <><TextInput label="Başlık" value={block.title} onChange={(title) => onChange({ ...block, title })} /><label className={`${fieldLabel} mt-3`}>Tür<SelectField value={block.tone} onValueChange={(tone) => onChange({ ...block, tone: tone as 'info' | 'warning' })} placeholder="Tür seçin" className={fieldInput} options={[{ value: 'info', label: 'Bilgi' }, { value: 'warning', label: 'Uyarı' }]} /></label><TextArea label="Metin" value={block.body} onChange={(body) => onChange({ ...block, body })} /></>;
  if (block.type === 'steps') return <ItemList title={block.title} onTitle={(title) => onChange({ ...block, title })} items={block.items} kind="steps" onItems={(items) => onChange({ ...block, items: items as { title: string; description: string }[] })} />;
  return <ItemList title={block.title} onTitle={(title) => onChange({ ...block, title })} items={block.items} kind="faq" onItems={(items) => onChange({ ...block, items: items as { question: string; answer: string }[] })} />;
}

type Item = { title: string; description: string } | { question: string; answer: string };
function ItemList({ title, onTitle, items, kind, onItems }: { title: string; onTitle: (value: string) => void; items: Item[]; kind: 'steps' | 'faq'; onItems: (items: Item[]) => void }) {
  const add = () => onItems([...items, kind === 'steps' ? { title: '', description: '' } : { question: '', answer: '' }]);
  return <><TextInput label="Başlık" value={title} onChange={onTitle} /><div className="mt-3 space-y-3">{items.map((item, index) => <div key={index} className="rounded-md border border-border-default bg-bg-base p-3"><div className="grid gap-3 md:grid-cols-2">{kind === 'steps' ? <><TextInput label="Adım" value={(item as { title: string }).title} onChange={(title) => onItems(items.map((row, itemIndex) => itemIndex === index ? { ...(row as { title: string; description: string }), title } : row))} /><TextInput label="Açıklama" value={(item as { description: string }).description} onChange={(description) => onItems(items.map((row, itemIndex) => itemIndex === index ? { ...(row as { title: string; description: string }), description } : row))} /></> : <><TextInput label="Soru" value={(item as { question: string }).question} onChange={(question) => onItems(items.map((row, itemIndex) => itemIndex === index ? { ...(row as { question: string; answer: string }), question } : row))} /><TextInput label="Cevap" value={(item as { answer: string }).answer} onChange={(answer) => onItems(items.map((row, itemIndex) => itemIndex === index ? { ...(row as { question: string; answer: string }), answer } : row))} /></>}</div><button type="button" className="mt-2 text-xs font-bold text-state-error" disabled={items.length <= 2} onClick={() => onItems(items.filter((_, itemIndex) => itemIndex !== index))}>Kaldır</button></div>)}</div><button type="button" className={`${secondaryButton} mt-3`} onClick={add}><Plus className="size-4" />Satır ekle</button></>;
}
function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className={fieldLabel}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} className={fieldInput} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className={`${fieldLabel} mt-3 block`}>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} className={fieldTextarea} rows={4} /></label>; }
