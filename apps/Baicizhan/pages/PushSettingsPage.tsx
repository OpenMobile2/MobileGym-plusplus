import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader, Row, Toggle } from '../components/common';

export default function PushSettingsPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const master = st.settings.pushMaster;
  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <PageHeader title={s.pushSettings} />
      <div className="mt-2">
        <Row label="接收消息提醒" sub="关闭后,将不再接受新消息" right={<Toggle on={master} bind={action('settings.push.master', () => st.togglePushMaster())} />} />
      </div>
      <div className="mt-3">
        <Row label="挑战任务提醒" sub="不断电、排行榜等" right={<Toggle on={master && st.settings.push.challenge} disabled={!master} bind={action('settings.push.challenge', () => st.togglePush('challenge'))} />} />
        <Row label="一起背提醒" sub="同桌、小班、组队等" right={<Toggle on={master && st.settings.push.together} disabled={!master} bind={action('settings.push.together', () => st.togglePush('together'))} />} />
        <Row label="每日一句提醒" right={<Toggle on={master && st.settings.push.daily} disabled={!master} bind={action('settings.push.daily', () => st.togglePush('daily'))} />} />
        <Row label="科学复习提醒" right={<Toggle on={master && st.settings.push.review} disabled={!master} bind={action('settings.push.review', () => st.togglePush('review'))} />} />
      </div>
      <div className="mt-3">
        <Row label="背单词提醒" right="未开启" bind={action('settings.push.ext.wontfixToast', toast)} />
        <Row label="微信提醒" right="未开启" bind={action('settings.push.ext.wontfixToast', toast)} />
      </div>
    </div>
  );
}
