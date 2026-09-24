import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, showToast, TopBar } from '../components/common';
import { ShopCard } from '../components/ShopCard';
import { IcDown, IcSearch, IcUp } from '../res/icons';
import type { TbShop } from '../types';

const CATS: { label: string; icon: string; cats: string[] | null }[] = [
  { label: '夜宵精选', icon: '⭐', cats: null },
  { label: '龙虾烧烤', icon: '🍢', cats: ['bbqshop', 'seafood'] },
  { label: '奶茶果汁', icon: '🧋', cats: ['milktea', 'coffee'] },
  { label: '炸鸡炸串', icon: '🍗', cats: ['friedchicken', 'skewer'] },
  { label: '鸭脖卤味', icon: '🦆', cats: ['luwei'] },
  { label: '特色小吃', icon: '🥟', cats: ['dumpling', 'guotie', 'noodleshop', 'malatang'] },
];

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'default', label: '综合排序' },
  { key: 'sales', label: '销量最高' },
  { key: 'distance', label: '距离最近' },
  { key: 'rating', label: '好评优先' },
  { key: 'minorder', label: '起送价最低' },
  { key: 'fastest', label: '配送最快' },
  { key: 'fee', label: '配送费最低' },
  { key: 'priceAsc', label: '人均从低到高' },
  { key: 'priceDesc', label: '人均从高到低' },
  { key: 'general', label: '通用排序' },
];

const QUICK_FILTERS = ['天天爆红包', '堂食店', '减配送费'];

const FILTER_SPEED = ['30分钟内', '40分钟内', '50分钟内', '60分钟内', '1km内', '2km内', '3km内', '5km内'];
const FILTER_PROMO = ['无门槛红包', '天天爆红包', '减配送费', '满减优惠', '首次光顾减', '下单返红包', '特价商品', '店铺红包'];
const FILTER_FEATURE = ['蜂鸟准时达', '到店自取', '品牌商家', '新店', '跨天预订', '线上开票', '先享后付', '透明餐厅'];

function passOpt(shop: TbShop, opt: string, avg: number): boolean {
  switch (opt) {
    case '30分钟内': return shop.deliveryMinutes <= 30;
    case '40分钟内': return shop.deliveryMinutes <= 40;
    case '50分钟内': return shop.deliveryMinutes <= 50;
    case '60分钟内': return shop.deliveryMinutes <= 60;
    case '1km内': return shop.distanceKm <= 1;
    case '2km内': return shop.distanceKm <= 2;
    case '3km内': return shop.distanceKm <= 3;
    case '5km内': return shop.distanceKm <= 5;
    case '减配送费': return shop.deliveryFeeOrig > shop.deliveryFee;
    case '满减优惠': return shop.promos.length > 0;
    case '店铺红包': return !shop.shopCoupon.claimed;
    case '到店自取': return shop.supportsPickup;
    case '品牌商家': return parseInt(shop.monthlySales, 10) >= 1000;
    case '透明餐厅': return shop.features.includes('明厨亮灶');
    case '线上开票': return shop.features.includes('极速开票');
    default: return true; // 其余为展示型条件,不裁剪
  }
}

