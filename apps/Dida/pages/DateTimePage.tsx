import React from 'react';
import { SettingsChoiceRow, SettingsGroup, SettingsScaffold } from '../components/SettingsScaffold';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useI18n } from '../i18n';
import { useDidaStore } from '../state';
import type { TimeFormat } from '../types';

const WEEK_STARTS = [
  { id: 0, key: 'datetime.weekSun' },
  { id: 1, key: 'datetime.weekMon' },
] as const;

const TIME_FORMATS: { id: TimeFormat; key: string }[] = [
  { id: '24h', key: 'datetime.format24' },
  { id: '12h', key: 'datetime.format12' },
];

const DateTimePage: React.FC = () => {
  const { t } = useI18n();
  const { action } = useDidaGestures();
  const startOfWeek = useDidaStore((s) => s.settings.startOfWeek);
  const timeFormat = useDidaStore((s) => s.settings.timeFormat);
  const setSetting = useDidaStore((s) => s.setSetting);

  return (
    <SettingsScaffold title={t('me.datetime')}>
      <p className="dida-muted mb-2 px-1 text-[13px]">{t('datetime.weekSection')}</p>
      <SettingsGroup>
        {WEEK_STARTS.map((opt, i) => (
          <SettingsChoiceRow
            key={opt.id}
            label={t(opt.key)}
            selected={startOfWeek === opt.id}
            last={i === WEEK_STARTS.length - 1}
            bind={action('datetime.weekStart.select', () => setSetting('startOfWeek', opt.id), {
              params: { startOfWeek: String(opt.id) },
            })}
          />
        ))}
      </SettingsGroup>

      <p className="dida-muted mb-2 px-1 text-[13px]">{t('datetime.formatSection')}</p>
      <SettingsGroup>
        {TIME_FORMATS.map((opt, i) => (
          <SettingsChoiceRow
            key={opt.id}
            label={t(opt.key)}
            selected={timeFormat === opt.id}
            last={i === TIME_FORMATS.length - 1}
            bind={action('datetime.timeFormat.select', () => setSetting('timeFormat', opt.id), {
              params: { timeFormat: opt.id },
            })}
          />
        ))}
      </SettingsGroup>
    </SettingsScaffold>
  );
};

export default DateTimePage;
