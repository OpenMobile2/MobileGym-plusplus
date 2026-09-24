import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader, Row } from '../components/common';

export default function SettingsPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <PageHeader title={s.settings} />
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2">
          <Row label={s.accountManage} bind={bindTap('settings.account.open')} />
          <Row label={s.soundVibrate} bind={bindTap('settings.sound.open')} />
          <Row label={s.pushSettings} bind={bindTap('settings.push.open')} right={<span className="h-1.5 w-1.5 rounded-full bg-[#FF4D4F]" />} />
          <Row label={s.privacy} bind={bindTap('settings.privacy.open')} />
        </div>
        <div className="mt-3">
          <Row label="Spotlight查词" bind={action('settings.spotlight.wontfixToast', toast)} />
          <Row label="开屏单词海报" right="未开启" bind={action('settings.poster.wontfixToast', toast)} />
        </div>
        <div className="mt-3">
          <Row label={s.cacheManage} bind={bindTap('settings.cache.open')} />
          <Row label="个人信息收集清单" bind={action('settings.legal.wontfixToast', toast)} />
          <Row label="第三方合作清单" bind={action('settings.legal.wontfixToast', toast)} />
          <Row label="关于我们" bind={action('settings.legal.wontfixToast', toast)} />
        </div>
        <button {...action('settings.logout.confirm', () => st.logout())} className="mx-8 mt-6 w-[calc(100%-4rem)] rounded-full bg-[#FDE7E7] py-3 text-sm text-[#E4574C]">{s.logout}</button>
      </div>
    </div>
  );
}
