import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, Row, ToggleRow } from '../components/ui';
import type { DidiSettings } from '../types';

/** 通用 —— 证据 n19(四开关+清除缓存)。 */

const TOGGLES: { key: keyof DidiSettings; label: string; desc: string }[] = [
  { key: 'realtimeTraffic', label: '实时路况', desc: '打开后地图将显示实时路况' },
  { key: 'splashTips', label: '首屏提示', desc: '打开后以语音为您播报订单状态' },
  { key: 'vibrate', label: '震动提醒', desc: '打开后将在订单应答时为您发送震动提醒' },
  { key: 'shakeAds', label: '允许展现开屏摇一摇广告', desc: '如果您对开屏摇一摇广告形式不感兴趣,可以关闭此开关' },
];

export default function SettingsGeneralPage() {
  const { bindTap } = useDidiGestures();
  const settings = useDidiStore((s) => s.settings);
  const toggleSetting = useDidiStore((s) => s.toggleSetting);
  const clearCache = useDidiStore((s) => s.clearCache);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="通用" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <Card>
          {TOGGLES.map((t, i) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              desc={t.desc}
              on={Boolean(settings[t.key])}
              last={i === TOGGLES.length - 1}
              bind={bindTap(
                { kind: 'action', id: 'settings.general.toggle' },
                { onTrigger: () => toggleSetting(t.key), params: { key: t.key } },
              )}
            />
          ))}
        </Card>

        <div className="mt-3">
          <Card>
            <Row
              label="清除缓存"
              value={`${settings.cacheMB} MB`}
              bind={bindTap(
                { kind: 'action', id: 'settings.general.clearCache' },
                { onTrigger: () => clearCache() },
              )}
              last
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
