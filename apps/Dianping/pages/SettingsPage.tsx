import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { setLocale, useLocale } from '../../../os/locale';
import { SETTINGS_GROUPS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcChevronRight } from '../res/icons';

const LANGS: { id: 'zh-Hans' | 'en'; label: string }[] = [
  { id: 'zh-Hans', label: '简体中文' },
  { id: 'en', label: 'English' },
];

export default function SettingsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, back } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const locale = useLocale();
  const [sp] = useSearchParams();
  const sheet = sp.get('sheet');
  const currentLangLabel = LANGS.find((l) => l.id === locale)?.label ?? '简体中文';

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-(--app-c-card-bg) px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        <div className="text-[16px] font-semibold text-(--app-c-text-primary)">{s.settings}</div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="settings" data-scroll-direction="vertical">
        {SETTINGS_GROUPS.map((group, gi) => (
          <div key={gi} className="mt-2 bg-(--app-c-card-bg)">
            {group.map((row) => {
              const isLang = row.label === '多语言';
              const isProfile = row.label === '个人资料';
              const binding = isLang
                ? bindTap('settings.lang-open')
                : isProfile
                  ? bindTap('settings.profile-open')
                  : action('settings.item.open.disabled', () => showToast(s.notOpen));
              return (
                <button
                  key={row.label}
                  type="button"
                  className="flex w-full items-center justify-between border-none border-b border-(--app-c-border) bg-transparent px-4 py-3.5 text-left last:border-none cursor-pointer"
                  {...binding}
                >
                  <span className="flex items-center gap-2 text-[15px] text-(--app-c-text-primary)">
                    {isLang ? s.multiLang : row.label}
                    {row.badge ? (
                      <span className="rounded-full bg-[#FF4B33] px-1.5 py-0.5 text-[9px] font-medium text-white">
                        {row.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1 text-[13px] text-(--app-c-text-muted)">
                    {isLang ? currentLangLabel : (row.extra ?? '')}
                    <IcChevronRight size={14} className="text-[#CCC]" />
                  </span>
                </button>
              );
            })}
          </div>
        ))}

        <button
          type="button"
          className="mt-3 mb-4 w-full border-none bg-(--app-c-card-bg) py-4 text-center text-[15px] text-(--app-c-text-primary) cursor-pointer"
          {...action('settings.logout.action', () => showToast(s.notOpen))}
        >
          {s.logout}
        </button>
      </div>

      {/* 语言选择弹层 */}
      {sheet === 'lang' ? (
        <div className="absolute inset-0 z-20 flex flex-col justify-end">
          <button type="button" aria-label="close" className="absolute inset-0 border-none bg-black/40 cursor-pointer" {...bindBack()} />
          <div className="relative rounded-t-[16px] bg-(--app-c-card-bg) pb-3">
            <div className="py-3 text-center text-[15px] font-semibold text-(--app-c-text-primary)">{s.pickLang}</div>
            {LANGS.map((l) => {
              const on = l.id === locale;
              return (
                <button
                  key={l.id}
                  type="button"
                  className="flex w-full items-center justify-between border-none border-t border-(--app-c-border) bg-transparent px-5 py-3.5 text-left cursor-pointer"
                  {...action(
                    'settings.lang.select.target',
                    () => {
                      setLocale(l.id);
                      back();
                    },
                    { params: { target: l.id === 'en' ? 'en' : 'zh' } },
                  )}
                >
                  <span className={`text-[15px] ${on ? 'font-semibold text-[#FF6633]' : 'text-(--app-c-text-primary)'}`}>
                    {l.label}
                  </span>
                  {on ? <span className="text-[15px] text-[#FF6633]">✓</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
