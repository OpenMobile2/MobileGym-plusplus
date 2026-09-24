import React, { useEffect, useRef, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { IcNavBack, IcFootprints } from '../res/icons';

const DURATION_MS = 2000;

/** 计划生成加载页(约2秒自动进结果页)—— 节点 quiz.generating(证据 s048) */
export default function QuizGeneratingPage() {
  const { bindBack, go } = useKeepGestures();
  const s = useKeepStrings();
  const user = useKeepStore((st) => st.user);
  const quizGeneratePlan = useKeepStore((st) => st.quizGeneratePlan);
  const [progress, setProgress] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const startMs = TimeService.realNow();
    const timer = window.setInterval(() => {
      const ratio = Math.min(1, (TimeService.realNow() - startMs) / DURATION_MS);
      setProgress(ratio);
      if (ratio >= 1 && !doneRef.current) {
        doneRef.current = true;
        window.clearInterval(timer);
        quizGeneratePlan();
        go('plan.result.open');
      }
    }, 100);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      <div className="flex items-center px-3 h-12 shrink-0">
        <button {...bindBack()} className="p-1 bg-transparent border-none text-app-text" aria-label={s.back}>
          <IcNavBack size={22} />
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center pt-16 px-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[14px] text-app-text">Hi,{user.nickname}</div>
        <div className="text-[24px] font-bold text-app-text mt-2">正在为你生成计划</div>
        {/* 跑步插画(风格化) */}
        <div className="mt-12 w-full h-48 rounded-2xl flex items-end justify-center gap-6 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #EDFBF4 100%)' }}
        >
          {[36, 52, 44].map((h, i) => (
            <div key={i} className="flex flex-col items-center mb-8">
              <IcFootprints size={28} style={{ color: C.greenDeep }} />
              <span className="rounded-full" style={{ width: 26, height: 6, marginTop: h - 30, background: '#D6F2E4' }} />
            </div>
          ))}
        </div>
        <div className="text-[13px] text-app-text-muted mt-14">计算每日目标</div>
        <div className="w-4/5 h-1.5 rounded-full bg-gray-100 mt-4 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(progress * 100)}%`, background: C.green, transition: 'width 100ms linear' }}
          />
        </div>
      </div>
    </div>
  );
}
