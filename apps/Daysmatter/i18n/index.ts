import { useMemo } from 'react';
import { useDaysmatterStore } from '../state';
import { messages } from './locales';
import type { AppLocale } from '../types';
export type { AppLocale };

export type TFunction = (key: string, params?: Record<string, string | number>) => string;

function lookup(locale: AppLocale, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = messages[locale];
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in (cur as object))) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function createT(locale: AppLocale): TFunction {
  return (key, params) => {
    let text = lookup(locale, key) ?? lookup('zh', key) ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{{${k}}}`, String(v));
      }
    }
    return text;
  };
}

export function useI18n() {
  const locale = useDaysmatterStore((s) => s.settings.locale ?? 'zh');
  const patchSettings = useDaysmatterStore((s) => s.patchSettings);
  const t = useMemo(() => createT(locale), [locale]);
  const setLocale = (next: AppLocale) => patchSettings({ locale: next });
  const toggleLocale = () => setLocale(locale === 'zh' ? 'en' : 'zh');
  return { t, locale, setLocale, toggleLocale };
}

export function optionLabel(t: TFunction, group: 'repeat' | 'reminder' | 'sort' | 'cover', id: string): string {
  return t(`options.${group}.${id}`);
}
