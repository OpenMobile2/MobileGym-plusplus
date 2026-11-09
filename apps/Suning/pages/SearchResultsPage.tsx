import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcClose, IcChevronUp, IcChevronDown, IcLayout, IcMapPin, IcRobot, IcStore,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import type { Product, FilterDim } from '../types';
import {
  matchProducts, primaryCategory, sortProducts, matchQuickFilter, applyFilterState,
  filterStateActive, promoLabel, soldText, shopNameOf, isSelfShop, isNewProduct,
  adaptFilterDims, type SortKey,
} from '../utils/search';

const FAN_CHIPS = ['空气循环扇', '落地扇', '塔扇', '无叶风扇'];
const TABLET_CHIPS = ['华为', '联想', '荣耀'];
const TOP_PREFIX = ['精选', '优选', '品质'];
const PRESET_PCT = ['40%的选择', '42%的选择', '18%的选择', '8%的选择'];

function chipMatch(p: Product, chip: string): boolean {
  if (TABLET_CHIPS.includes(chip)) return p.brand === chip;
  const type = typeof p.attrs['type'] === 'string' ? (p.attrs['type'] as string) : '';
  if (chip === '无叶风扇') return type.includes('无叶') || p.title.includes('无叶');
  return type.includes(chip) || p.title.includes(chip);
}

const followersText = (n: number): string => (n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n));

/**
 * 搜索结果页(spec search.results,s276/s277/a358~a362):
 * base=类目chips+排序行+快捷筛选+单/双列商品卡;?sort=shop=店铺分组;?sheet=filter=全屏筛选弹层。
 */
