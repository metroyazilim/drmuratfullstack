import messages from '@/messages/tr.json';

type TranslationValues = Record<string, string | number>;
type MessageTree = { [key: string]: string | MessageTree };
export type TranslationFunction = (key: string, values?: TranslationValues) => string;

function resolveMessage(key: string): string {
  let current: string | MessageTree = messages as MessageTree;
  for (const segment of key.split('.')) {
    if (typeof current === 'string' || !(segment in current)) return key;
    current = current[segment] as string | MessageTree;
  }
  return typeof current === 'string' ? current : key;
}

function interpolate(message: string, values?: TranslationValues): string {
  if (!values) return message;
  return message.replace(/\{([^}]+)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : placeholder,
  );
}

export function t(key: string, values?: TranslationValues): string {
  return interpolate(resolveMessage(key), values);
}

function translator(namespace?: string): TranslationFunction {
  return (key, values) => t(namespace ? `${namespace}.${key}` : key, values);
}

export function useTranslations(namespace?: string): TranslationFunction {
  return translator(namespace);
}

export async function getTranslations(
  namespaceOrOptions?: string | { namespace?: string },
): Promise<TranslationFunction> {
  const namespace =
    typeof namespaceOrOptions === 'string'
      ? namespaceOrOptions
      : namespaceOrOptions?.namespace;
  return translator(namespace);
}

export async function getFormatter(): Promise<{
  dateTime(value: Date | string | number, options?: Intl.DateTimeFormatOptions): string;
}> {
  return {
    dateTime(value, options) {
      return new Intl.DateTimeFormat('tr-TR', options).format(new Date(value));
    },
  };
}
