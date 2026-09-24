import React from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/ui';
import {
  IcArrowRight, IcUsers, IcShield, IcCard, IcMoney, IcLocation,
} from '../res/icons';

/** 开关(受控展示) */
function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center w-11 h-6 rounded-full px-0.5 transition-colors ${
        on ? 'bg-[#1CB854] justify-end' : 'bg-[#D8D8D8] justify-start'
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </span>
  );
}

export default function SettingsPage() {
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const darkMode = useXianyuStore((s) => s.settings.darkMode);
  const language = useXianyuStore((s) => s.settings.language);
  const toggleDarkMode = useXianyuStore((s) => s.toggleDarkMode);
  const setLanguage = useXianyuStore((s) => s.setLanguage);

  const wontfix = () => showToast('该功能暂未开放');

  const accountRows = [
    { id: 'profile', label: '个人资料', Icon: IcUsers },
    { id: 'security', label: '账号与安全', Icon: IcShield },
    { id: 'pay', label: '支付方式(免密)', Icon: IcCard },
    { id: 'receive', label: '收款方式', Icon: IcMoney },
  ] as const;

  const moreRows = [
    { id: 'elder', label: '长辈模式' },
    { id: 'minor', label: '未成年人模式' },
    { id: 'privacy', label: '隐私' },
    { id: 'about', label: '关于闲鱼' },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="设置" />

      <div className="flex-1 overflow-y-auto pb-8" data-scroll-container="SettingsPage-main" data-scroll-direction="vertical">
        {/* 账号分组 */}
        <div className="bg-white mx-3 mt-3 rounded-xl overflow-hidden">
          {accountRows.map((r) => (
            <button
              key={r.id}
              onClick={wontfix}
              className="w-full flex items-center gap-3 px-3 h-12 bg-transparent border-none border-b border-[#F4F4F4] last:border-b-0 cursor-pointer"
            >
              <r.Icon size={19} className="text-[#666]" />
              <span className="flex-1 text-left text-[15px] text-[#111]">{r.label}</span>
              <IcArrowRight size={16} className="text-[#CCC]" />
            </button>
          ))}
          <div
            {...bindTap('settings.address-open')}
            className="w-full flex items-center gap-3 px-3 h-12 cursor-pointer"
          >
            <IcLocation size={19} className="text-[#666]" />
            <span className="flex-1 text-[15px] text-[#111]">地址管理</span>
            <IcArrowRight size={16} className="text-[#CCC]" />
          </div>
        </div>

        {/* 外观 / 语言分组 */}
        <div className="bg-white mx-3 mt-3 rounded-xl overflow-hidden">
          <div
            {...bindTap({ kind: 'action', id: 'settings.darkmode.toggle' }, { onTrigger: () => toggleDarkMode() })}
            className="w-full flex items-center gap-3 px-3 h-12 border-b border-[#F4F4F4] cursor-pointer"
          >
            <span className="flex-1 text-[15px] text-[#111]">深色模式</span>
            <Switch on={darkMode} />
          </div>
          <div
            {...bindTap(
              { kind: 'action', id: 'settings.language.select.target' },
              { params: { target: language === 'zh' ? 'en' : 'zh' }, onTrigger: () => setLanguage(language === 'zh' ? 'en' : 'zh') },
            )}
            className="w-full flex items-center gap-3 px-3 h-12 cursor-pointer"
          >
            <span className="flex-1 text-[15px] text-[#111]">语言</span>
            <span className="text-[13px] text-[#999]">{language === 'zh' ? '中文' : 'English'}</span>
            <IcArrowRight size={16} className="text-[#CCC]" />
          </div>
        </div>

        {/* 更多分组 */}
        <div className="bg-white mx-3 mt-3 rounded-xl overflow-hidden">
          {moreRows.map((r) => (
            <button
              key={r.id}
              onClick={wontfix}
              className="w-full flex items-center gap-3 px-3 h-12 bg-transparent border-none border-b border-[#F4F4F4] last:border-b-0 cursor-pointer"
            >
              <span className="flex-1 text-left text-[15px] text-[#111]">{r.label}</span>
              <IcArrowRight size={16} className="text-[#CCC]" />
            </button>
          ))}
        </div>

        {/* 退出登录 */}
        <button
          onClick={wontfix}
          className="w-[calc(100%-24px)] mx-3 mt-3 h-12 rounded-xl bg-white text-[15px] text-[#FF3B30] font-medium border-none cursor-pointer"
        >
          退出登录
        </button>
      </div>
      {toast}
    </div>
  );
}
