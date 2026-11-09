import React from 'react';
import { SettingsChoiceRow, SettingsGroup, SettingsScaffold } from '../components/SettingsScaffold';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useI18n } from '../i18n';
import { useDidaStore } from '../state';
import type { ThemePref } from '../types';

const THEME_OPTIONS: { id: ThemePref; key: string }[] = [
  { id: 'light', key: 'appearance.light' },
  { id: 'dark', key: 'appearance.dark' },
  { id: 'system', key: 'appearance.system' },
];

const AppearancePage: React.FC = () => {
  const { t } = useI18n();
  const { action } = useDidaGestures();
  const theme = useDidaStore((s) => s.settings.theme);
  const setSetting = useDidaStore((s) => s.setSetting);

  return (
    <SettingsScaffold title={t('me.appearance')}>
      <SettingsGroup>
        {THEME_OPTIONS.map((opt, i) => (
          <SettingsChoiceRow
            key={opt.id}
            label={t(opt.key)}
            selected={theme === opt.id}
            last={i === THEME_OPTIONS.length - 1}
            bind={action('appearance.theme.select', () => setSetting('theme', opt.id), {
              params: { theme: opt.id },
            })}
          />
        ))}
      </SettingsGroup>
    </SettingsScaffold>
  );
};

export default AppearancePage;
