// 我的背包(bag.mine,IMG_0230/0220,frame:800dd2@t0026):小豆余额区 + 礼物背包空态 + 小豆说明。
// 轻静态页;小豆体系不做,明细/兑换入口 → toast「该功能暂未开放」。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, C } from '../components/ui';

export default function BagMinePage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const beans = useDoubanStore((s) => s.currentUser.beans) ?? 0;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="我的背包" />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 小豆余额区 */}
        <div className="mx-3 mt-3 rounded-2xl px-5 py-6 flex items-center justify-between" style={{ background: 'linear-gradient(120deg,#8BC34A,#5FA82F)' }}>
          <div>
            <div className="text-xs text-white/80">我的小豆</div>
            <div className="mt-1 flex items-end gap-1">
              <span className="text-4xl font-bold text-white leading-none">{beans}</span>
              <span className="w-5 h-5 mb-1 rounded-full inline-flex items-center justify-center text-[11px] text-white" style={{ background: 'rgba(255,255,255,0.3)' }}>豆</span>
            </div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'bag.beans.detail.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="px-4 h-8 rounded-full text-sm border-none cursor-pointer bg-white"
            style={{ color: '#5FA82F' }}
          >
            明细
          </button>
        </div>

        {/* 礼物背包空态 */}
        <div className="mx-3 mt-3 rounded-2xl bg-white flex flex-col items-center justify-center py-14">
          <svg width="76" height="64" viewBox="0 0 88 72" fill="none">
            <g stroke={C.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="26" y="30" width="36" height="30" rx="2" fill="none" />
              <path d="M26 40 h36 M44 30 v30" />
              <path d="M44 30 Q34 26 36 18 Q42 16 44 28 Q46 16 52 18 Q54 26 44 30 Z" fill="none" />
            </g>
          </svg>
          <div className="mt-3 text-sm" style={{ color: C.sub }}>背包空空的,先去礼品店逛逛吧</div>
        </div>

        {/* 小豆获取/兑换说明 */}
        <div className="mx-3 mt-3 rounded-2xl bg-white px-4 py-3">
          <button
            {...bindTap({ kind: 'action', id: 'bag.exchange.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-full flex items-center justify-between py-2 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="text-[15px]" style={{ color: C.text }}>兑换商城</span>
            <span style={{ color: C.sub }}>›</span>
          </button>
          <div className="h-px my-1" style={{ background: C.border }} />
          <div className="py-2 text-xs leading-relaxed" style={{ color: C.sub }}>
            小豆可用于购买礼物送给好友。参与豆瓣社区互动、完成任务即可获得小豆。
          </div>
        </div>
      </div>
    </div>
  );
}
