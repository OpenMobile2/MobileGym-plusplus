import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcChevronUp, IcChevronDown } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { isSelfShop } from '../utils/search';
import type { Product } from '../types';

type SimilarSort = 'default' | 'sales' | 'priceAsc' | 'priceDesc' | 'promo' | 'service';

const serviceOf = (p: Product): string[] => {
  const s = p.attrs['service'];
  return Array.isArray(s) ? s : typeof s === 'string' ? [s] : [];
};

/** 相似卡销量/热度文案(s322:月销量14 / 热销中) */
const salesLabel = (p: Product): string => (p.rankFields.sales >= 500 ? '热销中' : `月销量${p.rankFields.sales}`);

/**
 * 找相似结果页(spec search.similar,s322):橙头「找相似」+原商品卡 + 五项排序行 + 相似双列卡。
 * 相似集=同品类其余商品;促销/苏宁服务为标签过滤(spec)。
 */
export default function SimilarPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const { search } = useLocation();
  const productId = new URLSearchParams(search).get('productId') ?? '';
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const [sort, setSort] = useState<SimilarSort>('default');

  const origin = SUNING_CONFIG.products.find((p) => p.id === productId) ?? SUNING_CONFIG.products[0];
  let similar = SUNING_CONFIG.products.filter((p) => p.category === origin.category && p.id !== origin.id);
  if (similar.length === 0) similar = SUNING_CONFIG.products.filter((p) => p.id !== origin.id).slice(0, 6);
  if (sort === 'promo') similar = similar.filter((p) => p.promoTag !== null);
  if (sort === 'service') similar = similar.filter((p) => serviceOf(p).length > 0);
  const listed = [...similar];
  if (sort === 'sales') listed.sort((a, b) => b.rankFields.sales - a.rankFields.sales);
  if (sort === 'priceAsc') listed.sort((a, b) => a.price - b.price);
  if (sort === 'priceDesc') listed.sort((a, b) => b.price - a.price);

  const sortTabs: Array<{ key: SimilarSort | 'price'; label: string }> = [
    { key: 'default', label: S.sortDefault },
    { key: 'sales', label: S.sortSales },
    { key: 'price', label: S.sortPrice },
    { key: 'promo', label: S.sortPromo },
    { key: 'service', label: S.sortService },
  ];

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 原商品名(截断)+ … */}
      <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-[var(--app-text)]">{origin.title}</div>
        <button {...action('search.similar.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcMore size={22} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 橙色「找相似」头图 + 原商品卡 */}
        <div className="bg-gradient-to-b from-[var(--app-primary)] via-[#FE9A2E] to-[var(--app-bg)] px-3 pb-1 pt-3">
          <div className="pb-3 text-center text-[20px] font-black tracking-widest text-white">{S.findSimilar}</div>
          <div
            {...bindTap('search.similar.origin.open', { params: { productId: origin.id } })}
            className="flex cursor-pointer gap-3 rounded-xl bg-[var(--app-surface)] p-3"
          >
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
              <Img src={origin.image} className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-[15px] leading-[21px] text-[var(--app-text)]">
                {isSelfShop(origin.shopId) && (
                  <span className="mr-1 inline-block translate-y-[-1px] rounded-sm bg-[var(--app-primary)] px-0.5 text-[9px] font-bold leading-[14px] text-white">
                    {S.selfTag}
                  </span>
                )}
                {origin.title}
              </div>
              <div className="mt-2 text-[19px] font-bold leading-none text-[var(--app-c-danger)]">
                <span className="text-[12px]">¥</span>
                {origin.price.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* 排序行:综合/销量/价格⇅/促销/苏宁服务(五项,照 s322) */}
        <div className="mx-0 flex items-center bg-[var(--app-surface)] px-1 py-1">
          {sortTabs.map(({ key, label }) => {
            const isPrice = key === 'price';
            const active = isPrice ? sort === 'priceAsc' || sort === 'priceDesc' : sort === key;
            return (
              <button
                key={key}
                {...action(
                  'search.similar.sort.select',
                  () => setSort(isPrice ? (sort === 'priceAsc' ? 'priceDesc' : 'priceAsc') : (key as SimilarSort)),
                  { params: { sort: key } },
                )}
                className={`relative flex flex-1 cursor-pointer items-center justify-center gap-0.5 border-none bg-transparent py-2 text-[14px] ${
                  active ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
                }`}
              >
                {label}
                {isPrice && (
                  <span className="flex flex-col">
                    <IcChevronUp size={8} className={sort === 'priceAsc' ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'} strokeWidth={3} />
                    <IcChevronDown size={8} className={sort === 'priceDesc' ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'} strokeWidth={3} />
                  </span>
                )}
                {active && <span className="absolute bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />}
              </button>
            );
          })}
        </div>

        {/* 相似商品双列卡:名称+价格+月销量/热销中+评价数+好评率(s322) */}
        <div className="grid grid-cols-2 gap-2 p-2">
          {listed.map((p) => (
            <div
              key={p.id}
              {...bindTap('search.similar.product.open', { params: { productId: p.id } })}
              className="cursor-pointer overflow-hidden rounded-xl bg-[var(--app-surface)]"
            >
              <div className="aspect-square w-full bg-[var(--app-c-chip-bg)]">
                <Img src={p.image} className="h-full w-full object-contain" />
              </div>
              <div className="p-2">
                <div className="line-clamp-2 text-[13px] leading-[18px] text-[var(--app-text)]">
                  {isSelfShop(p.shopId) && (
                    <span className="mr-1 inline-block translate-y-[-1px] rounded-sm bg-[var(--app-primary)] px-0.5 text-[9px] font-bold leading-[14px] text-white">
                      {S.selfTag}
                    </span>
                  )}
                  {p.title}
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-[17px] font-bold leading-none text-[var(--app-c-danger)]">
                    <span className="text-[11px]">¥</span>
                    {p.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[var(--app-c-text-muted)]">{salesLabel(p)}</span>
                </div>
                <div className="mt-1 text-[10px] text-[var(--app-c-text-muted)]">
                  {p.reviewCount}评价&emsp;{p.goodRate.toFixed(1)}%好评
                </div>
              </div>
            </div>
          ))}
          {listed.length === 0 && (
            <div className="col-span-2 py-12 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>
          )}
        </div>
      </div>
    </div>
  );
}
