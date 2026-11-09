import { Check } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import type { AppLocale } from '../types';
import TopBar from '../components/TopBar';
import { useI18n, createT } from '../i18n';

const LOCALE_OPTIONS: { id: AppLocale; labelKey: 'settings.languageZh' | 'settings.languageEn' }[] = [
  { id: 'zh', labelKey: 'settings.languageZh' },
  { id: 'en', labelKey: 'settings.languageEn' },
];

export default function LanguagePage() {
  const { t, locale, setLocale } = useI18n();
  const { action, bindBack, back } = useDaysmatterGestures();
  const showToast = useDaysmatterStore((s) => s.showToast);

  const pick = (next: AppLocale) => {
    if (next === locale) {
      back();
      return;
    }
    setLocale(next);
    showToast(createT(next)('toast.languageChanged'));
    back();
  };

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('settings.language')} back solid right={
        <button {...bindBack<HTMLButtonElement>()} className="px-2 text-[16px] text-white">{t('common.done')}</button>
      } />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <div className="mx-3 overflow-hidden rounded-xl bg-white">
          {LOCALE_OPTIONS.map((o, i) => (
            <button
              key={o.id}
              {...action<HTMLButtonElement>('settings.locale.pick', () => pick(o.id), { params: { value: o.id } })}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#F2F1EC] ${i < LOCALE_OPTIONS.length - 1 ? 'border-b border-[#F2F1EC]' : ''}`}
            >
              <span className="text-[16px] text-[#1A1A1A]">{t(o.labelKey)}</span>
              {locale === o.id && <Check size={20} className="text-[#3E7CB1]" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
