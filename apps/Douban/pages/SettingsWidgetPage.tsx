// 节点: settings.widget —— 豆瓣App小组件(evidence IMG_0302,静态样式页)。
// 桌面小组件预览(未获得态)+ 小豆兑换说明 + 「用小豆兑换」按钮 → wontfix。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';

export default function SettingsWidgetPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);

  const previewTap = bindTap(
    { kind: 'action', id: 'settings.widget.preview.wontfix' },
    { onTrigger: () => toast('该功能暂未开放') },
  );

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="豆瓣App小组件" borderless />
      <div className="flex-1 overflow-y-auto px-4 pt-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 小组件预览(未获得,灰化) */}
        <div
          {...previewTap}
          className="rounded-2xl p-5 flex flex-col gap-3 cursor-pointer"
          style={{ background: '#EBEDF0' }}
          role="button"
          tabIndex={0}
        >
          <div className="text-xs" style={{ color: C.sub }}>豆瓣 · 今日</div>
          <div className="bg-white/70 rounded-xl p-3">
            <div className="text-[15px] font-semibold" style={{ color: C.text }}>豆瓣时间 · 每日一书</div>
            <div className="mt-1 text-xs" style={{ color: C.sub }}>《S.忒修斯之船》</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/70 rounded-xl h-16" />
            <div className="bg-white/70 rounded-xl h-16" />
          </div>
        </div>

        <div className="mt-5 text-[15px] font-semibold" style={{ color: C.text }}>桌面小组件</div>
        <p className="mt-2 text-sm leading-6" style={{ color: C.sub }}>
          将豆瓣小组件添加到手机桌面,随时查看每日推荐、想看清单与豆瓣时间更新。
          该小组件为限量装扮,需使用小豆兑换后解锁。
        </p>

        <div className="mt-6 flex items-center justify-between bg-white rounded-xl px-4 py-3">
          <span className="text-sm" style={{ color: C.text }}>兑换价格</span>
          <span className="text-[15px] font-semibold" style={{ color: C.gold }}>200 小豆</span>
        </div>

        <button
          {...bindTap(
            { kind: 'action', id: 'settings.widget.redeem.wontfix' },
            { onTrigger: () => toast('该功能暂未开放') },
          )}
          className="w-full h-12 rounded-full border-none cursor-pointer text-[16px] font-medium mt-6 mb-10"
          style={{ background: C.green, color: '#fff' }}
        >
          用小豆兑换
        </button>
      </div>
    </div>
  );
}
