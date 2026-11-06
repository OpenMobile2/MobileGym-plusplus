import { useLocale } from '@/os/locale';
import { useAppStrings } from '@/os/useAppStrings';
import { STRINGS } from '../res/strings';
import { STRINGS_EN } from '../res/strings.en';

export type AppLocale = 'zh' | 'en';

/** dotted-key 查找 + {{param}} 插值;底层走 useAppStrings(STRINGS, STRINGS_EN) */
export function useI18n() {
  const osLocale = useLocale();
  const locale: AppLocale = osLocale === 'en' ? 'en' : 'zh';
  const s = useAppStrings(STRINGS, STRINGS_EN);
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = (s as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return text;
  };
  return { t, locale, s };
}
