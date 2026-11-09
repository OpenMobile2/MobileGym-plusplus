import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

export default function BookAdjustPage() {
  const s = useStrings();
  const { bindTap, action, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const book = st.books.find((b) => b.id === st.currentBookId)!;
  const g = st.dailyGroups;
  const learned = Object.values(st.learn).filter((l) => l.status !== 'new').length;
  const mastered = Object.values(st.learn).filter((l) => l.status === 'known').length;
  // 组数越多 → 每日词量越大 → 完成天数越少
  const daysFor = (groups: number) => Math.max(1, Math.ceil((book.total - learned) / (groups * 10)));
  const completionDate = (groups: number) => {
    const date = TimeService.fromTimestamp(TimeService.now() + daysFor(groups) * 24 * 60 * 60 * 1000);
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
  };
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.adjustPlan} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 flex items-center rounded-2xl bg-white p-4">
          <div className="flex h-14 w-11 items-center justify-center rounded text-[10px] text-white" style={{ background: book.cover }}>{book.name}</div>
          <div className="ml-3 flex-1">
            <div className="text-sm font-semibold text-[#212121]">{book.name}</div>
            <div className="text-xs text-[#9AA5B1]">每日 {g * 10} 词,剩余 {Math.ceil((book.total - learned) / (g * 10))} 天</div>
            <div className="mt-1 text-xs text-[#9AA5B1]">已掌握 {mastered} · 已学 {learned}</div>
          </div>
          <button {...bindTap('book.adjust.words.open')} className="text-xs text-[#9AA5B1]">{book.total}词 ›</button>
        </div>
        <div className="mt-2 flex justify-between px-1 text-xs text-[#9AA5B1]">
          <span>预计完成时间:<b className="text-[#2F58E8]">{completionDate(g)}</b></span>
          <button {...action('book.adjust.reset', () => { st.setDailyGroups(10); st.showToast('已重置'); })} className="text-[#9AA5B1]">↻ 重置</button>
        </div>
        <div className="mt-1 px-1 text-xs text-[#9AA5B1]">预计每日用时:{g * 4} 分钟</div>

        <div className="mt-4 rounded-2xl bg-white p-2">
          <div className="flex px-3 py-2 text-xs text-[#9AA5B1]"><span className="flex-1">每日组数(每组10词)</span><span>完成天数</span></div>
          {[
            { n: 8, bind: action('book.adjust.groups.select.g8', () => st.setDailyGroups(8)) },
            { n: 9, bind: action('book.adjust.groups.select.g9', () => st.setDailyGroups(9)) },
            { n: 10, bind: action('book.adjust.groups.select.g10', () => st.setDailyGroups(10)) },
            { n: 11, bind: action('book.adjust.groups.select.g11', () => st.setDailyGroups(11)) },
            { n: 12, bind: action('book.adjust.groups.select.g12', () => st.setDailyGroups(12)) },
          ].map(({ n, bind }) => {
            const on = n === g;
            return (
              <button key={n} {...bind}
                className="flex w-full items-center rounded-xl px-3 py-3"
                style={{ background: on ? '#EAF0FF' : 'transparent' }}>
                <span className="flex-1 text-left text-sm" style={{ color: on ? colors.primary : '#9AA5B1', fontWeight: on ? 700 : 400 }}>{n} 组</span>
                <span className="text-sm" style={{ color: on ? colors.primary : '#C9CDD3' }}>{daysFor(n)} 天</span>
                {on && <span className="ml-2 text-[#2F58E8]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-white p-3">
        <button {...action('book.adjust.save', () => { st.showToast('计划已保存'); back(); })}
          className="w-full rounded-full py-3.5 text-sm font-semibold text-white" style={{ background: colors.primarySoft }}>{s.savePlan}</button>
      </div>
    </div>
  );
}
