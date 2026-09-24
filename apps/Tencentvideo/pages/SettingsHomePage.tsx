// 设置主页。节点 settings.home(spec 16 条交互)。
// 视觉证据 721:浅灰底 + 三张白色分组卡(圆角 12,行高 52,右侧灰色 ›),
// 底部两颗独立白色通栏按钮「切换账号」「退出账号」。
// 6 个子设置页共用 /settings/sub 一个路由,靠各自的 transition 带 ?section= 区分。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TopBar, type BindProps } from '../components/ui';
import { IcArrowRight } from '../res/icons';

/** 设置行:左标题 + 右侧值/说明 + ›(证据 721) */
function SettingsRow({ label, value, bind }: { label: string; value?: string; bind: BindProps }) {
  return (
    <button
      {...bind}
      className="flex items-center w-full px-4 h-[52px] bg-transparent border-none text-left"
    >
      <span className="flex-1 text-[15px]" style={{ color: C.text }}>
        {label}
      </span>
      {value && (
        <span className="text-[12px] pr-1" style={{ color: C.textSub }}>
          {value}
        </span>
      )}
      <IcArrowRight size={16} color={C.textTertiary} />
    </button>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-3 mt-3 rounded-xl overflow-hidden" style={{ background: C.pageBg }}>
      {children}
    </div>
  );
}

export default function SettingsHomePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const settings = useTencentvideoStore((s) => s.settings);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);
  const switchAccountMock = useTencentvideoStore((s) => s.switchAccountMock);
  const logoutMock = useTencentvideoStore((s) => s.logoutMock);

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  return (
    <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
      <TopBar title={s.settingsTitle} transparent />

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <SettingsGroup>
          <SettingsRow label={s.settingsAccount} bind={wontfix('settings.account.wontfix')} />
          <SettingsRow label={s.settingsDevices} bind={bindTap('device.manage.open.fromSettings')} />
          <SettingsRow
            label={s.settingsAppearance}
            bind={bindTap('settings.sub.open.appearance', { params: { section: 'appearance' } })}
          />
          <SettingsRow label={s.settingsMinor} bind={wontfix('settings.minor.wontfix')} />
          <SettingsRow label={s.settingsKidGuard} bind={wontfix('settings.kidsguard.wontfix')} />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            label={s.settingsPlay}
            bind={bindTap('settings.sub.open.play', { params: { section: 'play' } })}
          />
          <SettingsRow
            label={s.settingsDownload}
            bind={bindTap('settings.sub.open.download', { params: { section: 'download' } })}
          />
          <SettingsRow
            label={s.settingsNotifyTitle}
            bind={bindTap('settings.sub.open.notify', { params: { section: 'notify' } })}
          />
          <SettingsRow
            label={s.settingsStorageManage}
            value={settings.storage.cacheSize}
            bind={bindTap('settings.sub.open.storage', { params: { section: 'storage' } })}
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            label={s.settingsPrivacyManage}
            bind={bindTap('settings.sub.open.privacy', { params: { section: 'privacy' } })}
          />
          {/* 副文案照证据 721 逐字(种子无此字段) */}
          <SettingsRow
            label={s.settingsService}
            value="24小时智能客服上线!"
            bind={wontfix('settings.service.wontfix')}
          />
          <SettingsRow label={s.settingsAbout} bind={wontfix('settings.about.wontfix')} />
        </SettingsGroup>

        {/* 账号操作:mock 切换 = toast「已是当前账号」;mock 退出 = 清登录态(state.ts) */}
        <button
          {...bindTap({ kind: 'action', id: 'auth.switch.mock' }, {
            onTrigger: () => switchAccountMock(),
          })}
          className="w-[calc(100%-24px)] mx-3 mt-4 h-12 rounded-xl border-none text-[15px]"
          style={{ background: C.pageBg, color: C.text }}
        >
          切换账号
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'auth.logout.mock' }, {
            onTrigger: () => logoutMock(),
          })}
          className="w-[calc(100%-24px)] mx-3 mt-2 h-12 rounded-xl border-none text-[15px]"
          style={{ background: C.pageBg, color: C.text }}
        >
          退出账号
        </button>
      </div>
    </div>
  );
}
