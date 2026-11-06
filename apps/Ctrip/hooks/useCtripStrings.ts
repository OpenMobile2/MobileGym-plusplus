import { useCallback } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useLocale } from '@/os/locale';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { uiEn } from '../res/ui.en';

export function useCtripStrings() {
  const base = useAppStrings(strings, stringsEn);
  const locale = useLocale();
  const t = useCallback(
    (zh: string) => {
      if (!zh) return zh;
      if (!String(locale).toLowerCase().startsWith('en')) return zh;
      return uiEn[zh] ?? zh;
    },
    [locale],
  );
  return { ...base, t };
}

export type CtripStrings = ReturnType<typeof useCtripStrings>;
