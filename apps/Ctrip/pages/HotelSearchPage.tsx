import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { Img, PrimaryBtn, BottomSheet, usePanel, Stepper, useToast } from '../components/ui';
import { HOTEL_TABS } from '../constants';

/**
 * 酒店搜索(spec hotel.search)。
 * 城市→cityPicker;日期/人数→弹层(searchParams);tab 切换;查询→list;周边探索副tab。
 */
export default function HotelSearchPage() {
  const { bindTap, bindBack } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const [tab, setTab] = React.useState('domestic');
  const [rooms, setRooms] = React.useState(1);
  const [adults, setAdults] = React.useState(2);
  const [children, setChildren] = React.useState(0);
  const dates = { in: '07-05', out: '07-06' };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 真机 419/420：营销大图直接作为酒店频道页头。 */}
        <div className="relative h-[172px] overflow-hidden bg-[#087FCF]">
          <Img src="/@app-assets/Ctrip/gen/banner_summer.png" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />
          <button
            {...bindBack()}
            className="absolute left-3 top-4 flex h-9 w-9 items-center justify-center rounded-full border-none bg-black/20 text-[30px] leading-none text-white"
            aria-label="返回"
          >
            ‹
          </button>
          <div className="absolute left-7 top-12 text-white drop-shadow">
            <div className="text-[25px] font-black italic tracking-tight">共赴一场</div>
            <div className="text-[31px] font-black italic leading-none text-[#FFF65C]">夏日狂欢</div>
            <div className="mt-2 inline-flex rounded-full bg-white/85 px-3 py-1 text-[12px] font-bold text-[#0786DA]">
              酒店 <span className="mx-1 text-[#FF702F]">7折</span> 起 ›
            </div>
          </div>
        </div>

        <div className="relative -mt-5 rounded-t-[18px] bg-white pt-1 shadow-[0_-3px_12px_rgba(0,0,0,0.04)]">
        {/* 住宿类型 tab */}
        <div className="flex px-2 pt-2">
          {HOTEL_TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'hotelSearch.tab.select.domestic' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
                className={`relative flex-1 bg-transparent py-3 border-none cursor-pointer text-[15px] ${on ? 'text-[#087FE8] font-bold' : 'text-[#222222]'}`}
              >{t.label}</button>
            );
          })}
        </div>

        {/* 查询卡 */}
        <div className="mx-3 rounded-xl bg-white px-1 pb-3">
          <button {...bindTap('hotelSearch.city-open')} className="w-full flex items-center justify-between py-2.5 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[19px] font-bold text-[#111111]">上海⌄</span>
            <span className="flex-1 border-l border-[#E5E5E5] pl-3 text-left text-[15px] text-[#B8B8B8]">位置 / 品牌 / 酒店</span>
            <span className="text-[19px] text-[#0786E8]">⌾</span>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'hotelSearch.date.open' }, { onTrigger: () => open('date') })}
            className="w-full flex items-center py-3 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer"
          >
            <div className="flex-1 text-left">
              <div className="text-[11px] text-[#999999]">入住</div>
              <div className="text-[19px] font-bold">{dates.in}</div>
            </div>
            <span className="text-[11px] text-[#999999] px-2">共1晚</span>
            <div className="flex-1 text-right">
              <div className="text-[11px] text-[#999999]">离店</div>
              <div className="text-[19px] font-bold">{dates.out}</div>
            </div>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'hotelSearch.guests.open' }, { onTrigger: () => open('guests') })}
            className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer"
          >
            <span className="text-[17px] font-semibold text-[#111111]">{rooms}间房&nbsp; {adults}成人&nbsp; {children}儿童⌄</span>
            <span className="text-[15px] text-[#BBBBBB]">价格 / 星级</span>
          </button>

          <div className="flex gap-1.5 overflow-hidden pt-1">
            {['闵行区', '徐汇区', '双床房', '4.5分以上', '新开业'].map((c) => (
              <span key={c} className="whitespace-nowrap rounded-md bg-[#F7F7F7] px-2.5 py-1.5 text-[11px] text-[#333333]">{c}</span>
            ))}
          </div>

          <PrimaryBtn binding={bindTap('hotelSearch.query')} className="w-full mt-3 h-11 text-[17px]">查询</PrimaryBtn>
        </div>
        </div>

        {/* 酒店频道促销模块，填补真机首屏的内容密度。 */}
        <div className="mx-2 mt-3 rounded-xl border border-[#FFD5DD] bg-gradient-to-r from-[#FFF3F5] to-[#FFE8EC] p-3">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-bold text-[#E62E52]">一起订 · 90天内订过机票专享</span>
            <span>查看详情 ›</span>
          </div>
          <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-lg border border-[#FF9BAE] bg-white text-center">
            <div className="border-r border-dashed border-[#FF9BAE] px-2 py-3">
              <div className="font-bold text-[#E72E55]">最高 <span className="text-[22px]">6</span> 折</div>
              <div className="mt-1 text-[10px] text-[#444]">标有一起订专享的房型可用</div>
            </div>
            <div className="px-2 py-3">
              <div className="font-bold text-[#E72E55]">酒店免费取消</div>
              <div className="mt-1 text-[10px] text-[#444]">如遇机票航变</div>
            </div>
          </div>
        </div>

        <div className="mx-2 mt-3 grid grid-cols-3 gap-2">
          {['携程榜单', '特价套餐', '超值低价'].map((item, index) => (
            <button
              key={item}
              {...bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast(`${item}（演示）`) })}
              className="h-[70px] rounded-xl border-none bg-gradient-to-br from-white to-[#F2F7FF] p-2 text-left shadow-sm"
            >
              <div className="text-[14px] font-bold">{item}</div>
              <div className={`mt-1 text-[11px] ${index === 1 ? 'text-[#E94C77]' : 'text-[#1687EA]'}`}>{index === 0 ? '城市精选' : index === 1 ? '爆款直降' : '7折起'}</div>
            </button>
          ))}
        </div>

        {/* 周边探索副tab */}
        <button
          {...bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast('周边探索:出发地/探索多远/玩什么(演示)') })}
          className="mx-2 mt-2 w-[calc(100%-1rem)] bg-white rounded-xl p-3 text-left border-none cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="text-[15px] font-semibold text-[#111111]">周边探索</div>
            <div className="text-[12px] text-[#999999] mt-0.5">不知道去哪?按距离找目的地</div>
          </div>
          <span className="text-[#CCCCCC]">›</span>
        </button>
      </div>

      <div data-hide-on-keyboard className="grid h-[52px] shrink-0 grid-cols-5 border-t border-[#EEEEEE] bg-white">
        {['推荐', '购物车/收藏', '我的权益', '我的点评', '我的订单'].map((item, index) => (
          <button
            key={item}
            {...bindTap({ kind: 'action', id: 'hotelSearch.explore.open' }, { onTrigger: () => showToast(`${item}（演示）`) })}
            className={`border-none bg-white py-1 text-[9px] ${index === 0 ? 'font-semibold text-[#087FE8]' : 'text-[#555]'}`}
          >
            <div className="text-[17px]">{['⌄', '⌑', '◇', '□', '▤'][index]}</div>{item}
          </button>
        ))}
      </div>

      {panel === 'date' && (
        <BottomSheet title="选择入住/离店日期" onClose={close}>
          <div className="p-4">
            <div className="text-[13px] text-[#666666] mb-3">演示日历:默认 {dates.in} 入住,{dates.out} 离店(共1晚)</div>
            <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <button key={d} onClick={close} className={`py-2 rounded border-none cursor-pointer ${d === 5 ? 'bg-[#0086F6] text-white' : d === 6 ? 'bg-[#CFE6FF] text-[#0086F6]' : 'bg-[#F7F8FA] text-[#333333]'}`}>{d}</button>
              ))}
            </div>
            <PrimaryBtn onClick={close} className="w-full mt-4">确定</PrimaryBtn>
          </div>
        </BottomSheet>
      )}

      {panel === 'guests' && (
        <BottomSheet title="房间及住客" onClose={close}>
          <div className="p-4">
            {([
              { label: '房间数', v: rooms, set: setRooms, min: 1 },
              { label: '成人', v: adults, set: setAdults, min: 1 },
              { label: '儿童', v: children, set: setChildren, min: 0 },
            ] as const).map((r) => (
              <div key={r.label} className="flex items-center justify-between py-3 border-b border-[#F2F2F2]">
                <span className="text-[15px] text-[#222222]">{r.label}</span>
                <Stepper value={r.v} min={r.min} max={9} onChange={(d) => r.set((x) => Math.max(r.min, x + d))} />
              </div>
            ))}
            <PrimaryBtn onClick={close} className="w-full mt-4">确定</PrimaryBtn>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
