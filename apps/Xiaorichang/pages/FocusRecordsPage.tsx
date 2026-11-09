import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IconRenderer } from '../res/icons';
import { MissingContent, PageHeader } from '../components/common';
import { toDateKey } from '../utils/appTime';

/** 专注记录(A2 缺口:整页布局 inferred,阶段⑥ 走查重点)。 */
export default function FocusRecordsPage() {
  const [sp] = useSearchParams();
  const st = useXiaorichangStore();
  const s = useStrings();
  const habitId = sp.get('habitId');
  const habit = habitId ? st.habits.find((h) => h.id === habitId) : undefined;
  const records = st.records
    .filter((r) => !habitId || r.habitId === habitId)
    .sort((a, b) => b.startTs - a.startTs);
  const groups = records.reduce<Record<string, typeof records>>((acc, r) => {
    const k = toDateKey(TimeService.fromTimestamp(r.startTs));
    (acc[k] = acc[k] ?? []).push(r);
    return acc;
  }, {});

  if (habitId && !habit) return <MissingContent />;

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={habit ? `${habit.name} · ${s.focusRecords}` : s.focusRecords} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {Object.keys(groups).length === 0 ? (
          <div className="pt-24 text-center text-sm text-[#9AA5B1]">暂无专注记录</div>
        ) : Object.entries(groups).map(([date, list]) => (
          <div key={date}>
            <div className="py-2 text-xs font-semibold text-[#9AA5B1]">
              {date} · 共 {list.reduce((a, r) => a + r.minutes, 0)} 分钟
            </div>
            {list.map((r) => {
              const habit = st.habits.find((h) => h.id === r.habitId);
              const d = TimeService.fromTimestamp(r.startTs);
              return (
                <div key={r.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: habit?.color ?? colors.focusStop, color: '#fff' }}>
                    {habit ? <IconRenderer name={habit.icon} size={18} /> : '🍅'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[#424242]">{habit?.name ?? r.note ?? '专注'}</span>
                    <span className="text-xs text-[#9AA5B1]">
                      {`${d.getHours()}`.padStart(2, '0')}:{`${d.getMinutes()}`.padStart(2, '0')} 开始
                    </span>
                  </span>
                  <b className="text-sm text-[#424242]">{r.minutes}m</b>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
