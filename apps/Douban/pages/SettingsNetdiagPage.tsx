// 节点: settings.netdiag —— 网络诊断(evidence IMG_0300,静态样式页)。
// 说明文案 + 「开始网络诊断」按钮 → wontfix(无真实诊断流程)。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';

export default function SettingsNetdiagPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      <TopBar title="网络诊断" />
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6" data-scroll-container="main" data-scroll-direction="vertical">
        <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="mt-14">
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" fill={C.green} />
        </svg>
        <div className="mt-6 text-[15px] font-medium" style={{ color: C.text }}>网络诊断</div>
        <p className="mt-3 text-sm leading-6 text-center" style={{ color: C.sub }}>
          若你在使用豆瓣时遇到无法加载、图片打不开等网络问题,可运行网络诊断,
          我们将检测你的网络连接状况并生成诊断报告,帮助定位问题。
        </p>
        <div className="flex-1" />
        <button
          {...bindTap(
            { kind: 'action', id: 'settings.netdiag.start.wontfix' },
            { onTrigger: () => toast('该功能暂未开放') },
          )}
          className="w-full h-12 rounded-full border-none cursor-pointer text-[16px] font-medium mb-10"
          style={{ background: C.green, color: '#fff' }}
        >
          开始网络诊断
        </button>
      </div>
    </div>
  );
}
