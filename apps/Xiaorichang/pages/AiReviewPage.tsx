import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { todayKey } from '../utils/appTime';
import { scheduledHabits, todayProgress } from '../utils/metrics';

/** 今日智能复盘(s190)。AI 分析降级为本地统计渲染(wontfix:需 AI 后端)。 */
export default function AiReviewPage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const d = TimeService.getDate();
  const sched = scheduledHabits(st.habits, d, st.logs);
  const done = sched.filter((h) => st.logs.some((l) => l.habitId === h.id && l.date === todayKey() && l.status === 'done'));
  const { earned, total } = todayProgress(st.habits, st.logs, d);

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.statsAiReview} />
      <div className="px-4">
        <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-[#424242]">
          <div>今日安排 <b>{sched.length}</b> 个习惯,已完成 <b>{done.length}</b> 个。</div>
          <div className="mt-1">光芒值进度 <b>{earned}/{total}</b>。</div>
          {done.length > 0 && <div className="mt-1">完成:{done.map((h) => h.name).join('、')}</div>}
        </div>
        <button {...action('stats.aireview.ai.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3.5 text-left text-sm text-[#9AA5B1]">
          ✦ AI 智能分析(今日剩余 20/20 次)
        </button>
      </div>
    </div>
  );
}
