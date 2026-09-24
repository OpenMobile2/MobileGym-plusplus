import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { TopBar, Card, Row } from '../components/ui';

/** 支付设置 —— 证据 n24(白卡三行)。 */
export default function PaySettingsPage() {
  const { bindTap } = useDidiGestures();
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="支付设置" />
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <Card>
          <Row label="支付密码管理" bind={bindTap('pay.password.open')} />
          <Row label="免密支付设置" bind={bindTap('pay.methods.open')} />
          <Row label="亲友代付设置" bind={bindTap('family.pay.open')} last />
        </Card>
      </div>
    </div>
  );
}
