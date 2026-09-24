import React from 'react';
import { POMO_MINUTE_OPTIONS } from '../constants';
import { SettingsChoiceRow, SettingsGroup, SettingsScaffold } from '../components/SettingsScaffold';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { useDidaStore } from '../state';

const GeneralPage: React.FC = () => {
  const { t } = useI18n();
  const { action } = useDidaGestures();
  const { accentHex } = useDidaTheme();
  const showCompleted = useDidaStore((s) => s.settings.showCompleted);
  const pomoMinutes = useDidaStore((s) => s.settings.pomoMinutes);
  const setSetting = useDidaStore((s) => s.setSetting);

  return (
    <SettingsScaffold title={t('me.general')}>
      <SettingsGroup>
        <button
          {...action('general.showCompleted.toggle', () => setSetting('showCompleted', !showCompleted))}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <span className="text-[16px]">{t('general.showCompleted')}</span>
          <span
            className="relative h-7 w-12 rounded-full transition-colors"
            style={{ background: showCompleted ? accentHex : 'var(--dida-chip-off)' }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform"
              style={{ left: showCompleted ? 22 : 2 }}
            />
          </span>
        </button>
      </SettingsGroup>

      <p className="dida-muted mb-2 px-1 text-[13px]">{t('general.pomoSection')}</p>
      <SettingsGroup>
        {POMO_MINUTE_OPTIONS.map((min, i) => (
          <SettingsChoiceRow
            key={min}
            label={t('general.pomoMinutes', { n: min })}
            selected={pomoMinutes === min}
            last={i === POMO_MINUTE_OPTIONS.length - 1}
            bind={action('general.pomo.select', () => setSetting('pomoMinutes', min), {
              params: { minutes: String(min) },
            })}
          />
        ))}
      </SettingsGroup>
    </SettingsScaffold>
  );
};

export default GeneralPage;
