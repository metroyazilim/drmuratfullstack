'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const CLEAR_VALUE = '__shadcn-select-clear__';

type SelectOption = { value: string; label: string };
type SelectFieldProps = {
  options: readonly SelectOption[];
  placeholder: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  clearLabel?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
};

export function SelectField({ options, placeholder, name, value, defaultValue = '', onValueChange, disabled, id, className, clearLabel, ...aria }: SelectFieldProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const setValue = (nextValue: string) => {
    const normalizedValue = nextValue === CLEAR_VALUE ? '' : nextValue;
    if (value === undefined) setUncontrolledValue(normalizedValue);
    onValueChange?.(normalizedValue);
  };
  const visualValue = selectedValue || (clearLabel ? CLEAR_VALUE : undefined);

  return <><Select value={visualValue} onValueChange={setValue} disabled={disabled}><SelectTrigger id={id} className={className} {...aria}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{clearLabel ? <SelectItem value={CLEAR_VALUE}>{clearLabel}</SelectItem> : null}{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>{name ? <input type="hidden" name={name} value={selectedValue} /> : null}</>;
}
