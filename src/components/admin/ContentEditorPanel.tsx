'use client';

import type { ContentStatus, ContentType } from '@prisma/client';
import { Save, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { z } from 'zod';
import {
  createEntryAction,
  deleteLocaleAction,
  saveLocaleAction,
  setStatusAction,
  type ContentActionResult,
} from '@/app/manage/(panel)/icerik/actions';
import {
  ADMIN_LOCALES,
  LOCALE_DIRECTION,
  LOCALE_LABELS,
  type Locale,
} from '@/lib/admin/locales';
import { CONTENT_TYPES } from '@/lib/admin/content-model';
import { composedTitleLength } from '@/lib/admin/content-validation';
import { ConfirmButton } from './ConfirmButton';
import { JsonListEditor, type JsonListObject } from './JsonListEditor';
import { LocaleTabs } from './LocaleTabs';
import { MdxEditor } from './MdxEditor';
import { MediaField } from './MediaField';
import { PostBlocksEditor } from './PostBlocksEditor';
import { SelectField } from '@/components/ui/select-field';
import { ServiceContentEditor } from './ServiceContentEditor';
import { RichTextEditor } from './RichTextEditor';
import { PageHeader } from './PageHeader';
import { StatusBadge } from './StatusBadge';
import { Toast } from './Toast';
import {
  cardPadded,
  checkboxInput,
  dangerLinkButton,
  fieldError,
  fieldHint,
  fieldInput,
  fieldLabel,
  fieldTextarea,
  helpText,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from './ui';

const INITIAL_RESULT: ContentActionResult = { ok: true };

const stringArraySchema = z.array(z.string());
const objectListSchema = z.array(z.object({ title: z.string(), description: z.string() }));
const approachSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  items: z.array(
    z.object({
      icon: z.string(),
      title: z.string(),
      description: z.string(),
    }),
  ),
});
const timelineSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  rows: z.array(z.object({ label: z.string(), description: z.string() })),
});
const HOME_ICON_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'ShieldCheck', label: 'Kalkan ve onay' },
  { value: 'UserCheck', label: 'Kullanıcı ve onay' },
  { value: 'Sparkles', label: 'Parıltı' },
  { value: 'HeartPulse', label: 'Kalp ritmi' },
  { value: 'Stethoscope', label: 'Stetoskop' },
  { value: 'CalendarCheck', label: 'Takvim ve onay' },
];

export type ContentEditorLocale = {
  locale: Locale;
  body: string;
  frontmatter: Record<string, unknown>;
  complete: boolean;
  updatedAt: string;
};

export type ContentEditorEntry = {
  id: string;
  key: string;
  type: ContentType;
  status: ContentStatus;
  order: number;
  locales: ContentEditorLocale[];
};

export type RelatedContentOption = {
  key: string;
  title: string;
};

type ExistingEditorProps = {
  mode: 'edit';
  entry: ContentEditorEntry;
  segment: string;
  relatedPosts?: RelatedContentOption[];
  relatedServices?: RelatedContentOption[];
};

type CreateEditorProps = {
  mode: 'create';
  type: ContentType;
  segment: string;
};

type ContentEditorPanelProps = ExistingEditorProps | CreateEditorProps;

type ApproachValue = z.infer<typeof approachSchema>;
type TimelineValue = z.infer<typeof timelineSchema>;

function fieldString(frontmatter: Record<string, unknown>, name: string): string {
  const value = frontmatter[name];
  return typeof value === 'string' ? value : '';
}

