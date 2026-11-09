import { useAppStrings } from '@/os/useAppStrings';
import { useLocale } from '@/os/locale';
import { strings, type YoukuStringKey } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { DOT_MAP } from './dotMap';

export type AppLocale = 'zh' | 'en';

/** 跟随 OS 语言;底层走 useAppStrings(res/strings + strings.en) */
export function useI18n() {
  const s = useAppStrings(strings, stringsEn);
  const osLocale = useLocale();
  const locale: AppLocale = osLocale === 'en' ? 'en' : 'zh';
  const t = (key: string, params?: Record<string, string | number>): string => {
    const mapped = DOT_MAP[key] ?? (key as YoukuStringKey);
    let out = (s as Record<string, string>)[mapped] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return out;
  };
  return { t, s, locale };
}
