import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, useToast, Img } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 行程 Tab(spec trip.main)。规划wontfix;同步行程→trip.sync;攻略wontfix;展示已订行程。 */
export default function TripMainPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const orders = useCtripStore((s) => s.orders);
  const upcoming = orders.filter((o) => o.status === 'upcoming');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title="行程"
        showBack={false}
        rightContent={<button {...bindTap('trip.toSync')} className="text-[#0086F6] text-[13px] bg-transparent border-none cursor-pointer">+ 添加</button>}
      />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 线路规划卡 */}
        <button {...bindTap({ kind: 'action', id: 'trip.plan.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="mx-2 mt-2 w-[calc(100%-1rem)] rounded-xl overflow-hidden border-none cursor-pointer p-0 text-left relative h-28 bg-gradient-to-br from-[#6D5BFF] to-[#33A5FF] flex flex-col justify-center px-4">
          <span className="text-white text-[16px] font-semibold">智能线路规划</span>
          <span className="text-white/85 text-[12px] mt-1">告诉我目的地和天数,一键生成行程</span>
          <span className="mt-2 text-[12px] text-[#6D5BFF] bg-white rounded-full px-3 py-1 w-fit">开始规划</span>
        </button>

        {/* 我的行程 */}
        <div className="mx-2 mt-3">
          <div className="text-[16px] font-semibold text-[#111111] mb-2">我的行程</div>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl py-10 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CFE6FF] to-[#7FB6F0] opacity-60" />
              <div className="text-[14px] text-[#666666]">暂无行程</div>
              <button {...bindTap('trip.toSync')} className="text-[13px] text-white bg-[#0086F6] rounded-full px-4 py-1.5 border-none cursor-pointer mt-1">同步行程</button>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((o) => (
                <div key={o.id} className="bg-white rounded-xl p-3 flex gap-3">
                  {o.image ? <Img src={o.image} className="w-16 h-16 rounded-lg object-cover shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-[#EAF4FF] flex items-center justify-center text-[#0086F6] text-[12px] shrink-0">{o.statusText}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold line-clamp-1">{o.title}</div>
                    <div className="text-[12px] text-[#999999] mt-1">{o.subtitle}</div>
                    <div className="text-[11px] text-[#38A169] mt-1">{o.statusText}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 攻略流 */}
        <div className="mx-2 mt-3">
          <div className="text-[16px] font-semibold text-[#111111] mb-2">旅行灵感</div>
          <div className="grid grid-cols-2 gap-2">
            {['周末去哪玩', '亲子游攻略', '小众目的地', '美食地图'].map((g) => (
              <button key={g} {...bindTap({ kind: 'action', id: 'trip.guide.wontfix' }, { params: { g }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="bg-white rounded-xl py-6 text-[14px] text-[#333333] border-none cursor-pointer">{g}</button>
            ))}
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}
