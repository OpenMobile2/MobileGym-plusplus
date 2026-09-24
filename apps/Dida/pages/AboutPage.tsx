import React from 'react';
import { SettingsGroup, SettingsScaffold } from '../components/SettingsScaffold';
import { useI18n } from '../i18n';
import { manifest } from '../manifest';
import { LauncherIcon } from '../res/appIcon';

const AboutPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <SettingsScaffold title={t('me.about')}>
      <div className="mb-6 flex flex-col items-center pt-4">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-[22px]"
          style={{ background: manifest.iconBackground }}
        >
          <LauncherIcon size={52} />
        </div>
        <div className="text-[18px] font-semibold">{t('login.title')}</div>
        <div className="dida-muted mt-1 text-[14px]">
          {t('about.version', { v: manifest.version })}
        </div>
      </div>

      <SettingsGroup>
        <div
          className="flex items-center justify-between px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--dida-divider)' }}
        >
          <span className="dida-muted text-[15px]">{t('about.appName')}</span>
          <span className="text-[15px]">{t('login.title')}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="dida-muted text-[15px]">{t('about.package')}</span>
          <span className="max-w-[55%] truncate text-right text-[13px]">{manifest.packageName}</span>
        </div>
      </SettingsGroup>

      <p className="dida-muted px-1 text-center text-[12px] leading-relaxed">{t('about.footer')}</p>
    </SettingsScaffold>
  );
};

export default AboutPage;