/** 人均价双头滑杆(PointerEvent 拖动;轨道点击=action) */
function PriceSlider({ range, onChange }: { range: [number, number]; onChange: (v: [number, number]) => void }) {
  const { bindTap } = useTbsgGestures();
  const trackRef = useRef<HTMLDivElement>(null);
  const MAX = 120;

  const posToValue = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round((ratio * MAX) / 5) * 5;
  };
  const moveNearest = (clientX: number) => {
    const v = posToValue(clientX);
    const [lo, hi] = range;
    if (Math.abs(v - lo) <= Math.abs(v - hi)) onChange([Math.min(v, hi), hi]);
    else onChange([lo, Math.max(v, lo)]);
  };
  const dragHandle = (which: 0 | 1) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const onMove = (ev: PointerEvent) => {
      const v = posToValue(ev.clientX);
      if (which === 0) onChange([Math.min(v, range[1]), range[1]]);
      else onChange([range[0], Math.max(v, range[0])]);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const pct = (v: number) => `${(v / MAX) * 100}%`;

  return (
    <div className="px-1">
      <div className="flex justify-between text-[14px] font-semibold text-[#1A1A1A]">
        <span>¥{range[0]}</span>
        <span>¥{range[1]}{range[1] >= MAX ? '+' : ''}</span>
      </div>
      <div
        ref={trackRef}
        {...bindTap<HTMLDivElement>({ kind: 'action', id: 'channel.filter.priceRange' }, {
          onTrigger: () => {},
          beforeTrigger: (e) => moveNearest((e as React.MouseEvent<HTMLDivElement>).clientX),
        })}
        className="relative h-8 mt-1 cursor-pointer"
      >
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] rounded bg-[#F5D8C4]" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded bg-[#ED6C2C]"
          style={{ left: pct(range[0]), width: `calc(${pct(range[1])} - ${pct(range[0])})` }}
        />
        {[0, 1].map((which) => (
          <div
            key={which}
            onPointerDown={dragHandle(which as 0 | 1)}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-[#ED6C2C] flex items-center justify-center touch-none"
            style={{ left: pct(range[which]) }}
          >
            <span className="text-[#ED6C2C] text-[10px]">‖</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChannelFoodPage() {
  const { bindTap, bindBack, back } = useTbsgGestures();
  const s = useAppStrings(strings, stringsEn);
  const [sp, setSp] = useSearchParams();
  const panel = sp.get('panel');

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const coupons = useTbsgStore((st) => st.coupons);
  const claimNightCoupons = useTbsgStore((st) => st.claimNightCoupons);
  const claimCoupon = useTbsgStore((st) => st.claimCoupon);

  const [cat, setCat] = useState('夜宵精选');
  const [sort, setSort] = useState('default');
  const [quick, setQuick] = useState<string[]>([]);
  const [visible, setVisible] = useState(6);
  // 筛选面板:草稿态 + 应用态(点「查看」才生效)
  const [draftOpts, setDraftOpts] = useState<string[]>([]);
  const [draftRange, setDraftRange] = useState<[number, number]>([0, 120]);
  const [appliedOpts, setAppliedOpts] = useState<string[]>([]);
  const [appliedRange, setAppliedRange] = useState<[number, number]>([0, 120]);

  const nightCoupons = useMemo(() => coupons.filter((c) => c.id.startsWith('night')), [coupons]);
  const allNightClaimed = nightCoupons.every((c) => c.status !== 'unclaimed');

  const avgPrice = useMemo(() => {
    const m = new Map<string, number>();
    for (const shop of shops) {
      const its = items.filter((i) => i.shopId === shop.id);
      m.set(shop.id, its.length ? its.reduce((a, i) => a + i.price, 0) / its.length : 0);
    }
    return m;
  }, [shops, items]);

  const list = useMemo(() => {
    const cats = CATS.find((c) => c.label === cat)?.cats ?? null;
    const passQuick = (x: TbShop, f: string) => (
      f === '堂食店' ? x.supportsPickup
        : f === '减配送费' ? x.deliveryFeeOrig > x.deliveryFee
          : Boolean(x.burstCoupon) // 天天爆红包
    );
    const arr = shops
      .filter((x) => x.type === 'restaurant')
      .filter((x) => (cats ? cats.includes(x.category) : true))
      .filter((x) => quick.every((f) => passQuick(x, f)))
      .filter((x) => appliedOpts.every((o) => passOpt(x, o, avgPrice.get(x.id) ?? 0)))
      .filter((x) => {
        const avg = avgPrice.get(x.id) ?? 0;
        return avg >= appliedRange[0] && (appliedRange[1] >= 120 || avg <= appliedRange[1]);
      });
    const sales = (x: TbShop) => parseInt(x.monthlySales, 10) || 0;
    switch (sort) {
      case 'sales': arr.sort((a, b) => sales(b) - sales(a)); break;
      case 'distance': arr.sort((a, b) => a.distanceKm - b.distanceKm); break;
      case 'rating': arr.sort((a, b) => b.rating - a.rating); break;
      case 'minorder': arr.sort((a, b) => a.minOrder - b.minOrder); break;
      case 'fastest': arr.sort((a, b) => a.deliveryMinutes - b.deliveryMinutes); break;
      case 'fee': arr.sort((a, b) => a.deliveryFee - b.deliveryFee); break;
      case 'priceAsc': arr.sort((a, b) => (avgPrice.get(a.id) ?? 0) - (avgPrice.get(b.id) ?? 0)); break;
      case 'priceDesc': arr.sort((a, b) => (avgPrice.get(b.id) ?? 0) - (avgPrice.get(a.id) ?? 0)); break;
      case 'general': arr.sort((a, b) => a.name.localeCompare(b.name, 'zh')); break;
      default: arr.sort((a, b) => b.rating - a.rating + (sales(b) - sales(a)) / 10000);
    }
    return arr;
  }, [shops, cat, quick, sort, appliedOpts, appliedRange, avgPrice]);

  const openPanel = (name: 'sort' | 'filter') => {
    if (name === 'filter') {
      setDraftOpts(appliedOpts);
      setDraftRange(appliedRange);
    }
    setSp((p) => { p.set('panel', name); return p; });
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '综合排序';

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8] relative">
      <TopBar title="美食|夜宵" titleLeft />
      {/* 搜索框 */}
      <div className="px-3 pb-2 bg-white shrink-0">
        <div
          {...bindTap<HTMLDivElement>('channel.search-open')}
          className="flex items-center h-9 rounded-lg bg-[#F3F4F6] px-3 cursor-pointer"
        >
          <IcSearch size={16} className="text-[#999999]" />
          <span className="flex-1 ml-2 text-[13px] text-[#999999] truncate">床单</span>
          <span className="h-7 px-3 rounded-md bg-[#ED6C2C] text-white text-[13px] font-semibold flex items-center">{s.search}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 夜市红包天天领 */}
        <div className="mx-3 mt-2 bg-white rounded-xl p-3">
          <div className="flex items-center">
            <span className="font-bold text-[16px] text-[#1A1A1A]">夜市红包天天领</span>
            <span className="ml-2 text-[11px] text-[#999999]">每晚8点</span>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.redpacket.claimAll' }, {
                onTrigger: () => {
                  if (allNightClaimed) { showToast('夜市红包已领取'); return; }
                  claimNightCoupons();
                  showToast('已领取3张夜市红包');
                },
              })}
              className={`ml-auto h-7 px-3 rounded-full text-[12px] font-semibold border-none cursor-pointer text-white ${allNightClaimed ? 'bg-[#F7C4A3]' : 'bg-gradient-to-r from-[#F53F3F] to-[#ED2F2F]'}`}
            >
              {allNightClaimed ? s.couponClaimed : s.claimAll}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2.5">
            {nightCoupons.map((c) => (
              <div key={c.id} className="rounded-lg bg-[#FDEFE7] text-center py-2">
                <div className="text-[11px] text-[#C4471F]">夜宵爆红包</div>
                <div className="text-[#F53F3F] font-bold text-[20px]">
                  <span className="text-[12px]">¥</span>{c.amount}
                </div>
                <div className="text-[11px] text-[#C4471F]">满{c.threshold}可用</div>
                <div className="mt-1.5 pt-1.5 border-t border-dashed border-[#F0CDB8]">
                  {c.status === 'unclaimed' ? (
                    <button
                      {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.redpacket.claimOne' }, {
                        params: { couponId: c.id },
                        onTrigger: () => { claimCoupon(c.id); showToast('已领取,可在红包卡券查看'); },
                      })}
                      className="w-full text-[11px] text-[#F53F3F] font-bold bg-transparent border-none cursor-pointer p-0"
                    >
                      立即领取
                    </button>
                  ) : (
                    <div className="text-[11px] text-[#999999]">已领取</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 品类icon条 */}
        <div className="flex gap-1 px-2 py-2 overflow-x-auto" data-scroll-container="foodcats" data-scroll-direction="horizontal">
          {CATS.map((c) => (
            <button
              key={c.label}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.category.select' }, {
                params: { cat: c.label },
                onTrigger: () => setCat(c.label),
              })}
              className="shrink-0 w-[64px] flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className={`w-11 h-11 rounded-full flex items-center justify-center text-[20px] ${cat === c.label ? 'bg-[#FFE9D9]' : 'bg-[#FFF6EE]'}`}>{c.icon}</span>
              <span className={`text-[12px] ${cat === c.label ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}>{c.label}</span>
            </button>
          ))}
        </div>

        {/* 排序/筛选条(纯文字胶囊,中间横滑,筛选贴右;避免换行) */}
        <div className="flex items-center gap-3 px-3.5 py-2 bg-[#F3F6F8] sticky top-0 z-10">
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.sortPanel.open' }, {
              onTrigger: () => openPanel('sort'),
            })}
            className={`shrink-0 flex items-center gap-0.5 text-[14px] bg-transparent border-none cursor-pointer p-0 ${sort !== 'default' || panel === 'sort' ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}
          >
            {sortLabel}
            {panel === 'sort' ? <IcUp size={13} /> : <IcDown size={13} />}
          </button>
          <div className="flex-1 min-w-0 overflow-x-auto" data-scroll-container="quickfilters" data-scroll-direction="horizontal">
            <div className="flex items-center gap-4 w-max">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f}
                  {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.quickFilter.toggle' }, {
                    params: { filter: f },
                    onTrigger: () => setQuick((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])),
                  })}
                  className={`shrink-0 whitespace-nowrap text-[14px] bg-transparent border-none cursor-pointer p-0 ${quick.includes(f) ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.filterPanel.open' }, {
              onTrigger: () => openPanel('filter'),
            })}
            className={`shrink-0 flex items-center gap-0.5 text-[14px] bg-transparent border-none cursor-pointer p-0 ${appliedOpts.length > 0 || panel === 'filter' ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}
          >
            筛选
            {panel === 'filter' ? <IcUp size={13} /> : <IcDown size={13} />}
          </button>
        </div>

        {/* 商家列表 */}
        <div className="px-3 py-1.5 flex flex-col gap-2 pb-4">
          {list.length === 0 && <EmptyState text="暂无符合条件的商家" />}
          {list.slice(0, visible).map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              items={items.filter((i) => i.shopId === shop.id).slice(0, 3)}
              shopBinding={bindTap<HTMLDivElement>('channel.shop-open', { params: { shopId: shop.id } })}
              itemBinding={() => bindTap<HTMLDivElement>('channel.shopitem-open', { params: { shopId: shop.id } })}
              moreBinding={bindTap<HTMLDivElement>('channel.shopmore-open', { params: { shopId: shop.id } })}
            />
          ))}
          {visible < list.length && (
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.list.scroll' }, {
                onTrigger: () => setVisible((v) => v + 6),
              })}
              className="h-10 rounded-xl bg-white text-[13px] text-[#666666] border-none cursor-pointer"
            >
              加载更多商家
            </button>
          )}
        </div>
      </div>

      {/* 排序下拉面板 */}
      {panel === 'sort' && (
        <div className="absolute inset-x-0 top-[92px] bottom-0 z-30 flex flex-col">
          <div className="bg-white rounded-b-2xl px-4 pb-1 max-h-[70%] overflow-y-auto" data-scroll-container="sortpanel" data-scroll-direction="vertical">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.sort.select' }, {
                  params: { sort: o.key },
                  onTrigger: () => { setSort(o.key); back(); },
                })}
                className={`w-full flex items-center h-11 text-[14px] bg-transparent border-none cursor-pointer text-left ${sort === o.key ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}
              >
                {o.label}
                {sort === o.key && <span className="ml-auto">✓</span>}
              </button>
            ))}
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.sortPanel.close' }, {
                onTrigger: () => back(),
              })}
              aria-label="收起"
              className="w-full h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#999999]"
            >
              <IcUp size={18} />
            </button>
          </div>
          <div {...bindBack<HTMLDivElement>()} className="flex-1 bg-black/50" />
        </div>
      )}

      {/* 筛选大面板 */}
      {panel === 'filter' && (
        <div className="absolute inset-x-0 top-[92px] bottom-0 z-30 flex flex-col">
          <div className="bg-white rounded-b-2xl flex flex-col max-h-[85%]">
            <div className="flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="filterpanel" data-scroll-direction="vertical">
              <div className="font-semibold text-[15px] text-[#1A1A1A]">速度</div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {FILTER_SPEED.map((o) => (
                  <button
                    key={o}
                    {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.filter.toggle' }, {
                      params: { opt: o },
                      onTrigger: () => setDraftOpts((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])),
                    })}
                    className={`h-9 rounded-lg text-[12px] border cursor-pointer ${draftOpts.includes(o) ? 'bg-[#FFF3EB] border-[#ED6C2C] text-[#ED6C2C]' : 'bg-[#F5F6F8] border-transparent text-[#1A1A1A]'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <div className="font-semibold text-[15px] text-[#1A1A1A] mt-4">优惠活动</div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {FILTER_PROMO.map((o) => (
                  <button
                    key={o}
                    {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.filter.toggle' }, {
                      params: { opt: o },
                      onTrigger: () => setDraftOpts((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])),
                    })}
                    className={`h-9 rounded-lg text-[12px] border cursor-pointer ${draftOpts.includes(o) ? 'bg-[#FFF3EB] border-[#ED6C2C] text-[#ED6C2C]' : 'bg-[#F5F6F8] border-transparent text-[#1A1A1A]'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <div className="font-semibold text-[15px] text-[#1A1A1A] mt-4">商家特色</div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {FILTER_FEATURE.map((o) => (
                  <button
                    key={o}
                    {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.filter.toggle' }, {
                      params: { opt: o },
                      onTrigger: () => setDraftOpts((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o])),
                    })}
                    className={`h-9 rounded-lg text-[12px] border cursor-pointer ${draftOpts.includes(o) ? 'bg-[#FFF3EB] border-[#ED6C2C] text-[#ED6C2C]' : 'bg-[#F5F6F8] border-transparent text-[#1A1A1A]'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <div className="font-semibold text-[15px] text-[#1A1A1A] mt-4 mb-1">人均价筛选</div>
              <PriceSlider range={draftRange} onChange={setDraftRange} />
              <div className="h-3" />
            </div>
            <div className="flex gap-3 px-4 py-3 shrink-0 border-t border-[#F3F4F6]">
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.filter.clear' }, {
                  onTrigger: () => { setDraftOpts([]); setDraftRange([0, 120]); },
                })}
                className="flex-1 h-11 rounded-full bg-[#FFF3EB] text-[#ED6C2C] text-[15px] font-semibold border-none cursor-pointer"
              >
                清空
              </button>
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'channel.filter.apply' }, {
                  onTrigger: () => {
                    setAppliedOpts(draftOpts);
                    setAppliedRange(draftRange);
                    back();
                  },
                })}
                className="flex-[2] h-11 rounded-full bg-[#ED6C2C] text-white text-[15px] font-semibold border-none cursor-pointer"
              >
                查看
              </button>
            </div>
          </div>
          <div {...bindBack<HTMLDivElement>()} className="flex-1 bg-black/50" />
        </div>
      )}
    </div>
  );
}
