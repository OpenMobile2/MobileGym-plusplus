import { useLocale } from '@/os/locale';
import { messages, type AppLocale } from './locales';

/** dotted-key 查找 + {{param}} 插值,fallback: locale → zh → key 本身 */
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

/** 跟随 OS 系统语言(V10:切系统语言文案跟随中/英) */
export function useI18n() {
  const osLocale = useLocale();
  const locale: AppLocale = osLocale === 'en' ? 'en' : 'zh';
  return { t: createT(locale), locale };
}
