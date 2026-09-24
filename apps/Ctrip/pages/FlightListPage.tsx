import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, BottomSheet, usePanel } from '../components/ui';

/** 航班列表(spec flight.list)。航班卡→detail(Q11);筛选/排序;低价提醒→priceAlert(Q12)。 */
const SORTS = [{ id: 'recommend', label: '推荐排序' }, { id: 'direct', label: '直飞优先' }, { id: 'time', label: '出发时间' }, { id: 'price', label: '价格最低' }];

export default function FlightListPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const flights = useCtripStore((s) => s.flights);
  const [sort, setSort] = React.useState('recommend');
  const [searchParams] = useSearchParams();
  const selectedDate = searchParams.get('date') ?? '07-05';

  const list = React.useMemo(() => {
    const arr = [...flights];
    if (sort === 'price') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'direct') arr.sort((a, b) => (a.transfer ? 1 : 0) - (b.transfer ? 1 : 0));
    return arr;
  }, [flights, sort]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={<span className="text-[15px]">上海 → 潍坊 · {selectedDate}</span>}
        rightContent={<button {...bindTap('flightList.toAlert')} className="text-[#0086F6] text-[12px] bg-transparent border-none cursor-pointer">低价提醒</button>}
      />

      {/* 价格日历条 */}
      <div className="shrink-0 bg-white flex overflow-x-auto border-b border-[#F0F0F0]">
        {(() => {
          const selDay = parseInt(selectedDate.split('-')[1] ?? '5', 10);
          return [-2, -1, 0, 1, 2].map((offset) => {
            const d = selDay + offset;
            if (d < 1 || d > 31) return null;
            const label = `07-${String(d).padStart(2, '0')}`;
            const price = 480 + ((d * 37) % 520);
            const isSelected = offset === 0;
            return (
              <div key={label} className={`flex-1 min-w-[64px] text-center py-2 ${isSelected ? 'bg-[#EAF4FF]' : ''}`}>
                <div className={`text-[12px] ${isSelected ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}>{label}</div>
                <div className="text-[11px] text-[#FF6A2C]">¥{price}</div>
              </div>
            );
          }).filter(Boolean);
        })()}
      </div>

      <div className="flex-1 overflow-y-auto pb-14" data-scroll-container="main" data-scroll-direction="vertical">
        {list.map((f) => (
          <div key={f.id} {...bindTap('flightList.toDetail', { params: { no: f.id } })} className="bg-white mx-2 mt-2 rounded-xl p-3 cursor-pointer">
            <div className="flex items-center">
              <div className="text-center"><div className="text-[20px] font-bold">{f.depart}</div><div className="text-[11px] text-[#999999]">{f.fromAirport}</div></div>
              <div className="flex-1 text-center px-2">
                <div className="text-[11px] text-[#999999]">{f.transfer ? `中转${f.transfer}` : '直飞'}</div>
                <div className="text-[11px] text-[#999999] border-t border-[#E5E5E5] mt-1 pt-1">{f.duration}</div>
              </div>
              <div className="text-center"><div className="text-[20px] font-bold">{f.arrive}</div><div className="text-[11px] text-[#999999]">{f.toAirport}</div></div>
              <div className="text-right ml-3"><Price value={f.price} size="m" /><div className="text-[11px] text-[#999999]">起</div></div>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#F5F5F5] text-[11px] text-[#666666]">
              <span>{f.airline} {f.flightNo}</span><span>{f.cabin}</span>
              {f.petFriendly && <span className="text-[#38A169]">可托运宠物</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex text-[13px] text-[#333333]">
        <button {...bindTap({ kind: 'action', id: 'flightList.sort.select.recommend' }, { onTrigger: () => open('sort') })} className="flex-1 py-3 bg-transparent border-none cursor-pointer">{SORTS.find((s) => s.id === sort)?.label} ▾</button>
        <button {...bindTap({ kind: 'action', id: 'flightList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-3 bg-transparent border-none cursor-pointer">筛选 ▾</button>
      </div>

      {panel === 'sort' && (
        <BottomSheet title="排序" onClose={close}>
          {SORTS.map((s) => (
            <button key={s.id} onClick={() => { setSort(s.id); close(); }} className={`w-full text-left px-5 py-3 bg-transparent border-none cursor-pointer text-[14px] ${sort === s.id ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}>{s.label}</button>
          ))}
        </BottomSheet>
      )}
      {panel === 'filter' && (
        <BottomSheet title="筛选" onClose={close}>
          <div className="p-4 space-y-3">
            {[['航段', ['直飞', '中转']], ['行李', ['含托运', '仅手提']], ['时段', ['上午', '下午', '晚上']], ['机场', ['浦东', '虹桥']]].map(([g, opts]) => (
              <div key={g as string}>
                <div className="text-[13px] text-[#999999] mb-2">{g}</div>
                <div className="flex flex-wrap gap-2">{(opts as string[]).map((o) => <span key={o} className="text-[13px] bg-[#F2F4F7] rounded px-3 py-1.5">{o}</span>)}</div>
              </div>
            ))}
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
