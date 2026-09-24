import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { SORT_OPTIONS } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { ItemGrid } from '../components/ItemCard';
import { Img, usePanel } from '../components/ui';
import { IcNavBack, IcCamera, IcFilter } from '../res/icons';
import type { TbItem } from '../types';

const FILTER_GROUPS = [
  { name: '物流', options: ['包邮', '退货宝', '48小时内发', '24小时内发', '送货上门', '次日达'] },
  { name: '店铺评分', options: ['5分', '4.8分及以上', '4.6分及以上'] },
  { name: '价格区间', options: ['100元以下', '100-300元', '300-600元', '600元以上'] },
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
  const items = useTaobaoStore((s) => s.items);
  const shops = useTaobaoStore((s) => s.shops);
  const [pendingFilters, setPendingFilters] = useState<string[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [priceAsc, setPriceAsc] = useState(true);

  const kw = q.trim().toLowerCase();
  let matched = kw
    ? items.filter(
        (i) => i.title.toLowerCase().includes(kw) || i.category.includes(kw) ||
          shops.find((s) => s.id === i.shopId)?.name.toLowerCase().includes(kw),
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
  const brandShop = kw ? shops.find((s) => s.name.toLowerCase().includes(kw)) : undefined;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      {/* 搜索头 */}
      <div className="flex items-center gap-2 px-2 h-12 shrink-0 bg-white">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer">
          <IcNavBack size={24} />
        </button>
        <div
          {...bindBack({ params: { reason: 'editQuery' } })}
          className="flex-1 flex items-center bg-[#F5F5F5] rounded-full h-9 px-3 gap-2 cursor-pointer"
        >
          <span className="flex-1 text-[14px] text-[#111111] truncate">{q || '搜索宝贝'}</span>
          <IcCamera size={17} className="text-[#666666]" />
        </div>
        <button
          {...bindTap('search.submit', { params: { q } })}
          className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] rounded-full px-4 py-1.5 border-none cursor-pointer"
        >
          搜索
        </button>
      </div>

      {/* 排序栏 */}
      <div className="flex items-center px-4 h-10 shrink-0 bg-white border-t border-[#F5F5F5] gap-5">
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
              sort === o.id ? 'text-[#FF5000] font-semibold' : 'text-[#333333]'
            }`}
          >
            {o.label}
            {o.id === 'price' && <span className="text-[10px] ml-0.5">{sort === 'price' ? (priceAsc ? '↑' : '↓') : '↕'}</span>}
          </button>
        ))}
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.filter.open' }, {
            onTrigger: () => openPanel('filter'),
          })}
          className={`flex items-center gap-1 text-[14px] bg-transparent border-none cursor-pointer ${
            appliedFilters.length ? 'text-[#FF5000]' : 'text-[#333333]'
          }`}
        >
          <IcFilter size={15} />筛选{appliedFilters.length > 0 && `·${appliedFilters.length}`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-result" data-scroll-direction="vertical">
        {/* 品牌官方卡 */}
        {brandShop && (
          <div className="mx-2.5 mt-2 bg-white rounded-xl p-3">
            <div className="text-[10px] text-[#999999] mb-1.5">品牌官方 <span className="text-white bg-[#FF0036] rounded px-1">天猫</span></div>
            <div className="flex items-center gap-2.5">
              <Img src={brandShop.logo} className="w-11 h-11 rounded-lg" />
              <div className="flex-1">
                <div className="text-[15px] font-semibold">{brandShop.name}</div>
                <div className="text-[11px] text-[#999999]">{brandShop.fans}粉丝 · 好评率{brandShop.positiveRate}</div>
              </div>
              <button
                {...bindTap('searchResult.shop-open', { params: { shopId: brandShop.id } })}
                className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[13px] rounded-full px-4 py-1.5 border-none cursor-pointer"
              >
                进店
              </button>
            </div>
          </div>
        )}

        {noResult && (
          <div className="mx-2.5 mt-2 text-[12px] text-[#999999] bg-white rounded-lg px-3 py-2">
            没有找到与「{q}」相关的宝贝,为你推荐以下商品
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
          <div className="absolute right-0 top-0 bottom-0 w-[78%] bg-white flex flex-col">
            <div className="text-center font-semibold text-[15px] h-12 leading-[48px] shrink-0">全部筛选</div>
            <div className="flex-1 overflow-y-auto px-3">
              {FILTER_GROUPS.map((g) => (
                <div key={g.name} className="mb-4">
                  <div className="text-[13px] text-[#666666] mb-2">{g.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((o) => {
                      const on = pendingFilters.includes(o);
                      return (
                        <button
                          key={o}
                          onClick={() =>
                            setPendingFilters((f) => (on ? f.filter((x) => x !== o) : [...f, o]))
                          }
                          className={`text-[12px] rounded-lg px-3 py-2 border cursor-pointer ${
                            on
                              ? 'bg-[#FFF1E8] text-[#FF5000] border-[#FF5000]'
                              : 'bg-[#F8F8F8] text-[#333333] border-transparent'
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
                className="flex-1 rounded-full border border-[#DDDDDD] bg-white text-[14px] py-2.5 cursor-pointer"
              >
                清空选择
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'searchResult.filter.apply' }, {
                  onTrigger: () => { setAppliedFilters(pendingFilters); back(); },
                })}
                className="flex-1 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] py-2.5 border-none cursor-pointer"
              >
                确定
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
