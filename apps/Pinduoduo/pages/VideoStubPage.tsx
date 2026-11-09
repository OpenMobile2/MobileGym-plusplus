import React from 'react';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { IcTabVideo } from '../res/icons';

export function VideoStubPage() {
  const s = usePinduoduoStrings();
  return (
    <div className="h-full flex flex-col pt-10 overflow-hidden bg-white" data-status-bar-foreground="dark">
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8">
        <div className="w-24 h-24 rounded-2xl bg-[#FFF0E8] flex items-center justify-center">
          <IcTabVideo size={44} className="text-[#E22E1F]" />
        </div>
        <div className="text-[16px] font-medium text-[#333]">{s.tab_video}</div>
        <div className="text-[13px] text-[#999]">{s.feature_unavailable}</div>
      </div>
    </div>
  );
}
