'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';
import { RichText } from '@/components/RichText';
import type { FaqItem } from '@/lib/content/types';

/**
 * SSS sayfası akordeonu.
 *
 * Anasayfadakinden farklı olarak `type="multiple"` ve tümü VARSAYILAN AÇIK:
 * Google yapısal verideki içeriğin kullanıcıya da görünür olmasını bekliyor,
 * varsayılan kapalı bir akordeon bu beklentiyi zorlar.
 */
export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <Accordion.Root
      type="multiple"
      defaultValue={items.map((item) => item.id)}
      className="w-full"
    >
      {items.map((item, index) => (
        <Accordion.Item
          key={item.id}
          value={item.id}
          className="border-border-default border-b"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-start gap-4 py-5 text-start">
              <span
                className="text-text-muted mt-0.5 text-xs font-semibold"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}.
              </span>
              <span className="text-text-primary flex-1 text-base font-semibold">
                {item.question}
              </span>
              <span className="text-accent-primary mt-0.5 shrink-0" aria-hidden="true">
                <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
                <Minus className="hidden h-4 w-4 group-data-[state=open]:block" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-5 ps-10 pe-8">
            <RichText
              html={item.answer}
              className="text-text-muted text-sm leading-relaxed"
            />
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
