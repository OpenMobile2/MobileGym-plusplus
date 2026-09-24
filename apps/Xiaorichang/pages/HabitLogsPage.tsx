import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { MissingContent, PageHeader } from '../components/common';

/** 所有日志(P2,s223 仅入口)。纯展示,无交互(back 由 PageHeader 承担)。 */
export default function HabitLogsPage() {
  const [sp] = useSearchParams();
  const habitId = sp.get('habitId') ?? '';
  const st = useXiaorichangStore();
  const s = useStrings();
  const habit = st.habits.find((h) => h.id === habitId);
  const logs = st.logs.filter((l) => l.habitId === habitId).sort((a, b) => b.date.localeCompare(a.date));

  if (!habit) return <MissingContent />;

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={`${habit.name} · 所有日志`} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {logs.length === 0 ? (
          <div className="pt-24 text-center text-sm text-[#9AA5B1]">暂无日志</div>
        ) : (
          logs.map((l) => (
            <div key={l.date} className="mb-2 rounded-2xl bg-white px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <b className="text-[#424242]">{l.date}</b>
                <span style={{ color: l.status === 'done' ? '#7FB685' : l.status === 'failed' ? colors.stateFail : '#9AA5B1' }}>
                  {l.status === 'done' ? s.statusDone : l.status === 'failed' ? s.statusFailed : s.statusPending}
                </span>
              </div>
              {l.stamps.length > 0 && (
                <div className="mt-1 text-xs text-[#9AA5B1]">
                  {l.stamps.map((ts) => {
                    const d = TimeService.fromTimestamp(ts);
                    return `【${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}】`;
                  }).join(' ')}
                </div>
              )}
              {l.note && <div className="mt-1 text-xs text-[#6B7280]">{l.note}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
