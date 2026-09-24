import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, TopBar, NOT_OPEN, MY } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcArrowRight } from '../res/icons';

const ROWS = [
  '图片浏览设置', '检查新版本', '诊断网络', '猫眼用户满意度调查', '去给猫眼电影打个分',
  '关于', '隐私管理', '收集个人信息清单', '第三方共享信息清单', '猫眼隐私政策简明版', '猫眼隐私政策', '猫眼电影用户协议',
];

/** 设置页(r8;其余行同组一致全部 toast) */
export default function SettingsPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const logout = useMaoyanStore((st) => st.logout);

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="light">
      {toast}
      <div className="shrink-0" style={{ background: MY.primary }}>
        <TopBar title={s.settings} variant="red" />
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="settings-list" data-scroll-direction="vertical">
        <div className="bg-app-surface mt-2">
          {ROWS.map((r, i) => (
            <button
              key={r}
              {...bindTap({ kind: 'action', id: 'settings.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className={`w-full flex items-center px-4 py-3.5 bg-transparent border-none cursor-pointer text-left ${i > 0 ? 'border-t border-app-border' : ''}`}
            >
              <span className="text-[14px] text-app-text">{r}</span>
              {r === '检查新版本' && <span className="ml-2 text-[9px] text-white bg-[#F5303E] rounded px-1">new</span>}
              <IcArrowRight size={15} className="ml-auto text-(--app-c-text-4)" />
            </button>
          ))}
        </div>
        <button
          {...bindTap('settings.logout-open', { beforeTrigger: () => logout() })}
          className="mt-4 mx-3 w-[calc(100%-24px)] h-11 rounded-lg text-white text-[15px] font-bold border-none cursor-pointer"
          style={{ background: MY.cta }}
        >
          {s.logout}
        </button>
        <div className="h-4" />
      </div>
    </div>
  );
}
