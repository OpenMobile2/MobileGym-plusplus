import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';

export default function BookManagePage() {
  const s = useStrings();
  const { action, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const added = st.books.filter((b) => b.added);
  const current = st.books.find((b) => b.id === st.currentBookId)!;
  const others = added.filter((b) => b.id !== current.id);
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.planManage} close right={<button {...action('book.manage.save', () => { st.showToast('已保存'); back(); })} className="text-sm text-[#2F58E8]">{s.save}</button>} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 flex items-center justify-between"><span className="text-xs text-[#9AA5B1]">{s.currentPlan} (1/3)</span><span className="text-[10px] text-[#C9CDD3]">点击可移出,长按可拖动排序</span></div>
        <div className="mt-2 flex gap-3 rounded-2xl bg-white p-4">
          <div className="relative">
            <div className="flex h-24 items-center justify-center rounded text-xs text-white" style={{ width: 72, background: current.cover }}>{current.name}</div>
            <button {...action('book.manage.remove', () => st.showToast('当前词书不能移除，请先切换其他词书'), { params: { bookId: current.id } })} className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#9AA5B1] text-white">−</button>
          </div>
        </div>
        <div className="mt-5 text-xs text-[#9AA5B1]">{s.addedPlans}</div>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {others.map((b) => (
            <div key={b.id} className="relative">
              <div className="flex h-24 items-center justify-center rounded text-center text-[11px] text-white" style={{ background: b.cover }}>{b.name}</div>
              <button {...action('book.manage.add', () => { st.pickCurrentBook(b.id); st.showToast('已加入当前'); }, { params: { bookId: b.id } })} className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#2F58E8] text-white">＋</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
