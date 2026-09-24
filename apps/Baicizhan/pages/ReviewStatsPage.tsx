import React from 'react';
import { useBaicizhanStore } from '../state';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

export default function ReviewStatsPage() {
  const s = useStrings();
  const st = useBaicizhanStore();
  const book = st.books.find((b) => b.id === st.currentBookId)!;
  const plan = [7, 0, 0, 0, 0, 0, 0, 0, 1, 0];
  const labels = ['今天', '明天', '后天', '3日后', '4日后', '5日后', '6日后', '7日后', '9日后', '10日后'];
  return (
    <div className="flex h-full flex-col bg-[#F3F6FB]" data-status-bar-foreground="dark">
      <PageHeader title={`复习统计_${book.name}`} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
          <div className="text-3xl">📟</div>
          <div className="text-sm text-[#5B6B85]">今日复习任务已光速清空。下次复习将根据艾宾浩斯曲线重新部署,记得再来!</div>
        </div>
        <div className="mt-4 text-sm font-bold text-[#33405C]">复习计划</div>
        <div className="mt-3 flex h-40 items-end justify-between gap-1 rounded-2xl bg-white p-3">
          {plan.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="w-3 rounded-t" style={{ height: `${v * 16 + 2}px`, background: i === 0 ? colors.primary : '#9BC0F0' }} />
              <span className="text-[8px] text-[#9AA5B1]">{labels[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm font-bold text-[#33405C]">复习成果</div>
        <div className="mt-3 h-32 rounded-2xl bg-white p-3">
          <svg viewBox="0 0 300 100" className="h-full w-full"><polygon points="0,90 300,30 300,100 0,100" fill="#E6B0AE" opacity="0.6" /><polyline points="0,90 300,30" fill="none" stroke="#D9534F" strokeWidth="2" /></svg>
        </div>
      </div>
    </div>
  );
}
