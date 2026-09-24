import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL, GREEN } from '../res/colors';
import SecondaryCloseHeader from '../components/SecondaryCloseHeader';

const MODES = [
  { id: 'light', labelKey: 'prefs.light', enabled: true },
  { id: 'dark', labelKey: 'prefs.dark', enabled: false },
  { id: 'system', labelKey: 'prefs.system', enabled: false },
] as const;

const PrefsColorModePage: React.FC = () => {
  const { action } = useSlackGestures();
  const { t } = useI18n();
  const notImplemented = useSlackStore((s) => s.notImplemented);

  return (
    <div className="flex h-full flex-col bg-white">
      <SecondaryCloseHeader title={t('prefs.colorMode')} />
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            {...action(
              m.enabled ? 'slack.prefs.colormode.select.light' : 'slack.prefs.colormode.toast',
              m.enabled ? () => {} : notImplemented,
            )}
            className="flex w-full items-center justify-between border-none bg-transparent px-4 py-3.5 text-left"
          >
            <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
              {t(m.labelKey)}
            </span>
            {m.enabled && (
              <span className="text-[17px] font-bold" style={{ color: GREEN.primary }}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PrefsColorModePage;
