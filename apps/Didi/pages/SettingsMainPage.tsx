import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { TopBar, Card, SectionLabel, Row, ToggleRow } from '../components/ui';

/** 设置 —— 证据 n15(账号与安全/外观及个性化/关于+退出登录)。 */
export default function SettingsMainPage() {
  const { bindTap } = useDidiGestures();
  const s = useDidiStrings();
  const toast = useDidiStore((s) => s.toast);
  const settings = useDidiStore((s) => s.settings);
  const toggleSetting = useDidiStore((s) => s.toggleSetting);
  const clearPrivateData = useDidiStore((s) => s.clearPrivateData);

  return (
    <div
      className="flex flex-col h-full bg-app-bg"
      data-status-bar-foreground="dark"
      data-testid="didi-settings-page"
      data-page="settings"
      data-automation-label="设置"
      aria-label={s.settings}
    >
      <TopBar title={s.settings} titleTestId="didi-settings-title" automationLabel="设置" />
      <div
        className="flex-1 overflow-y-auto px-3 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <SectionLabel>{s.settingsAccountSection}</SectionLabel>
        <Card>
          <Row label={s.accountSecurityTitle} bind={bindTap('settings.account.open')} />
          <Row label={s.settingsTripSafety} bind={bindTap('safety.fromSettings')} />
          <Row label={s.titlePaySettings} bind={bindTap('pay.fromSettings')} />
          <Row label={s.titlePrivacy} bind={bindTap('settings.privacy.open')} last />
        </Card>

        <SectionLabel>{s.settingsAppearanceSection}</SectionLabel>
        <Card>
          <Row label={s.titleGeneral} bind={bindTap('settings.general.open')} />
          <Row
            label={s.settingsLanguage}
            value={s.settingsSimplifiedChinese}
            onClick={() => toast(s.unavailable)}
          />
          <ToggleRow
            label={s.settingsElderMode}
            desc={s.settingsElderModeHint}
            on={settings.elderMode}
            bind={bindTap(
              { kind: 'action', id: 'settings.main.elder.toggle' },
              { onTrigger: () => toggleSetting('elderMode') },
            )}
          />
          <Row label={s.settingsFontSize} onClick={() => toast(s.unavailable)} />
          <Row label={s.settingsRecommendations} onClick={() => toast(s.unavailable)} />
          <Row label={s.titleSkin} bind={bindTap('skin.settings.open')} last />
        </Card>

        <SectionLabel>{s.settingsAboutSection}</SectionLabel>
        <Card>
          <Row
            label={s.settingsAboutDidi}
            value="8.10.0"
            onClick={() => toast(s.unavailable)}
            last
          />
        </Card>

        <div className="mt-4">
          <Card>
            <button
              {...bindTap('auth.login.open', { beforeTrigger: () => clearPrivateData() })}
              className="w-full py-3.5 bg-transparent border-none text-center text-[15px] text-red-500"
            >
              {s.settingsSignOut}
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
