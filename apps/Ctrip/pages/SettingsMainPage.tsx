import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Switch, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 设置(spec settings.main)。二级页→sub;开关toggle;退出登录确认;其余项wontfix(Q16)。 */
const NAV_ITEMS = ['个人信息', '账号与安全', '支付设置', '隐私设置'];
const SWITCH_ITEMS = [
  { key: 'network', label: '使用移动网络播放' },
  { key: 'notifyOrder', label: '订单通知' },
  { key: 'notifyPromo', label: '促销推送' },
  { key: 'careMode', label: '关怀版模式' },
];
const MISC_ITEMS = ['主页换肤', '消息通知设置', '资质规则', '个人信息收集清单', '算法公开', '加盟合作', '关于携程'];

export default function SettingsMainPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const settings = useCtripStore((s) => s.settings);
  const toggleSetting = useCtripStore((s) => s.toggleSetting);
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="设置" />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 二级页导航 */}
        <div className="bg-white mt-2">
          {NAV_ITEMS.map((n) => (
            <button key={n} {...bindTap('settings.toSub')} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
              <span className="text-[15px] text-[#222222]">{n}</span>
              <span className="text-[#CCCCCC]">›</span>
            </button>
          ))}
        </div>

        {/* 开关 */}
        <div className="bg-white mt-2">
          {SWITCH_ITEMS.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2]">
              <span className="text-[15px] text-[#222222]">{s.label}</span>
              <Switch on={!!settings[s.key]} onToggle={() => toggleSetting(s.key)} binding={bindTap({ kind: 'action', id: 'settings.switch.toggle.network' }, { params: { key: s.key }, onTrigger: () => toggleSetting(s.key) })} />
            </div>
          ))}
        </div>

        {/* 其它项 */}
        <div className="bg-white mt-2">
          {MISC_ITEMS.map((m) => (
            <button key={m} {...bindTap({ kind: 'action', id: 'settings.misc.wontfix' }, { params: { m }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
              <span className="text-[15px] text-[#222222]">{m}</span>
              <span className="text-[#CCCCCC]">›</span>
            </button>
          ))}
        </div>

        {/* 退出登录 */}
        <button
          {...bindTap({ kind: 'action', id: 'settings.logout.confirm' }, { onTrigger: () => setConfirmLogout(true) })}
          className="bg-white mt-2 w-full py-3.5 text-[15px] text-[#FF3B5C] border-none cursor-pointer"
        >退出登录</button>
      </div>

      {confirmLogout && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" onClick={() => setConfirmLogout(false)}>
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative bg-white rounded-2xl w-64 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-5 text-center text-[15px] text-[#222222]">确定退出登录吗?</div>
            <div className="flex border-t border-[#F0F0F0]">
              <button onClick={() => setConfirmLogout(false)} className="flex-1 py-3 text-[15px] text-[#666666] bg-white border-none cursor-pointer">取消</button>
              <button onClick={() => { setConfirmLogout(false); showToast('已退出(演示,不清空数据)'); }} className="flex-1 py-3 text-[15px] text-[#FF3B5C] bg-white border-l border-[#F0F0F0] cursor-pointer">退出</button>
            </div>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}
