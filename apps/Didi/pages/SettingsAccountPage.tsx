import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { TopBar, Card, SectionLabel, Row } from '../components/ui';

/** 账号安全 —— 证据 n20(账号信息/账号安全两卡+永久注销)。 */
export default function SettingsAccountPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const user = useDidiStore((s) => s.user);
  const s = useDidiStrings();

  const stub = (name: string) =>
    bindTap(
      { kind: 'action', id: 'settings.account.stub' },
      { onTrigger: () => toast(s.unavailable), params: { name } },
    );

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={s.accountSecurityTitle} />
      <div
        className="flex-1 overflow-y-auto px-3 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <SectionLabel>{s.accountInfo}</SectionLabel>
        <Card>
          <Row label={s.accountChangePhone} value={user.phone} bind={stub('修改手机号')} />
          <Row label={s.accountChangePassword} bind={stub('修改登录密码')} />
          <Row label={s.accountVerification} value={s.accountVerified} bind={stub('实名认证')} />
          <Row label={s.accountFamily} bind={stub('亲情账号')} last />
        </Card>

        <SectionLabel>{s.accountSecurityTitle}</SectionLabel>
        <Card>
          <Row label={s.accountDeviceManagement} bind={stub('登录设备管理')} />
          <Row label={s.accountThirdParty} bind={stub('三方账号绑定')} />
          <Row label={s.accountRecoverPassword} bind={stub('找回账号密码')} last />
        </Card>

        <div className="mt-4">
          <Card>
            <button
              {...bindTap('settings.account.delete.open')}
              className="w-full py-3.5 bg-transparent border-none text-center text-[15px] text-red-500"
            >
              {s.accountDelete}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
