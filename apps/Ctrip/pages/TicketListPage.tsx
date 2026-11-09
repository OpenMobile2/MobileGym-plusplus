import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, Price, BottomSheet, usePanel, EmptyState } from '../components/ui';
import { TICKET_TABS } from '../constants';

/** 景点门票列表：按 city / tab / 主题筛选。 */
export default function TicketListPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const city = (sp.get('city') || '').trim();
  const attractions = useCtripStore((st) => st.attractions);
  const [tab, setTab] = React.useState('featured');
  const [theme, setTheme] = React.useState<string | null>(null);
  const [sort, setSort] = React.useState('综合');

  const list = React.useMemo(() => {
    let arr = attractions.filter((a) => !city || a.city === city || (!a.city && city === '上海'));
    if (tab === 'tickets') arr = arr.filter((a) => a.ticketTypes.length > 0);
    if (tab === 'fun') arr = arr.filter((a) => a.tags.some((t) => /体验|玩乐|网红/.test(t)) || a.hot >= 8);
    if (theme) arr = arr.filter((a) => a.tags.some((t) => t.includes(theme)) || a.name.includes(theme) || a.intro.includes(theme));
    arr = [...arr];
    if (sort === s.t('好评')) arr.sort((a, b) => b.score - a.score);
    else if (sort === s.t('销量')) arr.sort((a, b) => b.hot - a.hot);
    else if (sort === s.t('低价')) arr.sort((a, b) => (a.ticketTypes[0]?.price ?? 0) - (b.ticketTypes[0]?.price ?? 0));
    return arr;
  }, [attractions, city, tab, theme, sort, s]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={city ? `${city} · ${s.t('景点·门票')}` : s.t('景点·门票')} />
      <div className="shrink-0 bg-white flex overflow-x-auto border-b border-[#F0F0F0]">
        {TICKET_TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'ticketList.tab.select.tickets' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
            className={`shrink-0 px-4 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
          >{s.t(t.label)}</button>
        ))}
      </div>

      <div className="shrink-0 bg-white flex text-[13px] text-[#333333] border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { onTrigger: () => open('filter') })} className={`flex-1 py-2 bg-transparent border-none cursor-pointer ${theme || sort !== '综合' ? 'text-[#0086F6]' : ''}`}>综合排序 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">出游日期 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">筛选 ▾</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={city ? `${city}暂无景点` : s.t('暂无景点')} hint={s.t('可切换上海等城市重试')} />
        ) : list.map((a) => (
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
        <BottomSheet title={s.t('排序/筛选')} onClose={close}>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('排序')}</div>
              <div className="flex flex-wrap gap-2">
                {[s.t('综合'), s.t('好评'), s.t('销量'), s.t('低价')].map((o) => (
                  <button key={o} {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { params: { sort: o }, onTrigger: () => setSort(o) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${sort === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('主题')}</div>
              <div className="flex flex-wrap gap-2">
                {[s.t('亲子'), s.t('网红'), s.t('自然'), s.t('文化')].map((o) => (
                  <button key={o} {...bindTap({ kind: 'action', id: 'ticketList.filter.open' }, { params: { theme: o }, onTrigger: () => setTheme((x) => (x === o ? null : o)) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${theme === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{o}</button>
                ))}
              </div>
            </div>
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
