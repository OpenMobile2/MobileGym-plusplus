import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import Img from '../components/Img';
import { useI18n } from '../i18n';

/** 发现 Tab(spec discover.main):整页占位(用户拍板 wontfix) */
export default function DiscoverPage() {
  const { isDark } = useDarkMode();
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col bg-(--app-c-card-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <div className="mt-10 flex h-11 shrink-0 items-center justify-center text-[17px] font-semibold text-(--app-c-text-primary)">
        {t('tab.discover')}
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="h-28 w-28 object-contain opacity-70" />
        <div className="mt-4 text-[15px] text-(--app-c-text-muted)">{t('discover.placeholder')}</div>
      </div>
    </div>
  );
}
