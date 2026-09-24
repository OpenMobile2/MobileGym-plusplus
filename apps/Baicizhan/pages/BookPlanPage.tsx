import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { LearningCover, PageHeader } from '../components/common';

export default function BookPlanPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const added = st.books.filter((b) => b.added);
  const current = st.books.find((b) => b.id === st.currentBookId)!;
  const others = added.filter((b) => b.id !== current.id);
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.myPlan} right={<button {...bindTap('book.plan.manage')} className="text-sm text-[#2F58E8]">{s.manage}</button>} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 text-xs text-[#9AA5B1]">{s.currentPlan} (1/3)</div>
        <div className="mt-2 flex gap-3 rounded-2xl bg-white p-4">
          <button {...bindTap('book.plan.current', { params: { bookId: current.id } })} className="flex flex-col items-center">
            <LearningCover id={current.id} title={current.name} icon="Aa" className="h-24 w-[72px] rounded" />
            <span className="mt-1 text-xs text-[#33405C]">{current.name}</span>
          </button>
          <button {...bindTap('book.plan.addslot')} className="flex h-24 w-18 items-center justify-center rounded-xl border-2 border-dashed border-[#DCDFE5] text-2xl text-[#C9CDD3]" style={{ width: 72 }}>＋</button>
        </div>

        <div className="mt-5 text-xs text-[#9AA5B1]">{s.addedPlans}</div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {others.map((b) => (
            <button key={b.id} {...action('book.plan.pick', () => { st.pickCurrentBook(b.id); st.showToast('已切换为当前计划'); }, { params: { bookId: b.id } })}
              className="flex flex-col items-center">
              <LearningCover id={b.id} title={b.name} icon="Aa" className="h-24 w-full rounded" />
              <span className="mt-1 text-[11px] text-[#5B6B85]">{b.name}</span>
            </button>
          ))}
        </div>

        <button {...bindTap('book.plan.store.open')} className="mt-6 w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: '#2F58E8' }}>{s.viewMorePlans}</button>
      </div>
    </div>
  );
}