function fieldNumber(frontmatter: Record<string, unknown>, name: string, fallback: number): number {
  const value = frontmatter[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function fieldStrings(frontmatter: Record<string, unknown>, name: string): string[] {
  const parsed = stringArraySchema.safeParse(frontmatter[name]);
  return parsed.success ? parsed.data : [];
}

function fieldObjects(frontmatter: Record<string, unknown>, name: string): JsonListObject[] {
  const parsed = objectListSchema.safeParse(frontmatter[name]);
  return parsed.success ? parsed.data : [];
}

function resultFeedback(result: ContentActionResult): React.ReactNode {
  if (result.ok) return result.message ? <Toast message={result.message} /> : null;
  return (
    <div className={fieldError}>
      <p>{result.error}</p>
      {result.fieldErrors ? (
        <ul className="mt-2 list-disc space-y-1 ps-5">
          {Object.entries(result.fieldErrors).map(([field, message]) => (
            <li key={field}>
              {message
                .replaceAll('kpis', 'KPI blokları')
                .replaceAll('blocks', 'İçerik blokları')
                .replaceAll('heroImageAlt', 'Kapak görseli alternatif metni')
                .replaceAll('cardImageAlt', 'Kart görseli alternatif metni')
                .replaceAll('updatedAt', 'Son güncelleme')}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CreateEntryPanel({ type, segment }: CreateEditorProps) {
  const router = useRouter();
  const meta = CONTENT_TYPES[type];
  const [result, action, pending] = useActionState(createEntryAction, INITIAL_RESULT);

  useEffect(() => {
    if (result.ok && result.message) router.push(`/manage/icerik/${segment}`);
  }, [result, router, segment]);

  return (
    <div>
      <PageHeader
        title={`Yeni ${meta.singular}`}
        description="Önce içerik anahtarını oluşturun. Ardından listeden kaydı açıp dört dili doldurun."
        actions={
          <Link href={`/manage/icerik/${segment}`} className={secondaryButton}>
            Listeye dön
          </Link>
        }
      />
      <form action={action} className={`${cardPadded} max-w-2xl space-y-5`}>
        <input type="hidden" name="type" value={type} />
        <label className={fieldLabel}>
          İçerik anahtarı
          <input
            name="key"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className={fieldInput}
            placeholder="ornek-icerik"
          />
          <span className={fieldHint}>
            Dosya klasörünün karşılığıdır. Küçük harf, rakam ve tire kullanın.
          </span>
        </label>
        {resultFeedback(result)}
        <button type="submit" className={primaryButton} disabled={pending}>
          {pending ? 'Oluşturuluyor…' : 'Kaydı oluştur'}
        </button>
      </form>
    </div>
  );
}

function TitleField({
  value,
  locale,
  direction,
}: {
  value: string;
  locale: Locale;
  direction: 'ltr' | 'rtl';
}) {
  const [title, setTitle] = useState(value);
  const totalLength = composedTitleLength(title, locale);
  return (
    <label className={`${fieldLabel} md:col-span-2`}>
      Başlık
      <input
        name="title"
        dir={direction}
        value={title}
        minLength={3}
        maxLength={70}
        required
        className={fieldInput}
        onChange={(event) => setTitle(event.target.value)}
      />
      <span className={totalLength <= 60 ? fieldHint : 'mt-1 block text-xs text-state-error'}>
        Site adıyla birlikte {totalLength}/60 karakter.
      </span>
    </label>
  );
}

function DescriptionField({ value, direction }: { value: string; direction: 'ltr' | 'rtl' }) {
  const [description, setDescription] = useState(value);
  const validLength = description.length >= 120 && description.length <= 165;
  return (
    <label className={`${fieldLabel} md:col-span-2`}>
      SEO açıklaması
      <textarea
        name="description"
        dir={direction}
        value={description}
        rows={3}
        required
        className={fieldTextarea}
        onChange={(event) => setDescription(event.target.value)}
      />
      <span className={validLength ? fieldHint : 'mt-1 block text-xs text-state-error'}>
        {description.length}/165 karakter — önerilen aralık 120–165.
      </span>
    </label>
  );
}

function RelatedSelect({
  name,
  label,
  values,
  options,
  direction,
}: {
  name: string;
  label: string;
  values: string[];
  options: RelatedContentOption[];
  direction: 'ltr' | 'rtl';
}) {
  const [selected, setSelected] = useState(values);
  const [candidate, setCandidate] = useState('');
  const available = options.filter((option) => !selected.includes(option.key));

  return (
    <div className={fieldLabel} dir={direction}>
      {label}
      <div className="mt-1.5 flex gap-2">
        <SelectField
          value={candidate}
          onValueChange={setCandidate}
          placeholder="Hizmet seçin"
          className={fieldInput}
          options={available.map((option) => ({ value: option.key, label: option.title || option.key }))}
        />
        <button
          type="button"
          className={secondaryButton}
          disabled={!candidate}
          onClick={() => {
            if (!candidate) return;
            setSelected((items) => [...items, candidate]);
            setCandidate('');
          }}
        >
          Ekle
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {selected.map((key) => {
          const option = options.find((item) => item.key === key);
          return (
            <div key={key} className="flex items-center justify-between rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary">
              <span>{option?.title || key}</span>
              <button type="button" className="text-xs font-bold text-state-error" onClick={() => setSelected((items) => items.filter((item) => item !== key))}>Kaldır</button>
            </div>
          );
        })}
      </div>
      {selected.map((key) => <input key={key} type="hidden" name={name} value={key} />)}
      <span className={fieldHint}>Hizmetleri açılır listeden tek tek ekleyin.</span>
    </div>
  );
}

function PageStructuredFields({
  frontmatter,
  direction,
}: {
  frontmatter: Record<string, unknown>;
  direction: 'ltr' | 'rtl';
}) {
  const parsedApproach = approachSchema.safeParse(frontmatter.approach);
  const parsedTimeline = timelineSchema.safeParse(frontmatter.timeline);
  const emptyItems = Array.from({ length: 3 }, () => ({
    icon: 'ShieldCheck',
    title: '',
    description: '',
  }));
  const [approachEnabled, setApproachEnabled] = useState(parsedApproach.success);
  const [approach, setApproach] = useState<ApproachValue>(
    parsedApproach.success ? parsedApproach.data : { eyebrow: '', title: '', items: emptyItems },
  );
  const [timelineEnabled, setTimelineEnabled] = useState(parsedTimeline.success);
  const [timeline, setTimeline] = useState<TimelineValue>(
    parsedTimeline.success
      ? parsedTimeline.data
      : {
          eyebrow: '',
          title: '',
          rows: [
            { label: '', description: '' },
            { label: '', description: '' },
          ],
        },
  );

  return (
    <>
      <input type="hidden" name="approach" value={approachEnabled ? JSON.stringify(approach) : ''} />
      <input type="hidden" name="timeline" value={timelineEnabled ? JSON.stringify(timeline) : ''} />
      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <input
            type="checkbox"
            checked={approachEnabled}
            className={checkboxInput}
            onChange={(event) => setApproachEnabled(event.target.checked)}
          />
          Yaklaşım bloğunu göster
        </label>
        {approachEnabled ? (
          <div className="mt-3 space-y-3 rounded-md border border-border-default bg-bg-surface p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={fieldLabel}>
                Üst etiket
                <input
                  dir={direction}
                  value={approach.eyebrow}
                  className={fieldInput}
                  onChange={(event) => setApproach({ ...approach, eyebrow: event.target.value })}
                />
              </label>
              <label className={fieldLabel}>
                Başlık
                <input
                  dir={direction}
                  value={approach.title}
                  className={fieldInput}
                  onChange={(event) => setApproach({ ...approach, title: event.target.value })}
                />
              </label>
            </div>
            {approach.items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-border-default bg-bg-base p-3 md:grid-cols-3">
                <label className={fieldLabel}>
                  Simge
                  <SelectField
                    value={item.icon}
                    onValueChange={(icon) =>
                      setApproach({
                        ...approach,
                        items: approach.items.map((current, itemIndex) =>
                          itemIndex === index ? { ...current, icon } : current,
                        ),
                      })
                    }
                    placeholder="Simge seçin"
                    className={fieldInput}
                    options={HOME_ICON_OPTIONS}
                  />
                </label>
                <label className={fieldLabel}>
                  Başlık
                  <input
                    dir={direction}
                    value={item.title}
                    className={fieldInput}
                    onChange={(event) =>
                      setApproach({
                        ...approach,
                        items: approach.items.map((current, itemIndex) =>
                          itemIndex === index ? { ...current, title: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </label>
                <div>
                  <RichTextEditor
                    value={item.description}
                    label="Açıklama"
                    dir={direction}
                    onChange={(description) =>
                      setApproach({
                        ...approach,
                        items: approach.items.map((current, itemIndex) =>
                          itemIndex === index ? { ...current, description } : current,
                        ),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <input
            type="checkbox"
            checked={timelineEnabled}
            className={checkboxInput}
            onChange={(event) => setTimelineEnabled(event.target.checked)}
          />
          Zaman çizelgesi bloğunu göster
        </label>
        {timelineEnabled ? (
          <div className="mt-3 space-y-3 rounded-md border border-border-default bg-bg-surface p-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={fieldLabel}>
                Üst etiket
                <input
                  dir={direction}
                  value={timeline.eyebrow}
                  className={fieldInput}
                  onChange={(event) => setTimeline({ ...timeline, eyebrow: event.target.value })}
                />
              </label>
              <label className={fieldLabel}>
                Başlık
                <input
                  dir={direction}
                  value={timeline.title}
                  className={fieldInput}
                  onChange={(event) => setTimeline({ ...timeline, title: event.target.value })}
                />
              </label>
            </div>
            {timeline.rows.map((row, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-border-default bg-bg-base p-3 md:grid-cols-2">
                <label className={fieldLabel}>
                  Etiket
                  <input
                    dir={direction}
                    value={row.label}
                    className={fieldInput}
                    onChange={(event) =>
                      setTimeline({
                        ...timeline,
                        rows: timeline.rows.map((current, itemIndex) =>
                          itemIndex === index ? { ...current, label: event.target.value } : current,
                        ),
                      })
                    }
                  />
                </label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <RichTextEditor
                      value={row.description}
                      label="Açıklama"
                      dir={direction}
                      onChange={(description) =>
                        setTimeline({
                          ...timeline,
                          rows: timeline.rows.map((current, itemIndex) =>
                            itemIndex === index ? { ...current, description } : current,
                          ),
                        })
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className={dangerLinkButton}
                    disabled={timeline.rows.length <= 2}
                    onClick={() =>
                      setTimeline({
                        ...timeline,
                        rows: timeline.rows.filter((_current, itemIndex) => itemIndex !== index),
                      })
                    }
                  >
                    Kaldır
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className={secondaryButton}
              onClick={() =>
                setTimeline({
                  ...timeline,
                  rows: [...timeline.rows, { label: '', description: '' }],
                })
              }
            >
              Satır ekle
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

function TypeSpecificFields({
  type,
  frontmatter,
  direction,
  existingLocale,
  entryOrder,
  relatedPosts,
  relatedServices,
}: {
  type: ContentType;
  frontmatter: Record<string, unknown>;
  direction: 'ltr' | 'rtl';
  existingLocale: boolean;
  entryOrder: number;
  relatedPosts: RelatedContentOption[];
  relatedServices: RelatedContentOption[];
}) {
  const initialDuties = fieldObjects(frontmatter, 'duties');
  const [duties, setDuties] = useState<JsonListObject[]>(() =>
    initialDuties.length > 0
      ? initialDuties
      : Array.from({ length: 3 }, () => ({ title: '', description: '' })),
  );

  if (type === 'SERVICE') {
    return (
      <section className={cardPadded}>
        <h2 className={sectionTitle}>Hizmet alanları</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <RichTextEditor
              name="shortDescription"
              defaultValue={fieldString(frontmatter, 'shortDescription')}
              label="Kısa açıklama"
              dir={direction}
            />
          </div>
          <MediaField
            name="cardImage"
            label="Kart görseli"
            value={fieldString(frontmatter, 'cardImage')}
            required
          />
          <label className={fieldLabel}>
            Kart görseli alternatif metni
            <input
              name="cardImageAlt"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'cardImageAlt')}
              className={fieldInput}
            />
          </label>
          <label className={fieldLabel}>
            Sıra
            <input
              type="number"
              min={1}
              name="order"
              dir={direction}
              defaultValue={fieldNumber(frontmatter, 'order', entryOrder || 1)}
              className={fieldInput}
            />
          </label>
          <RelatedSelect
            name="relatedPosts"
            label="İlgili blog yazıları"
            values={fieldStrings(frontmatter, 'relatedPosts')}
            options={relatedPosts}
            direction={direction}
          />
          <ServiceContentEditor
            kpis={frontmatter.kpis}
            blocks={frontmatter.blocks}
            direction={direction}
          />
        </div>
      </section>
    );
  }

  if (type === 'POST') {
    const publishedAt = fieldString(frontmatter, 'publishedAt');
    return (
      <section className={cardPadded}>
        <h2 className={sectionTitle}>Blog yazısı alanları</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={fieldLabel}>
            Yayın tarihi
            <input
              type="date"
              name="publishedAt"
              dir={direction}
              defaultValue={publishedAt.slice(0, 10)}
              readOnly={existingLocale}
              required
              className={fieldInput}
            />
            <span className={fieldHint}>İlk kayıttan sonra değiştirilemez.</span>
          </label>
          <label className={fieldLabel}>
            Son güncelleme
            <input
              value={fieldString(frontmatter, 'updatedAt').slice(0, 10)}
              readOnly
              dir={direction}
              className={fieldInput}
              placeholder="Kaydederken otomatik yazılır"
            />
          </label>
          <label className={fieldLabel}>
            Kategori
            <input
              name="category"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'category')}
              className={fieldInput}
            />
          </label>
          <label className={fieldLabel}>
            Yazar
            <input
              name="author"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'author') || 'Dr. Murat Irmak'}
              className={fieldInput}
            />
          </label>
          <div className="md:col-span-2">
            <RelatedSelect
              name="relatedServices"
              label="İlgili hizmetler"
              values={fieldStrings(frontmatter, 'relatedServices')}
              options={relatedServices}
              direction={direction}
            />
          </div>
          <div className="md:col-span-2">
            <PostBlocksEditor
              name="blocks"
              value={frontmatter.blocks}
              direction={direction}
            />
          </div>
        </div>
      </section>
    );
  }

  if (type === 'TEAM') {
    return (
      <section className={cardPadded}>
        <h2 className={sectionTitle}>Ekip üyesi alanları</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={fieldLabel}>
            Ad soyad
            <input name="name" dir={direction} defaultValue={fieldString(frontmatter, 'name')} className={fieldInput} />
          </label>
          <label className={fieldLabel}>
            Görev / unvan
            <input name="role" dir={direction} defaultValue={fieldString(frontmatter, 'role')} className={fieldInput} />
          </label>
          <MediaField name="photo" label="Fotoğraf" value={fieldString(frontmatter, 'photo')} />
          <label className={fieldLabel}>
            Fotoğraf alternatif metni
            <input name="photoAlt" dir={direction} defaultValue={fieldString(frontmatter, 'photoAlt')} className={fieldInput} />
          </label>
          <label className={fieldLabel}>
            Sıra
            <input
              type="number"
              min={1}
              name="order"
              dir={direction}
              defaultValue={fieldNumber(frontmatter, 'order', entryOrder || 1)}
              className={fieldInput}
            />
          </label>
          <div className="md:col-span-2">
            <JsonListEditor
              kind="objects"
              name="duties"
              label="Görev kartları"
              value={duties}
              min={3}
              max={3}
              direction={direction}
              onChange={setDuties}
              richDescription
            />
          </div>
        </div>
      </section>
    );
  }

  if (type === 'PAGE') {
    return (
      <section className={cardPadded}>
        <h2 className={sectionTitle}>Kurumsal sayfa alanları</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <MediaField
            name="sidebarImage"
            label="Kenar görseli"
            value={fieldString(frontmatter, 'sidebarImage')}
          />
          <label className={fieldLabel}>
            Kenar görseli alternatif metni
            <input
              name="sidebarImageAlt"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'sidebarImageAlt')}
              className={fieldInput}
            />
          </label>
          <label className={`${fieldLabel} md:col-span-2`}>
            Eylem düğmesi etiketi
            <input
              name="ctaLabel"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'ctaLabel')}
              className={fieldInput}
            />
          </label>
          <PageStructuredFields frontmatter={frontmatter} direction={direction} />
        </div>
      </section>
    );
  }

  return null;
}

function LocaleForm({
  entry,
  locale,
  visible,
  relatedPosts,
  relatedServices,
}: {
  entry: ContentEditorEntry;
  locale: Locale;
  visible: boolean;
  relatedPosts: RelatedContentOption[];
  relatedServices: RelatedContentOption[];
}) {
  const router = useRouter();
  const localeData = entry.locales.find((item) => item.locale === locale);
  const frontmatter = localeData?.frontmatter ?? {};
  const direction = LOCALE_DIRECTION[locale];
  const [secondaryKeywords, setSecondaryKeywords] = useState(() =>
    fieldStrings(frontmatter, 'secondaryKeywords'),
  );
  const [saveResult, saveAction, saving] = useActionState(saveLocaleAction, INITIAL_RESULT);
  const [deleteResult, deleteAction, deleting] = useActionState(deleteLocaleAction, INITIAL_RESULT);

  useEffect(() => {
    if ((saveResult.ok && saveResult.message) || (deleteResult.ok && deleteResult.message)) {
      router.refresh();
    }
  }, [deleteResult, router, saveResult]);

  return (
    <form action={saveAction} className={visible ? 'space-y-5' : 'hidden'} dir={direction}>
      <input type="hidden" name="entryId" value={entry.id} />
      <input type="hidden" name="type" value={entry.type} />
      <input type="hidden" name="locale" value={locale} />

      <section className={cardPadded}>
        <div className="mb-4">
          <h2 className={sectionTitle}>{LOCALE_LABELS[locale]} SEO alanları</h2>
          <p className={`mt-1 ${helpText}`}>Arama sonuçları ve sosyal paylaşım görünümü.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TitleField
            value={fieldString(frontmatter, 'title')}
            locale={locale}
            direction={direction}
          />
          <DescriptionField value={fieldString(frontmatter, 'description')} direction={direction} />
          <label className={fieldLabel}>
            Slug
            <input
              name="slug"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'slug')}
              required
              className={fieldInput}
            />
          </label>
          <label className={fieldLabel}>
            Birincil anahtar kelime
            <input
              name="primaryKeyword"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'primaryKeyword')}
              required
              className={fieldInput}
            />
          </label>
          <div className="md:col-span-2">
            <JsonListEditor
              kind="strings"
              name="secondaryKeywords"
              label="İkincil anahtar kelimeler"
              value={secondaryKeywords}
              min={1}
              max={4}
              direction={direction}
              onChange={setSecondaryKeywords}
            />
          </div>
          <MediaField
            name="ogImage"
            label="Sosyal paylaşım görseli"
            value={fieldString(frontmatter, 'ogImage')}
            hint="/images/og/ ile başlayan yol veya tam medya URL'si."
            required
          />
          <MediaField
            name="heroImage"
            label="Kapak görseli"
            value={fieldString(frontmatter, 'heroImage')}
            hint="/images/ ile başlayan yol veya tam medya URL'si."
            required
          />
          <label className={`${fieldLabel} md:col-span-2`}>
            Kapak görseli alternatif metni
            <input
              name="heroImageAlt"
              dir={direction}
              defaultValue={fieldString(frontmatter, 'heroImageAlt')}
              required
              className={fieldInput}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary md:col-span-2">
            <input
              type="checkbox"
              name="noindex"
              defaultChecked={frontmatter.noindex === true}
              className={checkboxInput}
            />
            Arama motorlarında dizine eklenmesini engelle
          </label>
        </div>
      </section>

      <TypeSpecificFields
        type={entry.type}
        frontmatter={frontmatter}
        direction={direction}
        existingLocale={Boolean(localeData)}
        entryOrder={entry.order}
        relatedPosts={relatedPosts}
        relatedServices={relatedServices}
      />

      {entry.type === 'SERVICE' || entry.type === 'POST' ? (
        <input type="hidden" name="body" value="" />
      ) : (
        <section className={cardPadded}>
          <div className="mb-4">
            <h2 className={sectionTitle}>MDX gövdesi</h2>
            <p className={`mt-1 ${helpText}`}>Sayfanın uzun metin içeriğini h2 başlıklarla düzenleyin.</p>
          </div>
          <MdxEditor value={localeData?.body ?? ''} direction={direction} />
        </section>
      )}
      {resultFeedback(saveResult)}
      {resultFeedback(deleteResult)}
      <section className={`${cardPadded} flex flex-wrap items-center justify-between gap-3`}>
        <p className={helpText}>Bu işlem yalnızca {LOCALE_LABELS[locale]} sürümünü kaydeder.</p>
        <div className="flex flex-wrap gap-2">
          {localeData ? (
            <ConfirmButton
              type="submit"
              formAction={deleteAction}
              confirmText={`${LOCALE_LABELS[locale]} içeriği silinsin mi?`}
              className={dangerLinkButton}
              disabled={saving || deleting}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Dili sil
            </ConfirmButton>
          ) : null}
          <button type="submit" className={primaryButton} disabled={saving || deleting}>
            <Save className="size-4" aria-hidden="true" />
            {saving ? 'Kaydediliyor…' : 'Dili kaydet'}
          </button>
        </div>
      </section>
    </form>
  );
}

function EntryControls({ entry }: { entry: ContentEditorEntry }) {
  const router = useRouter();
  const [statusResult, statusAction, changingStatus] = useActionState(
    setStatusAction,
    INITIAL_RESULT,
  );

  useEffect(() => {
    if (statusResult.ok && statusResult.message) router.refresh();
  }, [router, statusResult]);

  return (
    <div className="mb-5 space-y-3">
      <section className={`${cardPadded} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <StatusBadge status={entry.status} />
          <p className={`mt-2 ${helpText}`}>
            Yayınlamak için Türkçe içeriğin geçerli ve tamamlanmış olması gerekir.
          </p>
        </div>
        <form action={statusAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="type" value={entry.type} />
          <button
            type="submit"
            name="status"
            value="PUBLISHED"
            className={primaryButton}
            disabled={changingStatus || entry.status === 'PUBLISHED'}
          >
            <Send className="size-4" aria-hidden="true" />
            Yayınla
          </button>
        </form>
      </section>
      {resultFeedback(statusResult)}
    </div>
  );
}

export function ContentEditorPanel(props: ContentEditorPanelProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>('tr');

  if (props.mode === 'create') return <CreateEntryPanel {...props} />;

  const meta = CONTENT_TYPES[props.entry.type];
  const completeLocales = props.entry.locales
    .filter((locale) => locale.complete)
    .map((locale) => locale.locale);
  const title =
    props.entry.locales.find((locale) => locale.locale === 'tr')?.frontmatter.title;

  return (
    <div>
      <PageHeader
        title={typeof title === 'string' && title ? title : props.entry.key}
        description={`${meta.singular} anahtarı: ${props.entry.key}`}
        actions={
          <Link href={`/manage/icerik/${props.segment}`} className={secondaryButton}>
            Listeye dön
          </Link>
        }
      />
      <EntryControls entry={props.entry} />
      <div className="mb-5">
        <LocaleTabs
          activeLocale={activeLocale}
          completeLocales={completeLocales}
          onChange={setActiveLocale}
        />
      </div>
      {ADMIN_LOCALES.map((locale) => (
        <LocaleForm
          key={locale}
          entry={props.entry}
          locale={locale}
          visible={activeLocale === locale}
          relatedPosts={props.relatedPosts ?? []}
          relatedServices={props.relatedServices ?? []}
        />
      ))}
    </div>
  );
}
