import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, BottomSheet, usePanel, useToast } from '../components/ui';
import { WONTFIX_TOAST, TRAIN_TABS } from '../constants';

/** 车次列表(spec train.list)。日期条/tab/车次卡→detail;高级筛选/排序;抢票wontfix(Q10)。 */
const SORTS = [{ id: 'earliest', label: '出发最早' }, { id: 'fastest', label: '耗时最短' }, { id: 'cheapest', label: '价格最低' }];

export default function TrainListPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const trains = useCtripStore((s) => s.trains);
  const [tab, setTab] = React.useState('recommend');
  const [sort, setSort] = React.useState('earliest');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={<span className="text-[15px]">上海 → 潍坊</span>} />

      {/* 日期条 */}
      <div className="shrink-0 bg-white flex items-center px-2 py-2 border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'trainList.date.open' }, { onTrigger: () => open('date') })} className="flex items-center gap-1 text-[14px] text-[#333333] bg-transparent border-none cursor-pointer">
          07-05 周六 ▾
        </button>
        <div className="flex-1" />
        <button {...bindTap({ kind: 'action', id: 'trainList.grab.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="text-[12px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-3 py-1 border-none cursor-pointer">抢票</button>
      </div>

      {/* tab */}
      <div className="shrink-0 bg-white flex px-2 border-b border-[#F0F0F0]">
        {TRAIN_TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 text-[13px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-14" data-scroll-container="main" data-scroll-direction="vertical">
        {trains.map((t) => {
          const minPrice = Math.min(...t.seats.map((s) => s.price));
          return (
            <div key={t.id} {...bindTap('trainList.toDetail', { params: { no: t.id } })} className="bg-white mx-2 mt-2 rounded-xl p-3 cursor-pointer">
              <div className="flex items-center">
                <div className="text-center">
                  <div className="text-[20px] font-bold">{t.depart}</div>
                  <div className="text-[11px] text-[#999999]">{t.from}</div>
                </div>
                <div className="flex-1 text-center px-2">
                  <div className="text-[11px] text-[#999999]">{t.duration}</div>
                  <div className="text-[11px] text-[#0086F6] border-t border-[#E5E5E5] mt-1 pt-1">{t.trainNo} {t.type}</div>
                </div>
                <div className="text-center">
                  <div className="text-[20px] font-bold">{t.arrive}</div>
                  <div className="text-[11px] text-[#999999]">{t.to}</div>
                </div>
                <div className="text-right ml-3">
                  <Price value={minPrice} size="m" />
                  <div className="text-[11px] text-[#999999]">起</div>
                </div>
              </div>
              <div className="flex gap-2 mt-2 pt-2 border-t border-[#F5F5F5]">
                {t.seats.slice(0, 3).map((s) => (
                  <span key={s.name} className="text-[11px] text-[#666666]">{s.name} <span className={s.status === '有票' ? 'text-[#38A169]' : 'text-[#FF6A2C]'}>{s.status}</span></span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部筛选/排序 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex text-[13px] text-[#333333]">
        <button {...bindTap({ kind: 'action', id: 'trainList.sort.select.earliest' }, { onTrigger: () => open('sort') })} className="flex-1 py-3 bg-transparent border-none cursor-pointer">{SORTS.find((s) => s.id === sort)?.label} ▾</button>
        <button {...bindTap({ kind: 'action', id: 'trainList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-3 bg-transparent border-none cursor-pointer">高级筛选 ▾</button>
      </div>

      {panel === 'sort' && (
        <BottomSheet title="排序" onClose={close}>
          {SORTS.map((s) => (
            <button key={s.id} onClick={() => { setSort(s.id); close(); }} className={`w-full text-left px-5 py-3 bg-transparent border-none cursor-pointer text-[14px] ${sort === s.id ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}>{s.label}</button>
          ))}
        </BottomSheet>
      )}
      {panel === 'filter' && (
        <BottomSheet title="高级筛选" onClose={close}>
          <div className="p-4 space-y-3">
            {[['车次类型', ['GC-高铁', 'D-动车', 'Z/T/K-普速']], ['出发时段', ['00-06', '06-12', '12-18', '18-24']], ['席别', ['商务座', '一等座', '二等座', '无座']]].map(([g, opts]) => (
              <div key={g as string}>
                <div className="text-[13px] text-[#999999] mb-2">{g}</div>
                <div className="flex flex-wrap gap-2">{(opts as string[]).map((o) => <span key={o} className="text-[13px] bg-[#F2F4F7] rounded px-3 py-1.5">{o}</span>)}</div>
              </div>
            ))}
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
      {panel === 'date' && (
        <BottomSheet title="选择日期" onClose={close}>
          <div className="p-4 grid grid-cols-7 gap-1 text-center text-[13px]">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <button key={d} onClick={close} className={`py-2 rounded border-none cursor-pointer ${d === 5 ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA] text-[#333333]'}`}>{d}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
