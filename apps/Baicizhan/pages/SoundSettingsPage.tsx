import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader, Row, Toggle } from '../components/common';

export default function SoundSettingsPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <PageHeader title={s.soundVibrate} />
      <div className="mt-2">
        <Row label="音效" right={<Toggle on={st.settings.sound} bind={action('settings.sound.toggle', () => st.toggleSound())} />} />
        <Row label="震动" right={<Toggle on={st.settings.vibrate} bind={action('settings.vibrate.toggle', () => st.toggleVibrate())} />} />
      </div>
    </div>
  );
}
