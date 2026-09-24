import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

/** 收集习惯小球(s189/s191)。Q9=A:每完成一次打卡掉一个球。纯展示页。 */
export default function GlowBallsPage() {
  const st = useXiaorichangStore();
  const s = useStrings();
  const d = TimeService.getDate();
  const prefix = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-`;
  const balls = st.logs.filter((l) => l.date.startsWith(prefix) && l.status === 'done')
    .map((l) => st.habits.find((h) => h.id === l.habitId))
    .filter(Boolean);

  return (
    <div className="flex h-full flex-col" style={{ background: colors.brandWash }} data-status-bar-foreground="dark">
      <PageHeader title={s.statsGlowBalls} />
      <div className="px-5 text-sm text-[#9AA5B1]">{d.getMonth() + 1} 月已收集 {balls.length} 个小球</div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-x-4 bottom-6 flex flex-wrap items-end justify-center gap-2">
          {balls.map((h, i) => (
            <span key={i} className="flex h-12 w-12 items-center justify-center rounded-full text-lg shadow"
              style={{ background: h!.color, color: '#fff' }}>
              {h!.name.slice(0, 1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
