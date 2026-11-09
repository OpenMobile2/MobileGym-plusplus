import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { SORT_OPTIONS } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { ItemGrid } from '../components/ItemCard';
import { Img, usePanel } from '../components/ui';
import { fmt } from '../utils/format';
import type { TaobaoStringKey } from '../res/strings';
import { IcNavBack, IcCamera, IcFilter } from '../res/icons';
import type { TbItem } from '../types';

const FILTER_GROUP_KEYS: { nameKey: TaobaoStringKey; optionKeys: TaobaoStringKey[] }[] = [
  { nameKey: 'filterGroupLogistics', optionKeys: ['logisticsFreeShipping', 'logisticsReturnGuarantee', 'logisticsShip48h', 'logisticsShip24h', 'logisticsHomeDelivery', 'logisticsNextDay'] },
  { nameKey: 'filterGroupShopRating', optionKeys: ['rating5', 'rating48Plus', 'rating46Plus'] },
  { nameKey: 'filterGroupPriceRange', optionKeys: ['priceUnder100', 'price100to300', 'price300to600', 'priceOver600'] },
];

/**
 * 搜索结果页(spec: search.result)
 * - 无结果时不显示空态插画,直接展示推荐商品流(IMG_8750)
 * - 筛选抽屉走 ?panel=filter
 */
