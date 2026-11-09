import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, Price, BottomSheet, usePanel, StarLabel, EmptyState } from '../components/ui';
import { IcMapPin } from '../res/icons';
import { HOTEL_SORTS } from '../constants';
import type { Hotel } from '../types';
import { resolveSearchKeyword } from '../utils/searchCity';
import { systemMonthDay } from '../utils/travelDate';

/** 酒店列表(spec hotel.list)。卡片主体→detail;订/价→room;地图入口;排序/价格/综合筛选面板;玩法chip。 */

const PRICE_RANGES = [
  { id: 'lt150', label: '¥150以下', min: 0, max: 149 },
  { id: '150-300', label: '¥150-300', min: 150, max: 300 },
  { id: '300-450', label: '¥300-450', min: 300, max: 450 },
  { id: 'lt400', label: '¥400以下', min: 0, max: 400 },
  { id: '450-600', label: '¥450-600', min: 450, max: 600 },
  { id: 'gt600', label: '¥600以上', min: 600, max: 99999 },
] as const;

export default function HotelListPage() {
  const s = useCtripStrings();
  const CHIPS = [s.t('徒步'), s.t('玩转乐园'), s.t('亲子'), s.t('地铁周边'), s.t('含早')];
  const { bindTap, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [sp] = useSearchParams();
  const storeCity = useCtripStore((st) => st.hotelCity);
  const setHotelCity = useCtripStore((st) => st.setHotelCity);
  const city = (sp.get('city') || storeCity || '上海').trim();
  const q = (sp.get('q') || '').trim();
  const checkIn = sp.get('checkIn') || systemMonthDay();
  const checkOut = sp.get('checkOut') || systemMonthDay(1);
  const keyword = resolveSearchKeyword(q, city);
  const hotels = useCtripStore((st) => st.hotels);
  const [sort, setSort] = React.useState('popularity');
  const [chips, setChips] = React.useState<string[]>([]);
  const [priceId, setPriceId] = React.useState<string | null>(null);
  const [starFilter, setStarFilter] = React.useState<string | null>(null);
  const [moreTag, setMoreTag] = React.useState<string | null>(null);
  const recordTaskAudit = useCtripStore((st) => st.recordTaskAudit);

  React.useEffect(() => {
    if (!priceId && chips.length === 0 && !moreTag) return;
    recordTaskAudit('hotelFilters', { city, keyword, priceId, chips, moreTag, sort });
  }, [city, keyword, priceId, chips, moreTag, sort, recordTaskAudit]);

  React.useEffect(() => {
    if (city && city !== storeCity) setHotelCity(city);
  }, [city, storeCity, setHotelCity]);

  const sortLabel = s.t(HOTEL_SORTS.find((x) => x.id === sort)?.label ?? '排序');
  const list = React.useMemo(() => {
    const hayOf = (h: Hotel) => `${h.name} ${h.district} ${h.tags.join(' ')} ${h.facilities.join(' ')}`;
    const inCity = hotels.filter((h) => h.city === city);
    let arr = inCity;
    if (keyword) {
      if (/4\.5分|高分/.test(keyword)) {
        arr = arr.filter((h) => h.score >= 4.5);
      } else if (/双床/.test(keyword)) {
        arr = arr.filter((h) =>
          h.tags.some((t) => /双床/.test(t))
          || h.facilities.some((f) => /双床/.test(f))
          || h.rooms.some((r) => /双床/.test(r.name + r.bed))
        );
      } else if (/新开业/.test(keyword)) {
        arr = arr.filter((h) => h.tags.some((t) => /新开业|新店/.test(t)));
      } else {
        const tokens = keyword.split(/\s+/).filter(Boolean);
        const match = (h: Hotel) => {
          const hay = hayOf(h);
          return tokens.every((t) => hay.includes(t)) || tokens.some((t) => hay.includes(t));
        };
        const cityHits = inCity.filter(match);
        arr = cityHits.length > 0 ? cityHits : hotels.filter(match);
      }
    }
    if (priceId) {
      const range = PRICE_RANGES.find((p) => p.id === priceId);
      if (range) arr = arr.filter((h) => h.price >= range.min && h.price <= range.max);
    }
    if (starFilter === s.t('经济')) arr = arr.filter((h) => h.star <= 2);
    else if (starFilter === s.t('舒适')) arr = arr.filter((h) => h.star === 3);
    else if (starFilter === s.t('高档')) arr = arr.filter((h) => h.star === 4);
    else if (starFilter === s.t('豪华')) arr = arr.filter((h) => h.star >= 5);
    for (const chip of chips) {
      if (chip === s.t('含早')) {
        arr = arr.filter((h) => h.tags.some((t) => t.includes(chip)) || h.rooms.some((r) => !/无早餐/.test(r.breakfast)));
      } else {
        arr = arr.filter((h) => h.tags.some((t) => t.includes(chip) || chip.includes(t.slice(0, 2))));
      }
    }
    if (moreTag) arr = arr.filter((h) => h.tags.some((t) => t.includes(moreTag)) || h.facilities.some((f) => f.includes(moreTag)));
    arr = [...arr];
    if (sort === 'priceAsc') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'priceDesc') arr.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') arr.sort((a, b) => b.score - a.score);
    else if (sort === 'star') arr.sort((a, b) => b.star - a.star);
    return arr;
  }, [hotels, sort, city, keyword, priceId, starFilter, chips, moreTag, s]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={<span className="text-[15px]">{city}{keyword ? ` · ${keyword}` : ''} · {checkIn}入住</span>}
        backTo={`/hotel/search?city=${encodeURIComponent(city)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
        rightContent={
          <button {...bindTap('hotelList.toMap', { params: { city } })} className="flex items-center gap-0.5 text-[#0086F6] text-[12px] bg-transparent border-none cursor-pointer">
            <IcMapPin size={16} />{s.t('地图')}</button>
        }
      />

      <div className="shrink-0 bg-white flex text-[13px] text-[#333333] border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'hotelList.sort.select.popularity' }, { onTrigger: () => open('sort') })} className="flex-1 py-2.5 bg-transparent border-none cursor-pointer">{sortLabel} ▾</button>
        <button {...bindTap({ kind: 'action', id: 'hotelList.filter.price.open' }, { onTrigger: () => open('price') })} className={`flex-1 py-2.5 bg-transparent border-none cursor-pointer ${priceId || starFilter ? 'text-[#0086F6]' : ''}`}>价格/星级 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'hotelList.filter.more.open' }, { onTrigger: () => open('more') })} className={`flex-1 py-2.5 bg-transparent border-none cursor-pointer ${moreTag ? 'text-[#0086F6]' : ''}`}>综合筛选 ▾</button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex gap-2 overflow-x-auto px-2 py-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'hotelList.chip.select.hiking' }, { params: { chip: c }, onTrigger: () => setChips((xs) => xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]) })}
              className={`shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer ${chips.includes(c) ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-white text-[#555555] border-[#E5E5E5]'}`}
            >{c}</button>
          ))}
        </div>

        <div className="px-2 pb-4 space-y-2">
          {list.length === 0 ? (
            <EmptyState text={`${city}暂无符合条件的酒店`} hint={s.t('可切换上海/杭州/成都/重庆/长春/北京等城市重试')} />
          ) : (
            list.map((h) => <HotelCard key={h.id} h={h} bindTap={bindTap} />)
          )}
        </div>
      </div>

      {panel === 'sort' && (
        <BottomSheet title={s.t('排序')} onClose={close}>
          <div className="py-1">
            {HOTEL_SORTS.map((item) => (
              <button
                key={item.id}
                {...bindTap({ kind: 'action', id: 'hotelList.sort.select.popularity' }, {
                  params: { sort: item.id },
                  onTrigger: () => { setSort(item.id); close(); },
                })}
                className={`w-full text-left px-5 py-3 bg-transparent border-none cursor-pointer text-[14px] ${sort === item.id ? 'text-[#0086F6] font-semibold' : 'text-[#333333]'}`}
              >{s.t(item.label)}{sort === item.id ? ' ✓' : ''}</button>
            ))}
          </div>
        </BottomSheet>
      )}
      {panel === 'price' && (
        <BottomSheet title={s.t('价格/星级')} onClose={close}>
          <div className="p-4">
            <div className="text-[13px] text-[#999999] mb-2">{s.t('价格区间')}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRICE_RANGES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  {...bindTap({ kind: 'action', id: 'hotelList.filter.price.open' }, {
                    params: { price: p.id },
                    onTrigger: () => setPriceId((x) => (x === p.id ? null : p.id)),
                  })}
                  className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${priceId === p.id ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7] text-[#333]'}`}
                >{s.t(p.label)}</button>
              ))}
            </div>
            <div className="text-[13px] text-[#999999] mb-2">{s.t('星级')}</div>
            <div className="flex flex-wrap gap-2">
              {[s.t('经济'), s.t('舒适'), s.t('高档'), s.t('豪华')].map((p) => (
                <button
                  key={p}
                  type="button"
                  {...bindTap({ kind: 'action', id: 'hotelList.filter.price.open' }, {
                    params: { star: p },
                    onTrigger: () => setStarFilter((x) => (x === p ? null : p)),
                  })}
                  className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${starFilter === p ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7] text-[#333]'}`}
                >{p}</button>
              ))}
            </div>
            <button onClick={close} className="w-full mt-5 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('确定')}</button>
          </div>
        </BottomSheet>
      )}
      {panel === 'more' && (
        <BottomSheet title={s.t('综合筛选')} onClose={close}>
          <div className="p-4 space-y-3">
            {[
              [s.t('玩法主题'), [s.t('亲子'), s.t('拍照出片'), s.t('海景')]],
              [s.t('品牌'), [s.t('亚朵'), s.t('全季'), s.t('汉庭')]],
              [s.t('设施服务'), [s.t('停车场'), s.t('充电桩'), s.t('洗衣')]],
            ].map(([g, opts]) => (
              <div key={g as string}>
                <div className="text-[13px] text-[#999999] mb-2">{g}</div>
                <div className="flex flex-wrap gap-2">
                  {(opts as string[]).map((o) => (
                    <button
                      key={o}
                      type="button"
                      {...bindTap({ kind: 'action', id: 'hotelList.filter.more.open' }, {
                        params: { tag: o },
                        onTrigger: () => setMoreTag((x) => (x === o ? null : o)),
                      })}
                      className={`text-[13px] rounded px-3 py-1.5 border-none cursor-pointer ${moreTag === o ? 'bg-[#E6F3FF] text-[#0086F6]' : 'bg-[#F2F4F7] text-[#333]'}`}
                    >{o}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">{s.t('查看结果')}</button>
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
