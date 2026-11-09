import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, ConfirmDialog, WY } from '../components/ui';
import { SETTINGS_SECTIONS } from '../constants';

export default function SettingsPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [logout, setLogout] = React.useState(false);
  const doLogout = useWangyiyunStore((s) => s.logout);
  return (
    <Screen>
      <TopBar title="设置" />
      <div className="flex-1 overflow-y-auto">
        {SETTINGS_SECTIONS.map((sec) => (
          <button key={sec} onClick={() => go('settings.sub-open', { section: sec })} className="flex items-center w-full px-4 py-3.5 bg-white border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
            <span className="flex-1 text-[15px]" style={{ color: WY.textPrimary }}>{sec}</span>
            <span style={{ color: WY.textTertiary }}>›</span>
          </button>
        ))}
        <button {...bindTap({ kind: 'action', id: 'settings.logout.flow' }, { onTrigger: () => setLogout(true) })}
          className="w-full mt-4 py-3.5 bg-white text-[15px] border-none cursor-pointer" style={{ color: WY.primary }}>退出登录</button>
      </div>
      <ConfirmDialog open={logout} title="确定退出当前账号吗?" onClose={() => setLogout(false)}
        options={[{ label: '退出', danger: true, onTap: () => { doLogout(); go('settings.logout'); } }, { label: '取消', onTap: () => {} }]} />
    </Screen>
  );
}
