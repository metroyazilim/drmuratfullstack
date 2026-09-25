'use client';

import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { cn, dangerLinkButton } from './ui';

export function ConfirmButton({
  children,
  confirmText,
  className,
  onClick,
  type = 'submit',
  ...buttonProps
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmText: string;
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(confirmText)) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      {...buttonProps}
      type={type}
      className={cn(dangerLinkButton, className)}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
