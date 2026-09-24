import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader, Row, Toggle } from '../components/common';

export default function PrivacySettingsPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <PageHeader title={s.privacy} />
      <div className="mt-2">
        <Row label="系统权限管理" bind={action('privacy.perm.wontfixToast', toast)} />
        <Row label="个性化推送" right={<Toggle on={st.settings.personalizePush} bind={action('privacy.personalize.toggle', () => st.togglePersonalize())} />} />
        <Row label="账号资料" bind={action('privacy.legal.wontfixToast', toast)} />
      </div>
      <button {...action('privacy.legal.wontfixToast', toast)} className="mt-6 w-full text-center text-xs text-[#5B78C8]">《隐私政策》</button>
    </div>
  );
}
