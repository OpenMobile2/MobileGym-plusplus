import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { PREFS_LANGUAGE_OPTIONS } from '../constants';
import { NEUTRAL, GREEN } from '../res/colors';
import SecondaryCloseHeader from '../components/SecondaryCloseHeader';

const PrefsLanguagePage: React.FC = () => {
  const { action } = useSlackGestures();
  const { t } = useI18n();
  const language = useSlackStore((s) => s.settings.language);
  const setSetting = useSlackStore((s) => s.setSetting);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const selected = language === 'system' ? 'zh' : language;

  return (
    <div className="flex h-full flex-col bg-white">
      <SecondaryCloseHeader title={t('prefs.language')} />
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {PREFS_LANGUAGE_OPTIONS.map((opt) => {
          const on = selected === opt.id;
          const pick = () => {
            if (!opt.enabled) {
              notImplemented();
              return;
            }
            setSetting('language', opt.id as 'zh' | 'en');
          };
          return (
            <button
              key={opt.id}
              {...action(`slack.prefs.language.select.${opt.id}`, pick)}
              className="flex w-full items-center justify-between border-none bg-transparent px-4 py-3.5 text-left"
            >
              <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
                {t(opt.labelKey)}
              </span>
              {on && opt.enabled && (
                <span className="text-[17px] font-bold" style={{ color: GREEN.primary }}>✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PrefsLanguagePage;
