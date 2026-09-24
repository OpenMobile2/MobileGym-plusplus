import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { RANK_DIMS, RANK_CATEGORY_CARDS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch, IcMapMini, IcMore, IcChevronDown } from '../res/icons';
import { Stars } from '../components/Stars';
import { shopCoverUrl } from '../assets';
import type { Shop } from '../types';

const TOP_BADGES = ['#F0A500', '#C0C0C0', '#D98A50'];

export default function RankPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const city = useDianpingStore((st) => st.city);
  const shops = useDianpingStore((st) => st.shops);
  const showToast = useDianpingStore((st) => st.showToast);
  const [dim, setDim] = useState('hot');

  const activeDim = RANK_DIMS.find((d) => d.id === dim) ?? RANK_DIMS[0];
  const ranked = useMemo(() => {
    const field = activeDim.field;
    return [...shops].sort((a, b) => (b[field] as number) - (a[field] as number) || b.score - a.score);
  }, [shops, activeDim.field]);

  const indexOf = (shop: Shop, i: number) =>
    (Number(shop[activeDim.field]) * 8 + shop.score * 4 + (12 - i)).toFixed(2);

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 深色头部 */}
      <div className="bg-gradient-to-b from-[#2B2119] to-[#4A3524] px-2 pb-3 pt-1">
        <div className="flex items-center gap-1">
          <button type="button" className="border-none bg-transparent p-1.5 text-white cursor-pointer" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 border-none bg-transparent px-1 text-[17px] font-bold text-white cursor-pointer"
            {...bindTap('rank.city-open')}
          >
            {city}
            <IcChevronDown size={14} />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              className="flex flex-col items-center border-none bg-transparent text-[10px] text-white cursor-pointer"
              {...bindTap('rank.search-open')}
            >
              <IcSearch size={18} />
              {s.search}
            </button>
            <button
              type="button"
              className="flex flex-col items-center border-none bg-transparent text-[10px] text-white cursor-pointer"
              {...bindTap('rank.map-open')}
            >
              <IcMapMini size={18} />
              {s.tabMap}
            </button>
            <button
              type="button"
              className="border-none bg-transparent text-white cursor-pointer"
              {...action('rank.cat.open.disabled', () => showToast(s.notOpen))}
            >
              <IcMore size={18} />
            </button>
          </div>
        </div>
        <div className="mt-2 text-center">
          <div className="text-[24px] font-black tracking-wide text-[#F5D9A8]">{s.rankBoard}</div>
          <div className="mt-1 text-[11px] text-white/70">公正不收费 · 依托消费者浏览行为和真实评价得出 · 评选规则 ›</div>
        </div>
      </div>

      {/* 四大品类卡 */}
      <div className="grid grid-cols-4 gap-2 px-3 pb-1 pt-2">
        {RANK_CATEGORY_CARDS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="flex flex-col items-center gap-0.5 rounded-[10px] border-none py-2 cursor-pointer"
            style={{ background: c.bg }}
            {...action('rank.cat.open.disabled', () => showToast(s.notOpen))}
          >
            <span className="text-[15px] font-black" style={{ color: c.fg }}>
              {c.title}
            </span>
            <span className="text-[10px]" style={{ color: c.fg }}>
              {c.sub}
            </span>
          </button>
        ))}
      </div>

      {/* 左侧指数榜 + 右侧列表 */}
      <div className="flex min-h-0 flex-1">
        <div className="w-[76px] shrink-0 overflow-y-auto bg-[#EFEFEF] py-2">
          {RANK_DIMS.map((d) => {
            const active = d.id === dim;
            return (
              <button
                key={d.id}
                type="button"
                className={`relative flex w-full justify-center border-none bg-transparent py-2.5 text-[13px] cursor-pointer ${
                  active ? 'font-bold text-[#FF6633]' : 'text-[#555]'
                }`}
                {...action('rank.dim.select.target', () => setDim(d.id), { params: { target: d.id } })}
              >
                {active ? <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-[#FF6633]" /> : null}
                {d.label}
              </button>
            );
          })}
        </div>

        <div
          className="min-w-0 flex-1 overflow-y-auto bg-white px-2.5 py-2"
          data-scroll-container="rank"
          data-scroll-direction="vertical"
        >
          <div className="mb-2 text-[15px] font-black text-[#222]">美食{activeDim.label}</div>
          {ranked.map((shop, idx) => (
            <button
              key={shop.id}
              type="button"
              className="flex w-full gap-2.5 border-none border-b border-[#F5F5F5] bg-white py-2.5 text-left cursor-pointer"
              {...bindTap('rank.shop-open', { params: { shopId: shop.id } })}
            >
              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: shop.coverColor }}>
                {shopCoverUrl(shop.id) ? <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" /> : null}
                <span
                  className="absolute left-0 top-0 rounded-br-[6px] px-1 py-0.5 text-[10px] font-black text-white"
                  style={{ background: idx < 3 ? TOP_BADGES[idx] : '#8A8A8A' }}
                >
                  TOP{String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-[#222]">{shop.name}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Stars score={shop.score} size={11} />
                  <span className="text-[11px] text-[#666]">¥{shop.avgPrice}/人</span>
                </div>
                <div className="mt-0.5 text-[11px] text-[#999]">
                  {shop.district} {shop.category} {(shop.distanceM / 1000).toFixed(1)}km
                </div>
                <span className="mt-1 inline-block rounded-[3px] bg-[#FFF1EA] px-1.5 py-0.5 text-[11px] text-[#FF6633]">
                  {activeDim.label.replace('榜', '')}指数{indexOf(shop, idx)}
                </span>
              </div>
            </button>
          ))}
          <div className="py-3 text-center text-[11px] text-[#CCC]">没有更多了 ~</div>
        </div>
      </div>
    </div>
  );
}
