import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';
import { Language, TranslationSchema } from './types';

export * from './types';
export { en } from './locales/en';
export { ptBR } from './locales/pt-BR';

export const translations: Record<Language, TranslationSchema> = {
  en,
  'pt-BR': ptBR,
};

export const SUPPORTED_LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English (Default)', nativeLabel: 'English (Default)' },
  { code: 'pt-BR', label: 'Português (Brasil)', nativeLabel: 'Português (Brasil)' },
];

export function getTranslations(lang: Language): TranslationSchema {
  return translations[lang] || translations.en;
}

/**
 * Type-safe dot-notation translation resolver with placeholder replacement.
 * e.g., t('pt-BR', 'popup.errorInitFailed', { error: 'Timeout' })
 */
export function t(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = getTranslations(lang);
  const parts = path.split('.');

  let current: any = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      // Fallback to English if missing in target locale
      let fallback: any = translations.en;
      for (const p of parts) {
        if (fallback && typeof fallback === 'object' && p in fallback) {
          fallback = fallback[p];
        } else {
          return path;
        }
      }
      current = fallback;
      break;
    }
  }

  if (typeof current !== 'string') {
    return path;
  }

  let result = current;
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    });
  }

  return result;
}

/**
 * Locale-aware date formatter
 */
export function formatDate(
  dateInput: string | Date | number,
  lang: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }
    const locale = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
    const defaultOptions: Intl.DateTimeFormatOptions = options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    return String(dateInput);
  }
}

/**
 * Locale-aware number formatter
 */
export function formatNumber(
  num: number,
  lang: Language,
  options?: Intl.NumberFormatOptions
): string {
  try {
    const locale = lang === 'pt-BR' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return String(num);
  }
}
