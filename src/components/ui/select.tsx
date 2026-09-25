'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return <SelectPrimitive.Trigger className={cn('flex h-10 w-full items-center justify-between rounded-md border border-border-default bg-bg-base px-3 text-sm text-text-primary transition-colors focus:outline-none focus:ring-1 focus:ring-accent-primary disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-text-muted', className)} {...props}>{children}<SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 text-text-muted" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>;
}

export function SelectContent({ className, children, position = 'popper', ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return <SelectPrimitive.Portal><SelectPrimitive.Content position={position} className={cn('z-50 max-h-72 min-w-48 overflow-hidden rounded-md border border-border-default bg-bg-base text-text-primary shadow-lg', className)} {...props}><SelectPrimitive.ScrollUpButton className="flex h-8 items-center justify-center"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton><SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport><SelectPrimitive.ScrollDownButton className="flex h-8 items-center justify-center"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton></SelectPrimitive.Content></SelectPrimitive.Portal>;
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return <SelectPrimitive.Item className={cn('relative flex w-full cursor-default select-none items-center rounded-sm py-2 pr-8 pl-3 text-sm outline-none data-[highlighted]:bg-bg-surface data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} {...props}><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator className="absolute right-3"><Check className="size-4 text-accent-primary" /></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>;
}
