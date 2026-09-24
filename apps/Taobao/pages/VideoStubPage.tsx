import React from 'react';

/** 视频 Tab 静态占位(spec: video.stub,wontfix:视频流) */
export default function VideoStubPage() {
  return (
    <div className="flex flex-col h-full bg-[#111111] items-center justify-center" data-status-bar-foreground="light">
      <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center text-white/60 text-[24px]">▶</div>
      <div className="text-white/60 text-[14px] mt-4">视频内容暂不可用</div>
      <div className="text-white/30 text-[12px] mt-1">该功能在仿真环境中未开放</div>
    </div>
  );
}
