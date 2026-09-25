'use client';

import Link from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Link2, List, ListOrdered } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn, fieldLabel, fieldTextarea, iconButton } from './ui';

type SharedProps = {
  label?: string;
  dir?: 'ltr' | 'rtl';
};

type UncontrolledProps = SharedProps & {
  name: string;
  defaultValue?: string;
  value?: never;
  onChange?: never;
};

type ControlledProps = SharedProps & {
  value: string;
  onChange: (html: string) => void;
  name?: never;
  defaultValue?: never;
};

type RichTextEditorProps = UncontrolledProps | ControlledProps;

export function RichTextEditor(props: RichTextEditorProps) {
  const controlled = 'value' in props;
  const value = controlled ? (props.value ?? '') : undefined;
  const initialValue = controlled ? value : (props.defaultValue ?? '');
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef<((html: string) => void) | undefined>(
    controlled ? props.onChange : undefined,
  );

  useEffect(() => {
    onChangeRef.current = controlled ? props.onChange : undefined;
  }, [controlled, props.onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
    ],
    content: initialValue,
    editorProps: {
      attributes: {
        class: cn(
          fieldTextarea,
          'min-h-32 focus:ring-0 [&_a]:text-accent-primary [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:border-border-default [&_blockquote]:ps-3 [&_li]:ms-5 [&_ol]:list-decimal [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:list-disc',
        ),
        dir: props.dir ?? 'ltr',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      if (hiddenInputRef.current) hiddenInputRef.current.value = html;
      onChangeRef.current?.(html);
    },
  });

  useEffect(() => {
    if (!controlled || !editor || editor.getHTML() === value) return;
    editor.commands.setContent(value ?? '', { emitUpdate: false });
  }, [controlled, editor, value]);

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Bağlantı adresi', previousUrl ?? 'https://');
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  const toolbar = (
    <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-border-default bg-bg-surface p-1.5">
      <button
        type="button"
        className={cn(iconButton, editor?.isActive('bold') && 'bg-accent-soft text-accent-primary')}
        onClick={() => editor?.chain().focus().toggleBold().run()}
        aria-label="Kalın"
        aria-pressed={editor?.isActive('bold') ?? false}
      >
        <Bold className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={cn(iconButton, editor?.isActive('italic') && 'bg-accent-soft text-accent-primary')}
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        aria-label="İtalik"
        aria-pressed={editor?.isActive('italic') ?? false}
      >
        <Italic className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={cn(iconButton, editor?.isActive('bulletList') && 'bg-accent-soft text-accent-primary')}
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        aria-label="Madde işaretli liste"
        aria-pressed={editor?.isActive('bulletList') ?? false}
      >
        <List className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={cn(iconButton, editor?.isActive('orderedList') && 'bg-accent-soft text-accent-primary')}
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        aria-label="Numaralı liste"
        aria-pressed={editor?.isActive('orderedList') ?? false}
      >
        <ListOrdered className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={cn(iconButton, editor?.isActive('link') && 'bg-accent-soft text-accent-primary')}
        onClick={setLink}
        aria-label="Bağlantı ekle veya düzenle"
        aria-pressed={editor?.isActive('link') ?? false}
      >
        <Link2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div>
      {props.label ? <span className={fieldLabel}>{props.label}</span> : null}
      <div className={props.label ? 'mt-1.5' : undefined}>
        {toolbar}
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:mt-0 [&_.ProseMirror]:rounded-t-none"
        />
      </div>
      {!controlled ? (
        <input
          ref={hiddenInputRef}
          type="hidden"
          name={props.name}
          defaultValue={props.defaultValue ?? ''}
        />
      ) : null}
    </div>
  );
}
