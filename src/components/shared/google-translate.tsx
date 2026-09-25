'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Languages } from 'lucide-react';
import Script from 'next/script';
import { useState } from 'react';

const SCRIPT_SRC = 'https://translate.google.com/translate_a/element.js';
const LANGUAGES = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]['code'];
type GoogleTranslateProps = { id: string; className?: string };

export function GoogleTranslate({ id, className }: GoogleTranslateProps) {
  const [language, setLanguage] = useState<LanguageCode>('tr');

  function initialize(attempt = 0): void {
    const container = document.getElementById(id);
    const TranslateElement = window.google?.translate?.TranslateElement;
    if (!container || container.childElementCount > 0) return;
    if (typeof TranslateElement !== 'function') {
      if (attempt < 20) window.setTimeout(() => initialize(attempt + 1), 50);
      return;
    }
    try {
      new TranslateElement({ pageLanguage: 'tr', autoDisplay: false }, id);
    } catch {
      if (attempt < 20) window.setTimeout(() => initialize(attempt + 1), 50);
    }
  }

  function selectLanguage(nextLanguage: LanguageCode): void {
    if (nextLanguage === 'tr') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      window.location.reload();
      return;
    }

    const select = document.querySelector(`#${id} select.goog-te-combo`);
    if (!(select instanceof HTMLSelectElement)) {
      initialize();
      return;
    }
    select.value = nextLanguage;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    setLanguage(nextLanguage);
  }

  const activeLanguage = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];

  return (
    <div className={`shrink-0 ${className ?? ''}`} aria-label="Dil seçimi">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="text-text-primary hover:bg-bg-surface inline-flex h-10 items-center gap-1.5 rounded-md border border-border-default px-2 text-sm font-semibold transition-colors"
            aria-label="Dil seçimi"
          >
            <span className="text-base leading-none" aria-hidden="true">{activeLanguage.flag}</span>
            <span className="hidden sm:inline">{activeLanguage.label}</span>
            <Languages className="size-3.5 text-text-muted sm:hidden" aria-hidden="true" />
            <ChevronDown className="size-3.5 text-text-muted" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-44 rounded-lg border border-border-default bg-bg-base p-1 shadow-lg"
          >
            {LANGUAGES.map((item) => (
              <DropdownMenu.Item
                key={item.code}
                onSelect={() => selectLanguage(item.code)}
                className="text-text-primary data-[highlighted]:bg-bg-surface flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none"
              >
                <span className="text-base leading-none" aria-hidden="true">{item.flag}</span>
                <span className="flex-1">{item.label}</span>
                {item.code === language ? <Check className="size-4 text-accent-primary" aria-hidden="true" /> : null}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div id={id} className="hidden" suppressHydrationWarning />
      <Script id="google-website-translator" src={SCRIPT_SRC} strategy="afterInteractive" onLoad={initialize} onReady={initialize} />
    </div>
  );
}

declare global {
  interface Window {
    google?: { translate: { TranslateElement: new (options: { pageLanguage: string; autoDisplay: boolean }, elementId: string) => unknown } };
  }
}
