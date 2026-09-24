import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, SectionLabel, Row, ToggleRow } from '../components/ui';

/** 个人信息与权限 —— 证据 n17、n18(个人信息/授权/系统权限三节)。 */
export default function SettingsPrivacyPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const settings = useDidiStore((s) => s.settings);
  const toggleSetting = useDidiStore((s) => s.toggleSetting);

  const t = () => toast('该功能暂未开放');

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="个人信息与权限" />
      <div
        className="flex-1 overflow-y-auto px-3 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <SectionLabel>个人信息</SectionLabel>
        <Card>
          <Row label="个人信息管理" onClick={t} />
          <Row label="个人信息副本导出" onClick={t} last />
        </Card>

        <SectionLabel>授权</SectionLabel>
        <Card>
          <Row label="平台服务授权" onClick={t} />
          <Row label="基本个人信息处理知情权" onClick={t} last />
        </Card>

        <SectionLabel>系统权限</SectionLabel>
        <Card>
          <Row label="位置" value="已开启" onClick={t} />
          <Row label="麦克风" value="已开启" onClick={t} />
          <Row label="IDFA广告标识" value="去设置" onClick={t} />
          <Row label="新消息通知" value="去设置" onClick={t} />
          <ToggleRow
            label="允许读取剪切板"
            on={settings.clipboardRead}
            bind={bindTap(
              { kind: 'action', id: 'settings.privacy.clipboard.toggle' },
              { onTrigger: () => toggleSetting('clipboardRead') },
            )}
          />
          <Row label="蓝牙" value="已开启" onClick={t} />
          <Row label="首页弹窗" value="已开启" onClick={t} last />
        </Card>
      </div>
    </div>
  );
}
