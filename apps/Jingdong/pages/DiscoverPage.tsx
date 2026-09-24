import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { IcTabDiscover } from '../res/icons';

// 逛 — 底部第2 Tab 占位页(qa:Q13):内容 feed 暂未开放,提供返回首页入口。
export function DiscoverPage() {
  const { bindTap } = useJingdongGestures();
  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-8 pt-10">
        <div className="w-24 h-24 rounded-full bg-[#EFEFEF] flex items-center justify-center text-[#CCC]">
          <IcTabDiscover size={44} />
        </div>
        <div className="mt-5 text-[16px] font-semibold text-[#666]">逛一逛</div>
        <div className="mt-2 text-[13px] text-[#AAA]">该功能暂未开放</div>
        <button
          {...bindTap('discover.home-open')}
          className="mt-8 px-8 h-11 rounded-full bg-[#E1251B] text-white text-[15px] font-semibold"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
