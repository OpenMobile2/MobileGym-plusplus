import { useLocale } from '@/os/locale';
import { messages, type AppLocale } from './locales';
import { useSlackStore } from '../state';

/** dotted-key 查找 + {{param}} 插值，fallback: locale → zh → key 本身 */
export function createT(locale: AppLocale) {
  return (key: string, params?: Record<string, string | number>): string => {
    let s = messages[locale]?.[key] ?? messages.zh[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      }
    }
    return s;
  };
}

/** 首选项里选了具体语言就用它，选「与系统设置相同」则跟随 OS */
export function useI18n() {
  const osLocale = useLocale();
  const pref = useSlackStore((s) => s.settings.language);
  const locale: AppLocale = pref === 'system' ? (osLocale === 'en' ? 'en' : 'zh') : pref;
  return { t: createT(locale), locale };
}
