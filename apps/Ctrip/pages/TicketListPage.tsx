import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, BottomSheet, usePanel } from '../components/ui';
import { TICKET_TABS } from '../constants';

/** 景点门票列表(spec ticket.list)。分类tab/排序筛选/景点卡→detail(Q13)。 */
export default function TicketListPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const attractions = useCtripStore((s) => s.attractions);
  const [tab, setTab] = React.useState('featured');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="景点·门票" />
      <div className="shrink-0 bg-white flex overflow-x-auto border-b border-[#F0F0F0]">
        {TICKET_TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'ticketList.tab.select.tickets' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
            className={`shrink-0 px-4 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
          >{t.label}</button>
        ))}
      </div>

      {/* 排序/筛选 */}
      <div className="shrink-0 bg-white flex text-[13px] text-[#333333] border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">综合排序 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">出游日期 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">筛选 ▾</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {attractions.map((a) => (
          <div key={a.id} {...bindTap('ticketList.toDetail', { params: { id: a.id } })} className="bg-white mx-2 mt-2 rounded-xl overflow-hidden flex cursor-pointer">
            <Img src={a.image} className="w-28 h-32 object-cover shrink-0" />
            <div className="flex-1 min-w-0 p-2.5 flex flex-col">
              <div className="text-[14px] font-semibold line-clamp-2">{a.name}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[12px] text-[#0086F6] font-semibold">{a.score}</span>
                <span className="text-[11px] text-[#999999]">{a.reviewCount}</span>
                <span className="text-[11px] text-[#FF6A2C]">热 {a.hot}</span>
              </div>
              <div className="text-[11px] text-[#999999] mt-0.5">{a.district} · {a.distance}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {a.tags.slice(0, 2).map((t) => <span key={t} className="text-[10px] text-[#0086F6] bg-[#EAF4FF] rounded px-1 py-0.5">{t}</span>)}
              </div>
              <div className="mt-auto pt-1 text-right"><Price value={a.ticketTypes[0]?.price ?? 0} size="m" /><span className="text-[11px] text-[#999999]"> 起</span></div>
            </div>
          </div>
        ))}
      </div>

      {panel === 'filter' && (
        <BottomSheet title="排序/筛选" onClose={close}>
          <div className="p-4 space-y-3">
            {[['排序', ['综合', '好评', '销量', '低价']], ['主题', ['亲子', '网红', '自然', '文化']], ['特色', ['随买随用', '可订今日', '免预约']]].map(([g, opts]) => (
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
