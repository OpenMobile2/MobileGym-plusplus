import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { FOOD_TABS, SORT_OPTIONS, DIST_OPTIONS, PRICE_BANDS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch, IcMapMini, IcChevronDown } from '../res/icons';
import { ShopCard } from '../components/ShopCard';
import { computeOpenStatus } from '../utils/openStatus';
import type { Shop } from '../types';

type SortId = (typeof SORT_OPTIONS)[number]['id'];
type Panel = 'nearby' | 'category' | 'sort' | 'filter' | null;

export default function FoodChannelPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, action } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const [sp] = useSearchParams();
  const tab = sp.get('tab') || 'restaurant';
  const shops = useDianpingStore((st) => st.shops);

  const [panel, setPanel] = useState<Panel>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(190);
  useEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight);
  }, [tab, panel]);
  const [sort, setSort] = useState<SortId>('smart');
  const [dist, setDist] = useState<number | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [priceBand, setPriceBand] = useState<string | null>(null);

  // 换大类 Tab 时清空子筛选(分类/范围/排序/价格/营业),避免上一个 Tab 的「日料」等条件残留
  useEffect(() => {
    setCat(null);
    setDist(null);
    setSort('smart');
    setOpenOnly(false);
    setPriceBand(null);
    setPanel(null);
  }, [tab]);

  // 当前分类 Tab 下的候选分类(供「分类」下拉)
  const catOptions = useMemo(() => {
    const set = new Set<string>();
    shops.filter((x) => x.foodTabs.includes(tab as Shop['foodTabs'][number])).forEach((x) => set.add(x.category));
    return Array.from(set);
  }, [shops, tab]);

  const list = useMemo(() => {
    let rows = shops.filter((x) => x.foodTabs.includes(tab as Shop['foodTabs'][number]));
    if (dist != null) rows = rows.filter((x) => x.distanceM <= dist);
    if (cat) rows = rows.filter((x) => x.category === cat);
    if (openOnly) rows = rows.filter((x) => computeOpenStatus(x.hours) !== 'closed');
    if (priceBand) {
      const band = PRICE_BANDS.find((b) => b.id === priceBand);
      if (band) rows = rows.filter((x) => x.avgPrice >= band.min && x.avgPrice < band.max);
    }
    const sorted = [...rows];
    switch (sort) {
      case 'distance':
        sorted.sort((a, b) => a.distanceM - b.distanceM);
        break;
      case 'popular':
        sorted.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'good':
        sorted.sort((a, b) => b.score - a.score);
        break;
      case 'taste':
        sorted.sort((a, b) => b.taste - a.taste);
        break;
      case 'lowprice':
        sorted.sort((a, b) => a.avgPrice - b.avgPrice);
        break;
      case 'highprice':
        sorted.sort((a, b) => b.avgPrice - a.avgPrice);
        break;
      default:
        break; // smart: 保持内置顺序
    }
    return sorted;
  }, [shops, tab, dist, cat, openOnly, priceBand, sort]);

  const sortLabel = SORT_OPTIONS.find((o) => o.id === sort)?.label ?? s.smartSort;
  const distLabel = dist != null ? DIST_OPTIONS.find((o) => o.value === dist)?.label : s.nearby;
  const filterActive = openOnly || priceBand != null;
  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
  const barCls = (id: Panel, active: boolean) =>
    `flex items-center gap-0.5 border-none bg-transparent text-[12px] cursor-pointer ${
      active || panel === id ? 'font-medium text-[#FF6633]' : 'text-[#666]'
    }`;
  const barChevron = (id: Panel) => (
    <IcChevronDown size={10} className={panel === id ? 'rotate-180 transition-transform' : 'transition-transform'} />
  );

  return (
    <div className="relative flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div ref={headerRef} className="relative z-20 shrink-0 bg-white">
        <div className="flex h-11 items-center gap-1 px-1">
          <button type="button" className="border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <div className="text-[17px] font-bold text-[#222]">{s.foodTitle}</div>
          <button
            type="button"
            className="ml-2 flex min-w-0 flex-1 items-center gap-0.5 border-none bg-transparent text-[12px] text-[#666] cursor-pointer"
            {...action('food.loc.open.disabled', () => showToast(s.notOpen))}
          >
            <IcMapMini size={13} className="shrink-0 text-[#FF6633]" />
            <span className="truncate">南京大学(仙林校区)</span>
            <IcChevronDown size={10} />
          </button>
          <button
            type="button"
            className="flex flex-col items-center border-none bg-transparent px-2 text-[10px] text-[#666] cursor-pointer"
            {...bindTap('food.map-open')}
          >
            <IcMapMini size={16} />
            {s.tabMap}
          </button>
        </div>

        <button
          type="button"
          className="mx-3 mb-2 flex h-9 w-[calc(100%-1.5rem)] items-center overflow-hidden rounded-full bg-[#F5F5F5] pl-2.5 text-left cursor-pointer"
          {...bindTap('food.search-open')}
        >
          <IcSearch size={15} className="text-[#999]" />
          <span className="min-w-0 flex-1 truncate px-2 text-[12px] text-[#999]">南京适合一人食的店</span>
          <span className="flex h-full shrink-0 items-center bg-[#FF6633] px-3.5 text-[13px] text-white">
            {s.search}
          </span>
        </button>

        <div className="flex items-end gap-4 overflow-x-auto px-3">
          {FOOD_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`relative shrink-0 border-none bg-transparent pb-2 text-[14px] cursor-pointer ${
                  active ? 'font-bold text-[#222]' : 'text-[#666]'
                }`}
                {...bindTap('food.category-switch', { params: { tab: t.id } })}
              >
                {s[t.labelKey]}
                {active ? (
                  <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* 排序/筛选条 */}
        <div className="flex items-center justify-between border-t border-[#F5F5F5] px-4 py-2">
          <button type="button" className={barCls('nearby', dist != null)}
            {...action('food.bar.nearby', () => togglePanel('nearby'))}>
            {distLabel ?? s.nearby}
            {barChevron('nearby')}
          </button>
          <button type="button" className={barCls('category', cat != null)}
            {...action('food.bar.category', () => togglePanel('category'))}>
            {cat ?? s.category}
            {barChevron('category')}
          </button>
          <button type="button" className={barCls('sort', sort !== 'smart')}
            {...action('food.bar.sort', () => togglePanel('sort'))}>
            {sortLabel}
            {barChevron('sort')}
          </button>
          <button type="button" className={barCls('filter', filterActive)}
            {...action('food.bar.filter', () => togglePanel('filter'))}>
            {s.filter}
            {barChevron('filter')}
          </button>
        </div>

        {/* 快筛 chips(真实过滤) */}
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2">
          <button
            type="button"
            className={`shrink-0 rounded-full border-none px-2.5 py-1 text-[11px] cursor-pointer ${
              openOnly ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
            }`}
            {...action('food.chip.open.toggle', () => setOpenOnly((v) => !v))}
          >
            {s.openNow}
          </button>
          <button
            type="button"
            className={`shrink-0 rounded-full border-none px-2.5 py-1 text-[11px] cursor-pointer ${
              sort === 'good' ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
            }`}
            {...action('food.chip.good.toggle', () => setSort((v) => (v === 'good' ? 'smart' : 'good')))}
          >
            {s.chipHighScore}
          </button>
          <button
            type="button"
            className={`shrink-0 rounded-full border-none px-2.5 py-1 text-[11px] cursor-pointer ${
              dist === 500 ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
            }`}
            {...action('food.chip.near.toggle', () => setDist((v) => (v === 500 ? null : 500)))}
          >
            {s.chipNear500}
          </button>
          <button
            type="button"
            className={`shrink-0 rounded-full border-none px-2.5 py-1 text-[11px] cursor-pointer ${
              priceBand === 'p0' ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
            }`}
            {...action('food.chip.cheap.toggle', () => setPriceBand((v) => (v === 'p0' ? null : 'p0')))}
          >
            {s.chipCheap}
          </button>
        </div>
      </div>

      <div
        className="relative flex-1 overflow-y-auto"
        data-scroll-container="food-list"
        data-scroll-direction="vertical"
      >
        {list.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyList}</div>
        ) : (
          <div className="divide-y divide-[#F5F5F5] bg-white">
            {list.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>

      {/* 下拉/筛选面板 */}
      {panel ? (
        <div className="absolute inset-x-0 bottom-0 z-10" style={{ top: headerH }}>
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 border-none bg-black/35 cursor-pointer"
            {...action('food.panel.dismiss', () => setPanel(null))}
          />
          <div className="absolute inset-x-0 top-0 max-h-[70%] overflow-y-auto bg-white pb-2">
            {panel === 'nearby'
              ? DIST_OPTIONS.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    className={`flex w-full items-center justify-between border-none border-b border-[#F7F7F7] bg-white px-4 py-3 text-left text-[14px] cursor-pointer ${
                      (o.value ?? null) === dist ? 'font-medium text-[#FF6633]' : 'text-[#333]'
                    }`}
                    {...action('food.nearby.select.target', () => { setDist((cur) => (cur === o.value ? null : o.value)); setPanel(null); }, {
                      params: { target: o.label },
                    })}
                  >
                    {o.label}
                  </button>
                ))
              : null}
            {panel === 'category' ? (
              <>
                <button
                  type="button"
                  className={`flex w-full border-none border-b border-[#F7F7F7] bg-white px-4 py-3 text-left text-[14px] cursor-pointer ${
                    cat == null ? 'font-medium text-[#FF6633]' : 'text-[#333]'
                  }`}
                  {...action('food.category.select.target', () => { setCat(null); setPanel(null); }, {
                    params: { target: 'all' },
                  })}
                >
                  {s.allCategory}
                </button>
                {catOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`flex w-full border-none border-b border-[#F7F7F7] bg-white px-4 py-3 text-left text-[14px] cursor-pointer ${
                      cat === c ? 'font-medium text-[#FF6633]' : 'text-[#333]'
                    }`}
                    {...action('food.category.select.target', () => { setCat((cur) => (cur === c ? null : c)); setPanel(null); }, {
                      params: { target: c },
                    })}
                  >
                    {c}
                  </button>
                ))}
              </>
            ) : null}
            {panel === 'sort'
              ? SORT_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`flex w-full border-none border-b border-[#F7F7F7] bg-white px-4 py-3 text-left text-[14px] cursor-pointer ${
                      sort === o.id ? 'font-medium text-[#FF6633]' : 'text-[#333]'
                    }`}
                    {...action('food.sort.select.target', () => { setSort(o.id); setPanel(null); }, {
                      params: { target: o.id },
                    })}
                  >
                    {o.label}
                  </button>
                ))
              : null}
            {panel === 'filter' ? (
              <div className="px-4 py-3">
                <div className="mb-2 text-[13px] font-bold text-[#222]">{s.filterOpen}</div>
                <div className="mb-3">
                  <button
                    type="button"
                    className={`rounded-full border-none px-4 py-1.5 text-[12px] cursor-pointer ${
                      openOnly ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
                    }`}
                    {...action('food.filter.toggle.target', () => setOpenOnly((v) => !v), {
                      params: { target: 'open' },
                    })}
                  >
                    {s.openNow}
                  </button>
                </div>
                <div className="mb-2 text-[13px] font-bold text-[#222]">{s.filterPrice}</div>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {PRICE_BANDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`rounded-full border-none py-1.5 text-[12px] cursor-pointer ${
                        priceBand === b.id ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
                      }`}
                      {...action('food.filter.toggle.target', () => setPriceBand((v) => (v === b.id ? null : b.id)), {
                        params: { target: b.id },
                      })}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    className="flex-1 rounded-full border border-[#DDD] bg-white py-2 text-[14px] text-[#666] cursor-pointer"
                    {...action('food.filter.reset', () => { setOpenOnly(false); setPriceBand(null); })}
                  >
                    {s.reset}
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-full border-none bg-[#FF6633] py-2 text-[14px] font-semibold text-white cursor-pointer"
                    {...action('food.filter.apply', () => setPanel(null))}
                  >
                    {s.confirm}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
