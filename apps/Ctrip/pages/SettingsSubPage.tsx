import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Switch, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 设置二级页(spec settings.sub,inferred)。二级设置项 toggle / toast(Q16 要求可进)。 */
const TOGGLES = [
  { key: 'subRealname', label: '实名认证展示' },
  { key: 'subLocation', label: '允许获取位置' },
  { key: 'subPersonalized', label: '个性化推荐' },
];
const LINKS = ['修改密码', '绑定手机', '第三方账号', '注销账号'];

export default function SettingsSubPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const settings = useCtripStore((s) => s.settings);
  const toggleSetting = useCtripStore((s) => s.toggleSetting);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="账号设置" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2]">
              <span className="text-[15px] text-[#222222]">{t.label}</span>
              <Switch on={!!settings[t.key]} onToggle={() => toggleSetting(t.key)} binding={bindTap({ kind: 'action', id: 'settingsSub.item.toggle' }, { params: { key: t.key }, onTrigger: () => toggleSetting(t.key) })} />
            </div>
          ))}
        </div>
        <div className="bg-white mt-2">
          {LINKS.map((l) => (
            <button key={l} {...bindTap({ kind: 'action', id: 'settingsSub.item.toggle' }, { params: { link: l }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
              <span className="text-[15px] text-[#222222]">{l}</span>
              <span className="text-[#CCCCCC]">›</span>
            </button>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}
