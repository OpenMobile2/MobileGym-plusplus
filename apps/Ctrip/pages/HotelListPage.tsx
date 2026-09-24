import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, BottomSheet, usePanel, StarLabel } from '../components/ui';
import { IcMapPin } from '../res/icons';
import { HOTEL_SORTS } from '../constants';
import type { Hotel } from '../types';

/** 酒店列表(spec hotel.list)。卡片主体→detail;订/价→room;地图入口;排序/价格/综合筛选面板;玩法chip。 */
const CHIPS = ['徒步', '玩转乐园', '亲子', '地铁周边', '含早'];

export default function HotelListPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const hotels = useCtripStore((s) => s.hotels);
  const [sort, setSort] = React.useState('popularity');
  const [chip, setChip] = React.useState<string | null>(null);

  const sortLabel = HOTEL_SORTS.find((s) => s.id === sort)?.label ?? '排序';
  const list = React.useMemo(() => {
    const arr = [...hotels];
    if (sort === 'priceAsc') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'priceDesc') arr.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') arr.sort((a, b) => b.score - a.score);
    else if (sort === 'star') arr.sort((a, b) => b.star - a.star);
    return arr;
  }, [hotels, sort]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={<span className="text-[15px]">上海 · 07-05入住</span>}
        rightContent={
          <button {...bindTap('hotelList.toMap')} className="flex items-center gap-0.5 text-[#0086F6] text-[12px] bg-transparent border-none cursor-pointer">
            <IcMapPin size={16} /> 地图
          </button>
        }
      />

      {/* 排序 / 筛选栏 */}
      <div className="shrink-0 bg-white flex text-[13px] text-[#333333] border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'hotelList.sort.select.popularity' }, { onTrigger: () => open('sort') })} className="flex-1 py-2.5 bg-transparent border-none cursor-pointer">{sortLabel} ▾</button>
        <button {...bindTap({ kind: 'action', id: 'hotelList.filter.price.open' }, { onTrigger: () => open('price') })} className="flex-1 py-2.5 bg-transparent border-none cursor-pointer">价格/星级 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'hotelList.filter.more.open' }, { onTrigger: () => open('more') })} className="flex-1 py-2.5 bg-transparent border-none cursor-pointer">综合筛选 ▾</button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 玩法chips */}
        <div className="flex gap-2 overflow-x-auto px-2 py-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'hotelList.chip.select.hiking' }, { params: { chip: c }, onTrigger: () => setChip((x) => (x === c ? null : c)) })}
              className={`shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer ${chip === c ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-white text-[#555555] border-[#E5E5E5]'}`}
            >{c}</button>
          ))}
        </div>

        <div className="px-2 pb-4 space-y-2">
          {list.map((h) => <HotelCard key={h.id} h={h} bindTap={bindTap} />)}
        </div>
      </div>

      {panel === 'sort' && (
        <BottomSheet title="排序" onClose={close}>
          <div className="py-1">
            {HOTEL_SORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSort(s.id); close(); }}
                className={`w-full text-left px-5 py-3 bg-transparent border-none cursor-pointer text-[14px] ${sort === s.id ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}
              >{s.label}{sort === s.id ? ' ✓' : ''}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {panel === 'price' && (
        <BottomSheet title="价格/星级" onClose={close}>
          <div className="p-4">
            <div className="text-[13px] text-[#999999] mb-2">价格区间</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {['¥150以下', '¥150-300', '¥300-450', '¥450-600', '¥600以上'].map((p) => (
                <span key={p} className="text-[13px] bg-[#F2F4F7] rounded px-3 py-1.5">{p}</span>
              ))}
            </div>
            <div className="text-[13px] text-[#999999] mb-2">星级</div>
            <div className="flex flex-wrap gap-2">
              {['经济', '舒适', '高档', '豪华'].map((p) => (
                <span key={p} className="text-[13px] bg-[#F2F4F7] rounded px-3 py-1.5">{p}</span>
              ))}
            </div>
            <button onClick={close} className="w-full mt-5 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
      {panel === 'more' && (
        <BottomSheet title="综合筛选" onClose={close}>
          <div className="p-4 space-y-3">
            {['玩法主题', '品牌', '设施服务', '特色'].map((g) => (
              <div key={g}>
                <div className="text-[13px] text-[#999999] mb-2">{g}</div>
                <div className="flex flex-wrap gap-2">
                  {['选项A', '选项B', '选项C'].map((o) => (
                    <span key={o} className="text-[13px] bg-[#F2F4F7] rounded px-3 py-1.5">{g}{o}</span>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">查看结果</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function HotelCard({ h, bindTap }: { h: Hotel; bindTap: ReturnType<typeof useCtripGestures>['bindTap'] }) {
  return (
    <div {...bindTap('hotelList.toDetail', { params: { id: h.id } })} className="bg-white rounded-xl overflow-hidden flex cursor-pointer">
      <Img src={h.image} className="w-28 h-32 object-cover shrink-0" />
      <div className="flex-1 min-w-0 p-2.5 flex flex-col">
        <div className="text-[14px] font-semibold text-[#111111] line-clamp-2 leading-snug">{h.name}</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[12px] text-[#0086F6] font-semibold">{h.score}</span>
          <StarLabel star={h.star} />
          <span className="text-[11px] text-[#999999]">{h.reviewCount}点评</span>
        </div>
        <div className="text-[11px] text-[#999999] mt-0.5 line-clamp-1">{h.district}</div>
        <div className="flex flex-wrap gap-1 mt-1">
          {h.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-[#FF7A45] bg-[#FFF2EC] rounded px-1 py-0.5">{t}</span>
          ))}
        </div>
        <div className="flex items-end justify-between mt-auto pt-1">
          {h.rankLabel && <span className="text-[10px] text-[#B8860B] bg-[#FFF7E0] rounded px-1 py-0.5 line-clamp-1 max-w-[55%]">{h.rankLabel}</span>}
          <div className="ml-auto flex items-end gap-1">
            {h.oldPrice ? <span className="text-[10px] text-[#BBBBBB] line-through">¥{h.oldPrice}</span> : null}
            <Price value={h.price} size="m" />
            <button
              {...bindTap('hotelList.toRoom', { params: { id: h.id }, stopPropagation: true })}
              className="ml-1 text-[13px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-3 py-1 border-none cursor-pointer"
            >订</button>
          </div>
        </div>
      </div>
    </div>
  );
}
