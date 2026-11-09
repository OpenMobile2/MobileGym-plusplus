import React, { useEffect, useRef, useState } from 'react';
import { realNow } from '@/os/TimeService';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { IcFlame } from '../res/icons';

/** 语音陪跑全屏引导(5s 自动倒计时开跑)—— 证据 recB_f005 */

const TOTAL_MS = 5000;

export default function RunVoiceguidePage() {
  const { bindTap, go } = useKeepGestures();
  const s = useKeepStrings();
  const markVoiceguideSeen = useKeepStore((st) => st.markVoiceguideSeen);
  const [endMs] = useState(() => realNow() + TOTAL_MS);
  const [nowMs, setNowMs] = useState(() => realNow());
  const firedRef = useRef(false);

  useEffect(() => {
    markVoiceguideSeen();
  }, [markVoiceguideSeen]);

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(realNow()), 200);
    return () => window.clearInterval(t);
  }, []);

  const leftMs = Math.max(0, endMs - nowMs);
  const leftSec = Math.ceil(leftMs / 1000);
  const pct = 1 - leftMs / TOTAL_MS;

  useEffect(() => {
    if (leftMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      go('run.active.open.auto');
    }
  }, [leftMs, go]);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col overflow-hidden"
      style={{ background: '#101014' }}
      data-status-bar-foreground="light"
    >
      {/* 暗色跑步视频背景(风格化) */}
      <div
        className="absolute inset-0 opacity-60"
        style={{ background: 'linear-gradient(160deg, #3A3546 0%, #17151D 55%, #0C0B10 100%)' }}
      />
      <svg viewBox="0 0 360 780" className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice">
        <path d="M-20 520 C 80 430, 140 560, 240 470 S 380 420, 420 470" stroke="#6C6480" strokeWidth="60" fill="none" strokeLinecap="round" />
        <circle cx="250" cy="200" r="90" fill="#4A4458" />
        <path d="M60 700 L160 560 L220 640 L320 500" stroke="#524B63" strokeWidth="34" fill="none" strokeLinecap="round" />
      </svg>

      <div className="relative flex-1 flex flex-col px-8 pt-24">
        <div className="text-white text-[30px] font-bold leading-snug">
          专业指导
          <br />
          高效训练 <IcFlame size={28} className="inline" style={{ color: '#FF5A5F', verticalAlign: '-4px' }} />
        </div>
        <div className="text-[44px] font-extrabold mt-16 tracking-wide" style={{ color: 'rgba(255,255,255,.28)' }}>
          收获好身材
        </div>
      </div>

      <div className="relative shrink-0 flex flex-col items-center pb-12">
        <button
          {...bindTap('run.active.open')}
          className="h-12 px-10 rounded-full border-none text-white text-[16px] font-medium"
          style={{ background: 'rgba(255,255,255,.16)' }}
        >
          {s.freeTrialStart}
        </button>
        {/* 倒计时归零自动开跑(环形进度) */}
        <div {...bindTap('run.active.open.auto')} className="flex items-center gap-2 mt-5 text-white/80 text-[13px]">
          <svg width="18" height="18" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2.5" />
            <circle
              cx="10" cy="10" r="8" fill="none" stroke="#fff" strokeWidth="2.5"
              strokeDasharray={`${(pct * 50.3).toFixed(1)} 50.3`}
              strokeLinecap="round"
              transform="rotate(-90 10 10)"
            />
          </svg>
          {leftSec} 秒后自动开始跑步
        </div>
      </div>
    </div>
  );
}
