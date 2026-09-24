import React from 'react';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { IcNavBack } from '../res/icons';

/** 天猫小黑盒二楼(spec: home.heybox,IMG_8696,P2 静态) */
export default function HeyboxPage() {
  const { bindBack } = useTaobaoGestures();
  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]" data-status-bar-foreground="light">
      <div className="flex items-center h-11 px-1 shrink-0">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer">
          <IcNavBack size={24} className="text-white" />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-white text-[13px] tracking-widest">📦 天猫小黑盒</div>
        <div className="text-white text-[34px] font-black mt-3">
          新品<span className="text-[#D8F000]">第1</span>现场
        </div>
        <div className="text-[#D8F000] text-[12px] mt-1 tracking-[0.3em]">NEW HOTSPOT</div>
        <div className="mt-10 w-28 h-28 bg-gradient-to-br from-[#D8F000] to-[#9BB000] rounded-xl rotate-12 flex items-center justify-center">
          <span className="text-black font-black text-[18px] -rotate-12">NEW</span>
        </div>
      </div>
    </div>
  );
}