export default function SearchResultsPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword') ?? '';
  const sort = (searchParams.get('sort') ?? 'default') as SortKey;
  const sheetOpen = searchParams.get('sheet') === 'filter';

  const showToast = useSuningStore((s) => s.showToast);
  const filterApplied = useSuningStore((s) => s._temp.filterApplied);
  const clearFilter = useSuningStore((s) => s.clearFilter);
  const openFilterDraft = useSuningStore((s) => s.openFilterDraft);
  const recordTaskAudit = useSuningStore((s) => s.recordTaskAudit);
  const wontfix = () => showToast(S.toastNotOpen);

  const [layout, setLayout] = useState<'single' | 'double'>('single');
  const [chip, setChip] = useState<string | null>(null);
  const [quick, setQuick] = useState<string[]>([]);

  useEffect(() => {
    const base = filterApplied ?? { dims: {} as Record<string, string[]>, pricePreset: null, priceMin: '', priceMax: '' };
    const service = [...(base.dims.service ?? [])];
    for (const q of quick) {
      if (!service.includes(q)) service.push(q);
    }
    const filter = quick.length > 0 || filterApplied
      ? { ...base, dims: { ...base.dims, ...(service.length ? { service } : {}) } }
      : filterApplied;
    recordTaskAudit({ searchResult: { keyword, quick, filter } });
  }, [filterApplied, keyword, quick, recordTaskAudit]);

  // 换词重置筛选上下文(chips/快捷/面板;StrictMode 双调用幂等)
  useEffect(() => {
    setChip(null);
    setQuick([]);
    clearFilter();
  }, [keyword, clearFilter]);

  const { products: matched, fallback } = matchProducts(keyword);
  const cat = primaryCategory(matched);
  const dimsetRaw =
    cat === 'fan' ? SUNING_CONFIG.filterDims.fan : cat === 'tablet' ? SUNING_CONFIG.filterDims.tablet : SUNING_CONFIG.filterDims.generic;
  const dimset = { dims: adaptFilterDims(dimsetRaw.dims, matched) };

  const chips = fallback ? [] : cat === 'fan' ? FAN_CHIPS : cat === 'tablet' ? TABLET_CHIPS : [];
  const quickChips = ['政府补贴', '苏宁服务', '24小时发货', '新品', ...(cat === 'tablet' ? ['价保'] : [])];

  let list = matched;
  if (chip) list = list.filter((p) => chipMatch(p, chip));
  for (const q of quick) list = list.filter((p) => matchQuickFilter(p, q));
  list = applyFilterState(list, filterApplied);
  list = sortProducts(list, sort);

  const setSort = (s: SortKey) =>
    setSearchParams(
      (p) => {
        p.set('sort', s);
        return p;
      },
      { replace: true },
    );

  /** 价格Tab:首次升序,再点降序(s276 双箭头) */
  const togglePriceSort = () => setSort(sort === 'priceAsc' ? 'priceDesc' : 'priceAsc');

  const shopGroups =
    sort === 'shop'
      ? [...new Set(list.map((p) => p.shopId))].map((sid) => ({
          shop: SUNING_CONFIG.shops.find((s) => s.id === sid),
          items: list.filter((p) => p.shopId === sid),
        }))
      : [];

  const attrText = (p: Product, key: string): string => {
    const v = p.attrs[key];
    return Array.isArray(v) ? v[0] ?? '' : v ?? '';
  };
  /** 卡内参数摘要(s276:类型/控制方式/风力档位),取当前维度组前 3 个有值属性 */
  const paramCols = (p: Product): Array<{ label: string; value: string }> =>
    dimset.dims
      .filter((d) => !['service', 'priceRange', 'brand', 'helpChoose'].includes(d.key))
      .map((d) => ({ label: d.label, value: attrText(p, d.key) }))
      .filter((x) => x.value)
      .slice(0, 3);

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 词chip搜索框 + 单双列切换 */}
      <div className="flex items-center gap-1 bg-gradient-to-b from-[#EAF3EC] to-[var(--app-bg)] px-2 pb-1 pt-10">
        {/* bindBack 回到进入结果页的上一页(入口页/首页等);勿 replace 进入口否则栈叠两层入口 */}
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div
          {...bindTap('search.results.entry.reopen', {
            params: { placeholder: keyword },
            // 叠在已有 /search 之上时先弹出入口再 replace,避免 Entry←Results←Entry 死循环栈
            nav: { mode: 'replace', popTo: '/search', popToInclusive: true },
          })}
          className="flex h-10 flex-1 cursor-pointer items-center rounded-xl bg-[var(--app-surface)] px-2"
        >
          <span className="flex items-center gap-1 rounded-lg bg-[var(--app-c-chip-bg)] px-2 py-1 text-[13px] text-[var(--app-text)]">
            {keyword || S.search}
            <IcClose size={12} className="text-[var(--app-c-text-muted)]" />
          </span>
        </div>
        <button
          {...action('search.results.layout.toggle', () => setLayout((l) => (l === 'single' ? 'double' : 'single')))}
          className="cursor-pointer border-none bg-transparent p-1.5 text-[var(--app-text)]"
        >
          <IcLayout size={20} />
        </button>
      </div>

      {/* 类目 chips 横滑(种子词才有;店铺Tab隐藏,s277) */}
      {sort !== 'shop' && chips.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-2 pb-2" data-scroll-container="chips" data-scroll-direction="horizontal">
          {chips.map((c) => {
            const img = SUNING_CONFIG.products.find((p) => chipMatch(p, c));
            const active = chip === c;
            return (
              <button
                key={c}
                {...action('search.results.chip.select', () => setChip((cur) => (cur === c ? null : c)), {
                  params: { value: c },
                })}
                className={`relative h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-none p-0 ${
                  active ? 'ring-2 ring-[var(--app-primary)]' : ''
                } bg-[var(--app-c-chip-bg)]`}
              >
                {img && <Img src={img.image} className="h-full w-full object-cover" />}
                <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[11px] leading-4 text-white">
                  {c}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 排序行:综合/销量/价格⇅/店铺 */}
      <div className="flex items-center bg-[var(--app-surface)] px-2">
        {(
          [
            { key: 'default' as const, label: S.sortDefault, aid: 'default' },
            { key: 'sales' as const, label: S.sortSales, aid: 'sales' },
          ]
        ).map(({ key, label, aid }) => {
          const active = sort === key;
          const bind =
            aid === 'default'
              ? action('search.results.select.default', () => setSort('default'))
              : action('search.results.select.sales', () => setSort('sales'));
          return (
            <button
              key={key}
              {...bind}
              className={`relative flex-1 cursor-pointer border-none bg-transparent py-2.5 text-[15px] ${
                active ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              {label}
              {active && <span className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />}
            </button>
          );
        })}
        <button
          {...action('search.results.select.price', togglePriceSort)}
          className={`relative flex flex-1 cursor-pointer items-center justify-center gap-0.5 border-none bg-transparent py-2.5 text-[15px] ${
            sort === 'priceAsc' || sort === 'priceDesc' ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
          }`}
        >
          {S.sortPrice}
          <span className="flex flex-col">
            <IcChevronUp size={9} className={sort === 'priceAsc' ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'} strokeWidth={3} />
            <IcChevronDown size={9} className={sort === 'priceDesc' ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'} strokeWidth={3} />
          </span>
          {(sort === 'priceAsc' || sort === 'priceDesc') && (
            <span className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />
          )}
        </button>
        <button
          {...action('search.results.select.shop', () => setSort('shop'))}
          className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1 border-none bg-transparent py-2.5 text-[15px] ${
            sort === 'shop' ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
          }`}
        >
          <IcStore size={15} />
          {S.sortShop}
          {sort === 'shop' && <span className="absolute bottom-1 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />}
        </button>
      </div>

      {/* 快捷筛选行 + 「筛选」(店铺Tab隐藏) */}
      {sort !== 'shop' && (
        <div className="flex items-center gap-2 bg-[var(--app-surface)] px-2 pb-2 pt-1">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto" data-scroll-container="quickFilter" data-scroll-direction="horizontal">
            {quickChips.map((q) => {
              const active = quick.includes(q);
              return (
                <button
                  key={q}
                  {...action(
                    'search.results.quickFilter.toggle',
                    () => setQuick((cur) => (cur.includes(q) ? cur.filter((x) => x !== q) : [...cur, q])),
                    { params: { value: q } },
                  )}
                  className={`shrink-0 cursor-pointer rounded-md px-2 py-1 text-[12px] leading-4 ${
                    active
                      ? 'border border-[var(--app-primary)] bg-[#FFF3E8] font-semibold text-[var(--app-primary)]'
                      : q === '政府补贴'
                        ? 'border border-[#D7E6FA] bg-[#EFF5FD] font-bold italic text-[#2B6BD4]'
                        : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
                  }`}
                >
                  {q}
                </button>
              );
            })}
          </div>
          <button
            {...bindTap('search.results.filter.open', { beforeTrigger: () => openFilterDraft() })}
            className={`flex shrink-0 cursor-pointer items-center gap-0.5 border-none bg-transparent text-[13px] ${
              filterStateActive(filterApplied) ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
            }`}
          >
            {S.filter}
            <IcChevronDown size={13} />
          </button>
        </div>
      )}

      {/* 结果列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {sort === 'shop' ? (
          <div className="pb-4">
            {shopGroups.map(({ shop, items }) =>
              shop ? (
                <div key={shop.id} className="mb-2 rounded-xl bg-[var(--app-surface)] p-3">
                  {/* 店头区整体同热区(spec) */}
                  <div {...bindTap('search.results.shop.open', { params: { shopId: shop.id } })} className="flex cursor-pointer items-center gap-2">
                    <div className="h-11 w-11 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-c-chip-bg)]">
                      <Img src={shop.logo} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate text-[15px] font-bold text-[var(--app-text)]">{shop.name}</span>
                        {shop.type === 'self' && (
                          <span className="shrink-0 rounded-sm bg-[var(--app-primary)] px-0.5 text-[9px] font-bold leading-[14px] text-white">
                            {S.selfTag}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--app-c-text-muted)]">{followersText(shop.followers)}人已关注</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[13px] font-bold text-white">
                      {S.enterShop}
                    </span>
                  </div>
                  <div className="mt-2.5 flex gap-2 overflow-x-auto" data-scroll-container="shopItems" data-scroll-direction="horizontal">
                    {items.slice(0, 6).map((p) => (
                      <button
                        key={p.id}
                        {...bindTap('search.results.shopItem.open', { params: { productId: p.id } })}
                        className="w-[104px] shrink-0 cursor-pointer border-none bg-transparent p-0 text-left"
                      >
                        <div className="h-[104px] w-[104px] overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                          <Img src={p.image} className="h-full w-full object-contain" />
                        </div>
                        <div className="mt-1 text-[13px] font-bold text-[var(--app-c-danger)]">
                          ¥{p.price}
                          <span className="text-[10px] font-normal">.00</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
            {shopGroups.length === 0 && <div className="py-12 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>}
          </div>
        ) : (
          <div className={layout === 'double' ? 'grid grid-cols-2 gap-2 pb-4' : 'pb-4'}>
            {list.map((p, i) => {
              const label = promoLabel(p);
              const cols = paramCols(p);
              return layout === 'single' ? (
                <div
                  key={p.id}
                  {...bindTap('search.results.product.open', { params: { productId: p.id } })}
                  className="mb-2 flex cursor-pointer gap-2.5 rounded-xl bg-[var(--app-surface)] p-2.5"
                >
                  <div className="h-[118px] w-[118px] shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                    <Img src={p.image} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-[var(--app-text)]">
                      {isSelfShop(p.shopId) && (
                        <span className="mr-1 inline-block translate-y-[-1px] rounded-sm bg-[var(--app-primary)] px-0.5 text-[9px] font-bold leading-[14px] text-white">
                          {S.selfTag}
                        </span>
                      )}
                      {p.title}
                    </div>
                    {/* TOP 榜单角标 → rank.detail(纸巾/空调/手机种子榜) */}
                    {!fallback && i < 3 && (
                      <button
                        {...bindTap('search.results.rank.open', {
                          params: { rankId: 'tissue' },
                          stopPropagation: true,
                        })}
                        className="mt-1 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0"
                      >
                        <span className="rounded-full bg-[#3B2A1A] px-1 text-[9px] font-bold leading-4 text-[#F8D9A8]">TOP</span>
                        <span className="text-[11px] text-[#B0651F]">
                          {TOP_PREFIX[i]}
                          {chip ?? keyword}榜·第1名&gt;
                        </span>
                      </button>
                    )}
                    {cols.length > 0 && (
                      <div className="mt-1 flex gap-3">
                        {cols.map((c) => (
                          <div key={c.label} className="min-w-0">
                            <div className="truncate text-[12px] text-[var(--app-text)]">{c.value}</div>
                            <div className="text-[10px] text-[var(--app-c-text-muted)]">{c.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[17px] font-bold leading-none text-[var(--app-c-danger)]">
                        <span className="text-[11px]">¥</span>
                        {p.price}
                      </span>
                      <span className="text-[11px] text-[var(--app-c-text-muted)] line-through">¥{p.priceOriginal}</span>
                      <span className="text-[11px] text-[var(--app-primary)]">同款低价</span>
                      <span className="text-[11px] text-[var(--app-c-text-muted)]">{soldText(p)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {label && <span className="rounded-sm bg-[var(--app-c-danger)] px-1 text-[9px] leading-4 text-white">{label}</span>}
                      {isNewProduct(p) && (
                        <span className="rounded-sm border border-[var(--app-c-danger)] px-1 text-[9px] leading-4 text-[var(--app-c-danger)]">新品</span>
                      )}
                      {Array.isArray(p.attrs['service']) && (p.attrs['service'] as string[]).includes('省心购') && (
                        <span className="rounded-sm border border-[var(--app-primary)] px-1 text-[9px] leading-4 text-[var(--app-primary)]">省心购</span>
                      )}
                    </div>
                    <button
                      {...bindTap('search.results.cardShop.open', { params: { shopId: p.shopId }, stopPropagation: true })}
                      className="mt-1 cursor-pointer border-none bg-transparent p-0 text-[11px] text-[var(--app-text-muted)]"
                    >
                      {shopNameOf(p.shopId)} &gt;
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={p.id}
                  {...bindTap('search.results.product.open', { params: { productId: p.id } })}
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
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-[16px] font-bold leading-none text-[var(--app-c-danger)]">
                        <span className="text-[11px]">¥</span>
                        {p.price}
                      </span>
                      <span className="text-[10px] text-[var(--app-c-text-muted)]">{soldText(p)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {list.length === 0 && <div className="py-12 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>}
          </div>
        )}
      </div>

      {/* 浮标:苏宁易问 + 对比(均放弃清单 toast;「回顶」spec 无交互不建) */}
      <div className="absolute bottom-16 right-3 flex flex-col items-center gap-2">
        <button
          {...action('search.results.wontfix.toast', wontfix)}
          className="flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[#2B6BD4] shadow-md"
        >
          <IcRobot size={20} />
          <span className="text-[8px] leading-3 text-[var(--app-text-muted)]">苏宁易问</span>
        </button>
        <button
          {...action('search.results.wontfix.toast', wontfix)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[11px] font-bold text-[var(--app-text-muted)] shadow-md"
        >
          对比
        </button>
      </div>

      {sheetOpen && <FilterSheet matched={matched} dims={dimset.dims} />}
    </div>
  );
}

/** ?sheet=filter:全屏「全部筛选」弹层(a358~a362):地址行 + 左维度导航 + 右 chips/价格 + 重置/确定 */
function FilterSheet({ matched, dims }: { matched: Product[]; dims: readonly FilterDim[] }) {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const draft = useSuningStore((s) => s._temp.filterDraft);
  const toggleFilterDim = useSuningStore((s) => s.toggleFilterDim);
  const setFilterPrice = useSuningStore((s) => s.setFilterPrice);
  const resetFilterDraft = useSuningStore((s) => s.resetFilterDraft);
  const applyFilter = useSuningStore((s) => s.applyFilter);
  const addresses = useSuningStore((s) => s.addresses);
  const setTemp = useSuningStore((s) => s.setTemp);
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);
  const address = addresses.find((a) => a.isDefault) ?? addresses[0];

  const [activeDim, setActiveDim] = useState(dims[0]?.key ?? '');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const count = applyFilterState(matched, draft).length;
  const addrText = address ? `${address.province}${address.city}${address.district}${address.street}${address.detail}` : '';

  const jumpTo = (key: string) => {
    setActiveDim(key);
    sectionRefs.current[key]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <div className="absolute inset-0 z-40">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-x-0 bottom-0 flex h-[86%] flex-col rounded-t-2xl bg-[var(--app-surface)]">
        {/* 标题 + 关闭 X */}
        <div className="relative py-3.5 text-center text-[17px] font-bold text-[var(--app-text)]">
          {S.allFilter}
          <button {...bindBack()} className="absolute right-3 top-3 cursor-pointer rounded-full border-none bg-[var(--app-c-chip-bg)] p-1 text-[#888]">
            <IcClose size={16} />
          </button>
        </div>
        {/* 收货地址行「修改」:进地址簿选择模式,选中项成为默认地址,本行文案随之联动 */}
        <div className="mx-3 flex items-center gap-1 rounded-lg bg-[var(--app-c-chip-bg)] px-2 py-2">
          <IcMapPin size={14} className="shrink-0 text-[var(--app-text-muted)]" />
          <span className="shrink-0 text-[12px] text-[var(--app-text-muted)]">{S.shipAddress}</span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text)]">{addrText}</span>
          <button
            {...bindTap('search.results.filter.address.pick', {
              params: { mode: 'picker' },
              beforeTrigger: () => setTemp({ addressPickTarget: 'default' }),
            })}
            className="shrink-0 cursor-pointer border-none bg-transparent text-[12px] text-[var(--app-text-muted)]"
          >
            {S.modify}
          </button>
        </div>

        <div className="mt-2 flex min-h-0 flex-1">
          {/* 左侧维度导航(竖排,选中橙字) */}
          <div className="w-[92px] shrink-0 overflow-y-auto overflow-x-hidden bg-[var(--app-c-chip-bg)]" data-scroll-container="filterNav" data-scroll-direction="vertical">
            {dims.map((d) => (
              <button
                key={d.key}
                {...action('search.results.filter.section.jump', () => jumpTo(d.key), { params: { dim: d.key } })}
                className={`block w-full cursor-pointer border-none px-2 py-3 text-left text-[13px] leading-4 ${
                  activeDim === d.key ? 'bg-[var(--app-surface)] font-bold text-[var(--app-primary)]' : 'bg-transparent text-[var(--app-text)]'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {/* 右侧面板:chips 多选 + 价格区间 */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3" data-scroll-container="filterPanel" data-scroll-direction="vertical">
            {dims.map((d) => (
              <div
                key={d.key}
                ref={(el) => {
                  sectionRefs.current[d.key] = el;
                }}
                className="pt-3"
              >
                <div className="text-[15px] font-bold text-[var(--app-text)]">{d.label}</div>
                {d.key === 'priceRange' ? (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      {/* 最低/最高价数字输入(与预设档互斥,后写覆盖,spec a361;无独立 actionId) */}
                      <input
                        value={draft.priceMin}
                        onChange={(e) => setFilterPrice({ priceMin: e.target.value.replace(/[^\d.]/g, '') })}
                        placeholder={S.minPrice}
                        inputMode="numeric"
                        className="h-9 min-w-0 flex-1 rounded-lg border-none bg-[var(--app-c-chip-bg)] text-center text-[13px] text-[var(--app-text)] outline-none placeholder:text-[#AAA]"
                      />
                      <span className="text-[var(--app-c-text-muted)]">—</span>
                      <input
                        value={draft.priceMax}
                        onChange={(e) => setFilterPrice({ priceMax: e.target.value.replace(/[^\d.]/g, '') })}
                        placeholder={S.maxPrice}
                        inputMode="numeric"
                        className="h-9 min-w-0 flex-1 rounded-lg border-none bg-[var(--app-c-chip-bg)] text-center text-[13px] text-[var(--app-text)] outline-none placeholder:text-[#AAA]"
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(d.presets ?? []).map((preset, pi) => {
                        const active = draft.pricePreset === preset;
                        return (
                          <button
                            key={preset}
                            {...action(
                              'search.results.filter.select.priceRange',
                              () => setFilterPrice({ pricePreset: active ? null : preset }),
                              { params: { value: preset } },
                            )}
                            className={`cursor-pointer rounded-lg py-1.5 text-[13px] leading-5 ${
                              active
                                ? 'border border-[var(--app-primary)] bg-[#FFF3E8] font-semibold text-[var(--app-primary)]'
                                : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text)]'
                            }`}
                          >
                            {preset}
                            <span className={`block text-[10px] leading-3 ${active ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'}`}>
                              {PRESET_PCT[pi % PRESET_PCT.length]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(d.options ?? []).map((opt) => {
                      const active = (draft.dims[d.key] ?? []).includes(opt);
                      return (
                        <button
                          key={opt}
                          {...action(
                            'search.results.filter.chip.toggle',
                            () => toggleFilterDim(d.key, opt, d.multi),
                            { params: { dim: d.key, value: opt } },
                          )}
                          className={`cursor-pointer truncate rounded-lg px-1 py-2 text-[13px] leading-4 ${
                            active
                              ? 'border border-[var(--app-primary)] bg-[#FFF3E8] font-semibold text-[var(--app-primary)]'
                              : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text)]'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部:重置 / 确定(N件商品),N 随已选条件实时变 */}
        <div className="flex gap-3 border-t border-[var(--app-border)] px-3 py-2.5">
          <button
            {...action('search.results.filter.reset', () => resetFilterDraft())}
            className="flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2.5 text-[15px] text-[var(--app-text)]"
          >
            {S.reset}
          </button>
          <button
            {...action('search.results.filter.apply', () => {
              applyFilter();
              back();
            })}
            className="flex-[1.6] cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
          >
            {S.confirm}({count}{S.itemsUnit})
          </button>
        </div>
      </div>
    </div>
  );
}