export default function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'default';
  const { value: panel, open: openPanel } = usePanel();
  const { bindTap, bindBack, back } = useTaobaoGestures();
  const s = useStrings();
  const items = useTaobaoStore((st) => st.items);
  const shops = useTaobaoStore((st) => st.shops);
  const [pendingFilters, setPendingFilters] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [priceAsc, setPriceAsc] = useState(true);

  const kw = q.trim().toLowerCase();
  let matched = kw
    ? items.filter(
        (i) => i.title.toLowerCase().includes(kw) || i.category.includes(kw) ||
          shops.find((sh) => sh.id === i.shopId)?.name.toLowerCase().includes(kw),
      )
    : items;
  const noResult = matched.length === 0;
  if (noResult) matched = items; // 真实行为:直接给推荐流

  const sorted: TbItem[] = [...matched].sort((a, b) => {
    if (sort === 'sales') return parseSold(b.sold) - parseSold(a.sold);
    if (sort === 'price') return priceAsc ? a.price - b.price : b.price - a.price;
    return 0;
  });

  // 品牌官方卡:搜索词命中店铺名时展示
  const brandShop = kw ? shops.find((sh) => sh.name.toLowerCase().includes(kw)) : undefined;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* 搜索头 */}
      <div className="flex items-center gap-2 px-2 h-12 shrink-0 bg-app-surface">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer">
          <IcNavBack size={24} />
        </button>
        <div
          {...bindBack({ params: { reason: 'editQuery' } })}
          className="flex-1 flex items-center bg-[#F5F5F5] rounded-full h-9 px-3 gap-2 cursor-pointer"
        >
          <span className="flex-1 text-[14px] text-app-text truncate">{q || s.searchItemsPlaceholder}</span>
          <IcCamera size={17} className="text-app-text-muted" />
        </div>
        <button
          {...bindTap('search.submit', { params: { q } })}
          className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] rounded-full px-4 py-1.5 border-none cursor-pointer"
        >
          {s.search}
        </button>
      </div>

      {/* 排序栏 */}
      <div className="flex items-center px-4 h-10 shrink-0 bg-app-surface border-t border-[#F5F5F5] gap-5">
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.id}
            {...bindTap({ kind: 'action', id: 'searchResult.sort.select.option' }, {
              params: { sort: o.id },
              onTrigger: () => {
                if (o.id === 'price' && sort === 'price') setPriceAsc((v) => !v);
                setSearchParams((p) => { p.set('sort', o.id); return p; }, { replace: true });
              },
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer ${
              sort === o.id ? 'text-[#FF5000] font-semibold' : 'text-app-text'
            }`}
          >
            {s[o.labelKey as TaobaoStringKey]}
            {o.id === 'price' && <span className="text-[10px] ml-0.5">{sort === 'price' ? (priceAsc ? '↑' : '↓') : '↕'}</span>}
          </button>
        ))}
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.filter.open' }, {
            onTrigger: () => openPanel('filter'),
          })}
          className={`flex items-center gap-1 text-[14px] bg-transparent border-none cursor-pointer ${
            appliedFilters.length ? 'text-[#FF5000]' : 'text-app-text'
          }`}
        >
          <IcFilter size={15} />{s.filterLabel}{appliedFilters.length > 0 && `·${appliedFilters.length}`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-result" data-scroll-direction="vertical">
        {/* 品牌官方卡 */}
        {brandShop && (
          <div className="mx-2.5 mt-2 bg-app-surface rounded-xl p-3">
            <div className="text-[10px] text-app-text-muted mb-1.5">{s.brandOfficialLabel} <span className="text-white bg-[#FF0036] rounded px-1">{s.tmallBadgeLabel}</span></div>
            <div className="flex items-center gap-2.5">
              <Img src={brandShop.logo} className="w-11 h-11 rounded-lg" />
              <div className="flex-1">
                <div className="text-[15px] font-semibold">{brandShop.name}</div>
                <div className="text-[11px] text-app-text-muted">{fmt(s.shopFansRateFmt, { fans: brandShop.fans, rate: brandShop.positiveRate })}</div>
              </div>
              <button
                {...bindTap('searchResult.shop-open', { params: { shopId: brandShop.id } })}
                className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[13px] rounded-full px-4 py-1.5 border-none cursor-pointer"
              >
                {s.enterShopLabel}
              </button>
            </div>
          </div>
        )}

        {noResult && (
          <div className="mx-2.5 mt-2 text-[12px] text-app-text-muted bg-app-surface rounded-lg px-3 py-2">
            {fmt(s.noResultsFmt, { query: q })}
          </div>
        )}

        <div className="mt-2 pb-2">
          <ItemGrid
            items={sorted}
            bindingOf={(it) => bindTap('searchResult.item-open', { params: { itemId: it.id } })}
          />
        </div>
      </div>

      {/* 全部筛选抽屉(右侧) */}
      {panel === 'filter' && (
        <div className="absolute inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => back()} />
          <div className="absolute right-0 top-0 bottom-0 w-[78%] bg-app-surface flex flex-col">
            <div className="text-center font-semibold text-[15px] h-12 leading-[48px] shrink-0">{s.allFiltersTitle}</div>
            <div className="flex-1 overflow-y-auto px-3">
              {FILTER_GROUP_KEYS.map((g) => (
                <div key={g.nameKey} className="mb-4">
                  <div className="text-[13px] text-app-text-muted mb-2">{s[g.nameKey]}</div>
                  <div className="flex flex-wrap gap-2">
                    {g.optionKeys.map((oKey) => {
                      const o = s[oKey];
                      const on = pendingFilters.includes(o);
                      return (
                        <button
                          key={oKey}
                          onClick={() =>
                            setPendingFilters((f) => (on ? f.filter((x) => x !== o) : [...f, o]))
                          }
                          className={`text-[12px] rounded-lg px-3 py-2 border cursor-pointer ${
                            on
                              ? 'bg-[#FFF1E8] text-[#FF5000] border-[#FF5000]'
                              : 'bg-app-bg text-app-text border-transparent'
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 p-3 shrink-0">
              <button
                {...bindTap({ kind: 'action', id: 'searchResult.filter.clear' }, {
                  onTrigger: () => setPendingFilters([]),
                })}
                className="flex-1 rounded-full border border-[#DDDDDD] bg-app-surface text-[14px] py-2.5 cursor-pointer"
              >
                {s.clearSelectionLabel}
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'searchResult.filter.apply' }, {
                  onTrigger: () => { setAppliedFilters(pendingFilters); back(); },
                })}
                className="flex-1 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] py-2.5 border-none cursor-pointer"
              >
                {s.okLabel}
              </button>
            </div>
            <div className="h-4 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}

function parseSold(sold: string): number {
  const m = sold.match(/([\d.]+)(万)?/);
  if (!m) return 0;
  return parseFloat(m[1]) * (m[2] ? 10000 : 1);
}
