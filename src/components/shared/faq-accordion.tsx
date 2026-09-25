'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { Minus, Plus } from 'lucide-react';
import { RichText } from '@/components/RichText';
import type { FaqItem } from '@/lib/content/types';

/**
 * Bölümün tek client parçası. Radix klavye gezinmesini ve
 * aria-expanded'ı kendisi yönetir.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion.Root type="single" collapsible className="w-full">
      {items.map((item, index) => (
        <Accordion.Item
          key={item.id}
          value={item.id}
          className="border-border-default border-b"
        >
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center gap-4 py-4 text-start">
              <span
                className="text-text-muted text-xs font-semibold"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-text-primary group-data-[state=open]:text-accent-primary flex-1 text-sm font-semibold transition-colors">
                {item.question}
              </span>
              <span className="text-accent-primary shrink-0" aria-hidden="true">
                <Plus className="h-4 w-4 group-data-[state=open]:hidden" />
                <Minus className="hidden h-4 w-4 group-data-[state=open]:block" />
              </span>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pb-4 ps-9 pe-8">
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
