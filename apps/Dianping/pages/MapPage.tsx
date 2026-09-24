import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { MAP_CATS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { ShopCard } from '../components/ShopCard';
import { IcSearch, IcTrophy, IcStarOutline, IcLocateFixed } from '../res/icons';

const BUBBLE_POS = [
  { top: '14%', left: '58%' },
  { top: '30%', left: '18%' },
  { top: '46%', left: '62%' },
  { top: '60%', left: '28%' },
];

export default function MapPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, action } = useDianpingGestures();
  const shops = useDianpingStore((st) => st.shops);
  const showToast = useDianpingStore((st) => st.showToast);
  const [cat, setCat] = useState('rec');

  const activeCat = MAP_CATS.find((c) => c.id === cat) ?? MAP_CATS[0];
  const filtered = useMemo(() => {
    const base = [...shops].sort((a, b) => a.distanceM - b.distanceM);
    if (!activeCat.cats) return base;
    if (activeCat.cats.length === 0) return [];
    return base.filter((sh) => activeCat.cats!.includes(sh.category));
  }, [shops, activeCat]);

  const bubbles = filtered.slice(0, 4);

  return (
    <div className="relative flex h-full flex-col bg-[#EAF1E6]" data-status-bar-foreground="dark">
      {/* 上半:地图区 */}
      <div className="relative min-h-0 flex-1">
        {/* 仿地图底 */}
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#E7F0DF] via-[#EAF1E6] to-[#DDE9F0]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden>
            <path d="M-20 120 L200 260 L440 160" stroke="#CFE0CB" strokeWidth="26" fill="none" />
            <path d="M120 -20 L200 260 L160 640" stroke="#D7D2C8" strokeWidth="18" fill="none" />
            <path d="M-20 420 L200 460 L440 380" stroke="#CFE0CB" strokeWidth="14" fill="none" />
            <path d="M320 -20 L360 300 L300 640" stroke="#DCE7EF" strokeWidth="30" fill="none" />
          </svg>
        </div>

        {/* 搜索条 */}
        <div className="relative px-3 pt-2">
          <button
            type="button"
            className="flex h-11 w-full items-center gap-2 rounded-full border-none bg-(--app-c-card-bg) pl-4 text-left shadow-md cursor-pointer"
            {...bindTap('map.search-open')}
          >
            <IcSearch size={17} className="text-(--app-c-text-muted)" />
            <span className="text-[14px] text-(--app-c-text-muted)">搜索地点、美食、景点等</span>
          </button>
        </div>

        {/* 分类 chips */}
        <div className="relative mt-2 flex gap-2 overflow-x-auto px-3">
          {MAP_CATS.map((c) => {
            const active = c.id === cat;
            return (
              <button
                key={c.id}
                type="button"
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium shadow-sm cursor-pointer ${
                  active ? 'border-[#FF6633] bg-(--app-c-card-bg) text-[#FF6633]' : 'border-transparent bg-(--app-c-card-bg) text-(--app-c-text-primary)'
                }`}
                {...action('map.cat.select.target', () => setCat(c.id), { params: { target: c.id } })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* 店铺气泡 */}
        {bubbles.map((shop, i) => (
          <button
            key={shop.id}
            type="button"
            className="absolute z-10 flex items-center gap-1 rounded-full border-none bg-(--app-c-card-bg) px-2 py-1 text-[12px] font-bold text-[#FF6633] shadow-md cursor-pointer"
            style={BUBBLE_POS[i]}
            {...bindTap('food.shop-open', { params: { shopId: shop.id } })}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6633] text-[9px] text-white">
              {shop.category.slice(0, 1)}
            </span>
            {shop.score}分
          </button>
        ))}

        {/* 右侧悬浮按钮 */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-[12px] border-none bg-(--app-c-card-bg) text-[10px] text-(--app-c-text-primary) shadow-md cursor-pointer"
            {...bindTap('map.rank-open')}
          >
            <IcTrophy size={20} className="text-[#FF6633]" />
            必吃榜
          </button>
          <button
            type="button"
            className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-[12px] border-none bg-(--app-c-card-bg) text-[10px] text-(--app-c-text-primary) shadow-md cursor-pointer"
            {...action('map.collect.open.disabled', () => showToast(s.notOpen))}
          >
            <IcStarOutline size={20} />
            收藏
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border-none bg-(--app-c-card-bg) text-(--app-c-text-primary) shadow-md cursor-pointer"
            {...action('map.locate.open.disabled', () => showToast(s.notOpen))}
          >
            <IcLocateFixed size={20} />
          </button>
        </div>

        <span className="absolute bottom-2 left-3 z-10 rounded bg-white/80 px-1.5 py-0.5 text-[10px] text-[#888]">美团地图</span>
      </div>

      {/* 下半:底部抽屉列表 */}
      <div
        className="max-h-[42%] shrink-0 overflow-y-auto rounded-t-[16px] bg-(--app-c-card-bg) shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        data-scroll-container="map-list"
        data-scroll-direction="vertical"
      >
        <div className="flex justify-center py-1.5">
          <span className="h-1 w-9 rounded-full bg-[#DDD]" />
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-(--app-c-text-muted)">该分类暂无附近商户</div>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {filtered.map((shop) => (
              <ShopCard key={shop.id} shop={shop} dense />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
