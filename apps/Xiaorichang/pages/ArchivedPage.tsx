import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IconRenderer } from '../res/icons';
import { PageHeader } from '../components/common';

/** 归档习惯(s216 印证:归档移出今日页,历史仍计入统计 Q12=A)。 */
export default function ArchivedPage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const archived = st.habits.filter((h) => h.archived);

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.archivedTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {archived.length === 0 ? (
          <div className="pt-24 text-center text-sm text-[#9AA5B1]">暂无归档习惯</div>
        ) : (
          archived.map((h) => (
            <div key={h.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl opacity-60" style={{ background: h.color, color: '#fff' }}>
                <IconRenderer name={h.icon} size={20} />
              </span>
              <span className="flex-1 text-sm text-[#9AA5B1]">{h.name}</span>
              <button
                {...action('habits.archived.restore', () => st.unarchiveHabit(h.id), { params: { habitId: h.id } })}
                className="rounded-full px-4 py-1.5 text-[13px] font-semibold text-[#5B4718]" style={{ background: colors.brand }}>
                {s.habitUnarchive}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
