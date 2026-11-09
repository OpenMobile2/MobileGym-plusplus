import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Price, BottomSheet, usePanel, useToast, EmptyState } from '../components/ui';
import { WONTFIX_TOAST, TRAIN_TABS } from '../constants';
import { routeStationMatches } from '../utils/searchCity';
import { daysInMonth, startOfSystemDay, systemMonthDay } from '../utils/travelDate';

/** 车次列表：按 URL from/to 过滤；日期/排序/车型筛选可点。 */
export default function TrainListPage() {
  const s = useCtripStrings();
  const SORTS = [{ id: 'earliest', label: s.t('出发最早') }, { id: 'fastest', label: s.t('耗时最短') }, { id: 'cheapest', label: s.t('价格最低') }];
  const { bindTap, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const [sp] = useSearchParams();
  const from = sp.get('from') || '上海';
  const to = sp.get('to') || '潍坊';
  const [date, setDate] = React.useState(sp.get('date') || systemMonthDay());
  const trains = useCtripStore((st) => st.trains);
  const [tab, setTab] = React.useState('recommend');
  const [sort, setSort] = React.useState('earliest');
  const [trainType, setTrainType] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (sp.get('date')) setDate(sp.get('date')!);
  }, [sp]);

  const list = React.useMemo(() => {
    let arr = trains.filter((t) => routeStationMatches(t.from, from) && routeStationMatches(t.to, to));
    if (tab === 'direct') arr = arr.filter((t) => /直达|G|D|C/.test(t.type + t.trainNo));
    if (tab === 'transfer') arr = arr.filter((t) => /中转/.test(t.type));
    if (trainType === s.t('GC-高铁')) arr = arr.filter((t) => /G|C|高铁|复兴/.test(t.trainNo + t.type));
    if (trainType === s.t('D-动车')) arr = arr.filter((t) => /D|动车/.test(t.trainNo + t.type));
    if (trainType === s.t('Z/T/K-普速')) arr = arr.filter((t) => /Z|T|K|普速/.test(t.trainNo + t.type));
    arr = [...arr];
    if (sort === 'cheapest') arr.sort((a, b) => Math.min(...a.seats.map((x) => x.price)) - Math.min(...b.seats.map((x) => x.price)));
    else if (sort === 'fastest') arr.sort((a, b) => a.duration.localeCompare(b.duration));
    else arr.sort((a, b) => a.depart.localeCompare(b.depart));
    return arr;
  }, [trains, from, to, tab, sort, trainType, s]);

  const applyDate = (d: number) => {
    const now = startOfSystemDay();
    const next = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setDate(next);
    go('trainSearch.query', { from, to, date: next });
    close();
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={<span className="text-[15px]">{from} → {to}</span>} />

      <div className="shrink-0 bg-white flex items-center px-2 py-2 border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'trainList.date.open' }, { onTrigger: () => open('date') })} className="flex items-center gap-1 text-[14px] text-[#333333] bg-transparent border-none cursor-pointer">
          {date} ▾
        </button>
        <div className="flex-1" />
        <button {...bindTap({ kind: 'action', id: 'trainList.grab.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="text-[12px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-3 py-1 border-none cursor-pointer">{s.t('抢票')}</button>
      </div>

      <div className="shrink-0 bg-white flex px-2 border-b border-[#F0F0F0]">
        {TRAIN_TABS.map((t) => (
          <button key={t.id} {...bindTap({ kind: 'action', id: 'trainList.tab.select' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })} className={`flex-1 py-2 text-[13px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{s.t(t.label)}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-14" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={`${from}→${to} 暂无车次`} hint={s.t('可改回上海→潍坊，或切换其它城市重试')} />
        ) : list.map((t) => {
          const minPrice = Math.min(...t.seats.map((seat) => seat.price));
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
                {t.seats.slice(0, 3).map((seat) => (
                  <span key={seat.name} className="text-[11px] text-[#666666]">{seat.name} <span className={seat.status === '有票' ? 'text-[#38A169]' : 'text-[#FF6A2C]'}>{seat.status}</span></span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex text-[13px] text-[#333333]">
        <button {...bindTap({ kind: 'action', id: 'trainList.sort.select.earliest' }, { onTrigger: () => open('sort') })} className="flex-1 py-3 bg-transparent border-none cursor-pointer">{SORTS.find((x) => x.id === sort)?.label} ▾</button>
        <button {...bindTap({ kind: 'action', id: 'trainList.filter.open' }, { onTrigger: () => open('filter') })} className={`flex-1 py-3 bg-transparent border-none cursor-pointer ${trainType ? 'text-[#0086F6]' : ''}`}>高级筛选 ▾</button>
      </div>

      {panel === 'sort' && (
        <BottomSheet title={s.t('排序')} onClose={close}>
          {SORTS.map((item) => (
            <button key={item.id} {...bindTap({ kind: 'action', id: 'trainList.sort.select.earliest' }, { params: { sort: item.id }, onTrigger: () => { setSort(item.id); close(); } })} className={`w-full text-left px-5 py-3 bg-transparent border-none cursor-pointer text-[14px] ${sort === item.id ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}>{item.label}{sort === item.id ? ' ✓' : ''}</button>
          ))}
        </BottomSheet>
      )}
      {panel === 'filter' && (
        <BottomSheet title={s.t('高级筛选')} onClose={close}>
          <div className="p-4 space-y-3">
            <div>
              <div className="text-[13px] text-[#999999] mb-2">{s.t('车次类型')}</div>
              <div className="flex flex-wrap gap-2">
                {[s.t('GC-高铁'), s.t('D-动车'), s.t('Z/T/K-普速')].map((o) => (
                  <button key={o} type="button" {...bindTap({ kind: 'action', id: 'trainList.filter.open' }, { params: { type: o }, onTrigger: () => setTrainType((x) => (x === o ? null : o)) })} className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${trainType === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7]'}`}>{o}</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
      {panel === 'date' && (
        <BottomSheet title={s.t('选择日期')} onClose={close}>
          <div className="p-4">
            <div className="text-[13px] text-[#666] mb-2">{startOfSystemDay().getFullYear()}年{startOfSystemDay().getMonth() + 1}月 · {s.t('当前')} {date}</div>
            <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
              {Array.from({ length: daysInMonth() }, (_, i) => i + 1).map((d) => {
                const label = `${String(startOfSystemDay().getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                return (
                  <button
                    key={d}
                    type="button"
                    {...bindTap({ kind: 'action', id: 'trainList.date.open' }, { params: { day: d }, onTrigger: () => applyDate(d) })}
                    className={`py-2 rounded border-none cursor-pointer ${label === date ? 'bg-[#0086F6] text-white' : 'bg-[#F7F8FA] text-[#333]'}`}
                  >{d}</button>
                );
              })}
            </div>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
