'use client';

import { Plus, Trash2 } from 'lucide-react';
import { fieldHint, fieldInput, fieldLabel, fieldTextarea, iconButton, secondaryButton } from './ui';
import { RichTextEditor } from './RichTextEditor';

export type JsonListObject = {
  title: string;
  description: string;
};

type StringListProps = {
  kind: 'strings';
  name: string;
  label: string;
  value: string[];
  min?: number;
  max?: number;
  direction?: 'ltr' | 'rtl';
  onChange: (value: string[]) => void;
};

type ObjectListProps = {
  kind: 'objects';
  name: string;
  label: string;
  value: JsonListObject[];
  min?: number;
  max?: number;
  direction?: 'ltr' | 'rtl';
  titleLabel?: string;
  descriptionLabel?: string;
  richDescription?: boolean;
  onChange: (value: JsonListObject[]) => void;
};

type JsonListEditorProps = StringListProps | ObjectListProps;

export function JsonListEditor(props: JsonListEditorProps) {
  const min = props.min ?? 0;
  const max = props.max ?? Number.POSITIVE_INFINITY;
  const rangeHint =
    Number.isFinite(max) && min > 0
      ? `En az ${min}, en fazla ${max} kayıt.`
      : min > 0
        ? `En az ${min} kayıt.`
        : Number.isFinite(max)
          ? `En fazla ${max} kayıt.`
          : null;

  if (props.kind === 'strings') {
    return (
      <div dir={props.direction}>
        <input type="hidden" name={props.name} value={JSON.stringify(props.value)} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className={fieldLabel}>{props.label}</span>
            {rangeHint ? <span className={fieldHint}>{rangeHint}</span> : null}
          </div>
          <button
            type="button"
            className={secondaryButton}
            disabled={props.value.length >= max}
            onClick={() => props.onChange([...props.value, ''])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Ekle
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {props.value.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                value={item}
                className={`${fieldInput} mt-0 text-start`}
                aria-label={`${props.label} ${index + 1}`}
                onChange={(event) =>
                  props.onChange(
                    props.value.map((current, itemIndex) =>
                      itemIndex === index ? event.target.value : current,
                    ),
                  )
                }
              />
              <button
                type="button"
                className={iconButton}
                aria-label={`${index + 1}. kaydı kaldır`}
                onClick={() =>
                  props.onChange(props.value.filter((_current, itemIndex) => itemIndex !== index))
                }
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div dir={props.direction}>
      <input type="hidden" name={props.name} value={JSON.stringify(props.value)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className={fieldLabel}>{props.label}</span>
          {rangeHint ? <span className={fieldHint}>{rangeHint}</span> : null}
        </div>
        <button
          type="button"
          className={secondaryButton}
          disabled={props.value.length >= max}
          onClick={() => props.onChange([...props.value, { title: '', description: '' }])}
        >
          <Plus className="size-4" aria-hidden="true" />
          Ekle
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {props.value.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-md border border-border-default bg-bg-surface p-3 md:grid-cols-2"
          >
            <label className={fieldLabel}>
              {props.titleLabel ?? 'Başlık'}
              <input
                value={item.title}
                className={fieldInput}
                onChange={(event) =>
                  props.onChange(
                    props.value.map((current, itemIndex) =>
                      itemIndex === index ? { ...current, title: event.target.value } : current,
                    ),
                  )
                }
              />
            </label>
            <div className="flex items-end gap-2">
              {props.richDescription ? (
                <div className="flex-1">
                  <RichTextEditor
                    value={item.description}
                    label={props.descriptionLabel ?? 'Açıklama'}
                    dir={props.direction}
                    onChange={(description) =>
                      props.onChange(
                        props.value.map((current, itemIndex) =>
                          itemIndex === index ? { ...current, description } : current,
                        ),
                      )
                    }
                  />
                </div>
              ) : (
                <label className={`${fieldLabel} flex-1`}>
                  {props.descriptionLabel ?? 'Açıklama'}
                  <textarea
                    value={item.description}
                    rows={2}
                    className={fieldTextarea}
                    onChange={(event) =>
                      props.onChange(
                        props.value.map((current, itemIndex) =>
                          itemIndex === index
                            ? { ...current, description: event.target.value }
                            : current,
                        ),
                      )
                    }
                  />
                </label>
              )}
              <button
                type="button"
                className={iconButton}
                aria-label={`${index + 1}. kaydı kaldır`}
                onClick={() =>
                  props.onChange(props.value.filter((_current, itemIndex) => itemIndex !== index))
                }
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
