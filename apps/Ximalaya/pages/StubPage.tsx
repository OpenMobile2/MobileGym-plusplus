import React from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar } from '../components/ui';
import { IcSparkles } from '../res/icons';

export function StubPage() {
  const { bindBack } = useXimalayaGestures();
  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="" />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center" data-scroll-container data-scroll-direction="vertical">
        <div className="w-24 h-24 rounded-full bg-[#EDEDED] flex items-center justify-center text-[#C4C4C4]">
          <IcSparkles size={48} />
        </div>
        <div className="text-[15px] text-[#999] mt-5">该功能暂未开放</div>
        <button {...bindBack()} className="mt-6 h-10 px-8 rounded-full bg-[#FE4543] text-white text-[14px] font-medium">
          返回
        </button>
      </div>
    </div>
  );
}
