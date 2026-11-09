import React, { useMemo, useRef, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price, showToast } from '../components/common';
import { ShopCard } from '../components/ShopCard';
import { IcCamera, IcDown, IcPin, IcRight } from '../res/icons';
import type { TbShop } from '../types';

const HOME_TABS: { label: string; cats: string[] | null }[] = [
  { label: '全部', cats: null },
  { label: '龙虾烧烤', cats: ['bbqshop', 'seafood'] },
  { label: '奶茶果汁', cats: ['milktea'] },
  { label: '炸鸡炸串', cats: ['friedchicken', 'skewer'] },
  { label: '轻食沙拉', cats: ['salad'] },
];

const QUICK_FILTERS = ['满35减7', '堂食店', '免配送费', '品牌商家'];

function passQuick(shop: TbShop, f: string): boolean {
  switch (f) {
    case '满35减7': return shop.promos.some((p) => p.full <= 35);
    case '堂食店': return shop.supportsPickup;
    case '免配送费': return shop.deliveryFee === 0;
    case '品牌商家': return parseInt(shop.monthlySales, 10) >= 1000;
    default: return true;
  }
}

/** 金刚区单格:路由映射用字面量绑定(合同:绑定点字符串字面量) */
function KingkongCell({ entry, notOpenText }: {
  entry: { id: string; label: string; route: string | null };
  notOpenText: string;
}) {
  const { bindTap } = useTbsgGestures();
  const binding =
    entry.id === 'kk_food' ? bindTap<HTMLButtonElement>('home.channel.food-open')
      : entry.id === 'kk_market' ? bindTap<HTMLButtonElement>('home.channel.market-open')
        : entry.id === 'kk_medicine' ? bindTap<HTMLButtonElement>('home.channel.medicine-open')
          : entry.id === 'kk_fruit' ? bindTap<HTMLButtonElement>('home.channel.fruit-open')
            : entry.id === 'kk_hot' ? bindTap<HTMLButtonElement>('home.kingkong.hotdeals-open')
              : bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.kingkong.stub' }, {
                params: { entry: entry.id },
                onTrigger: () => showToast(notOpenText),
              });
  return (
    <button
      {...binding}
      className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1"
    >
      <AppImg src={`/@app-assets/TaobaoShangou/kingkong/${entry.id}.jpg`} className="w-11 h-11 rounded-xl object-cover" />
      <span className="text-[11px] text-[#1A1A1A]">{entry.label}</span>
    </button>
  );
}

export default function HomePage() {
  const { bindTap } = useTbsgGestures();
  const s = useAppStrings(strings, stringsEn);
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const kingkong = useTbsgStore((st) => st.kingkong);
  const poi = useTbsgStore((st) => st.locationPoi);

  const [tab, setTab] = useState('全部');
  const [filters, setFilters] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [kkPage, setKkPage] = useState(0);
  const kkRef = useRef<HTMLDivElement>(null);

  const baseList = useMemo(
    () => shops.filter((x) => x.type === 'restaurant').sort((a, b) => b.rating - a.rating).slice(0, 12),
    [shops],
  );
  const list = useMemo(() => {
    const cats = HOME_TABS.find((t) => t.label === tab)?.cats ?? null;
    return baseList
      .filter((x) => !dismissed.includes(x.id))
      .filter((x) => (cats ? cats.includes(x.category) : true))
      .filter((x) => filters.every((f) => passQuick(x, f)));
  }, [baseList, tab, filters, dismissed]);

  /** 超抢手横条:大牌低价商品(qa:R1) */
  const hotItems = useMemo(() => {
    const pick = (sid: string) => items
      .filter((i) => i.shopId === sid)
      .sort((a, b) => b.monthlySales - a.monthlySales)[0];
    return [pick('s_jiliu'), pick('s_guoyin')].filter(Boolean);
  }, [items]);
  const shopName = (sid: string) => shops.find((x) => x.id === sid)?.name ?? '';

  const scrollKk = (page: number) => {
    const el = kkRef.current;
    if (el) el.scrollTo({ left: page * el.clientWidth, behavior: 'smooth' });
    setKkPage(page);
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 地址栏 */}
      <div className="px-3 pt-1 pb-2 bg-[#F3F6F8]">
        <button
          {...bindTap<HTMLButtonElement>('home.address-open', { params: { from: 'home' } })}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer max-w-[75%]"
        >
          <span className="text-[10px] px-1 py-[1px] rounded border border-[#ED6C2C] text-[#ED6C2C] bg-[#FFF3EB] shrink-0">常用</span>
          <IcPin size={15} className="text-[#1A1A1A] shrink-0" />
          <span className="font-semibold text-[16px] text-[#1A1A1A] truncate">{poi}</span>
          <IcDown size={14} className="text-[#1A1A1A] shrink-0" />
        </button>
        {/* 搜索框 */}
        <div
          {...bindTap<HTMLDivElement>('home.search-open')}
          className="mt-2 flex items-center h-10 rounded-full border-2 border-[#ED6C2C] bg-white pl-1 pr-1 cursor-pointer"
        >
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.scan.stub' }, {
              stopPropagation: true,
              onTrigger: () => showToast(s.notOpen),
            })}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#ED6C2C]"
            aria-label="扫一扫"
          >
            <IcCamera size={20} />
          </button>
          <span className="flex-1 text-[14px] text-[#999999] truncate">酸奶</span>
          <span className="h-8 px-4 rounded-full bg-gradient-to-r from-[#FF8A2A] to-[#ED6C2C] text-white text-[14px] font-semibold flex items-center">
            {s.search}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 金刚区(横滑两页) */}
        <div
          ref={kkRef}
          className="flex overflow-x-auto snap-x snap-mandatory"
          data-scroll-container="kingkong"
          data-scroll-direction="horizontal"
        >
          <div className="w-full shrink-0 snap-start grid grid-cols-5 gap-y-1 px-2">
            {kingkong.slice(0, 10).map((k) => (
              <KingkongCell key={k.id} entry={k} notOpenText={s.notOpen} />
            ))}
          </div>
          <div className="w-full shrink-0 snap-start grid grid-cols-5 gap-y-1 px-2">
            {kingkong.slice(10).map((k) => (
              <KingkongCell key={k.id} entry={k} notOpenText={s.notOpen} />
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-1 mt-1">
          {[0, 1].map((p) => (
            <button
              key={p}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.kingkong.page' }, {
                params: { page: p },
                onTrigger: () => scrollKk(p),
              })}
              aria-label={`第${p + 1}页`}
              className={`h-1 rounded-full border-none cursor-pointer p-0 ${kkPage === p ? 'w-4 bg-[#ED6C2C]' : 'w-1.5 bg-gray-300'}`}
            />
          ))}
        </div>

        {/* 超抢手(qa:R1) */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3">
          <div className="flex items-center">
            <span className="font-bold text-[17px] italic text-[#1A1A1A]">超抢手</span>
            <span className="ml-2 text-[10px] px-1.5 py-[2px] rounded bg-[#F53F3F] text-white">大牌低价 1份起送</span>
            <button
              {...bindTap<HTMLButtonElement>('home.hotdeals-open')}
              className="ml-auto flex items-center text-[12px] text-[#999999] bg-transparent border-none cursor-pointer"
            >
              更多<IcRight size={14} />
            </button>
          </div>
          <div className="flex gap-3 mt-2.5">
            {hotItems.map((it) => (
              <div
                key={it.id}
                {...bindTap<HTMLDivElement>('home.hotdeals-open')}
                className="flex-1 flex gap-2 cursor-pointer min-w-0"
              >
                <AppImg src={it.image} className="w-[68px] h-[68px] rounded-lg object-cover shrink-0" />
                <div className="min-w-0 flex flex-col">
                  <div className="text-[12px] text-[#1A1A1A] truncate">
                    <span className="font-semibold">{shopName(it.shopId)}</span>
                  </div>
                  <div className="text-[12px] text-[#666666] truncate">{it.name}</div>
                  <div className="mt-auto flex items-center gap-1">
                    <Price value={it.price} size={16} />
                    <span className="ml-auto w-7 h-7 rounded-full bg-[#F53F3F] text-white text-[11px] font-bold flex items-center justify-center">抢</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 分类tab胶囊 */}
        <div className="flex gap-2 px-3 mt-3 overflow-x-auto" data-scroll-container="categorytabs" data-scroll-direction="horizontal">
          {HOME_TABS.map((t) => (
            <button
              key={t.label}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.categoryTab.select' }, {
                params: { tab: t.label },
                onTrigger: () => setTab(t.label),
              })}
              className={`shrink-0 h-9 px-3.5 rounded-lg text-[13px] border cursor-pointer ${
                tab === t.label
                  ? 'bg-[#FFF3EB] border-[#ED6C2C] text-[#ED6C2C] font-semibold'
                  : 'bg-white border-transparent text-[#1A1A1A]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 快捷筛选 */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-white mt-2 sticky top-0 z-10">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.quickFilter.toggle' }, {
                params: { filter: f },
                onTrigger: () => setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])),
              })}
              className={`text-[13px] bg-transparent border-none cursor-pointer p-0 ${
                filters.includes(f) ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 商家列表 */}
        <div className="px-3 py-2 flex flex-col gap-2 pb-4">
          {list.length === 0 && <EmptyState text="暂无符合条件的商家" />}
          {list.map((shop, idx) => (
            <React.Fragment key={shop.id}>
              <ShopCard
                shop={shop}
                shopBinding={bindTap<HTMLDivElement>('home.shop-open', { params: { shopId: shop.id } })}
                showDismiss
                onDismiss={() => setDismissed((prev) => [...prev, shop.id])}
              />
              {idx === 0 && (
                <button
                  {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'home.banner.stub' }, {
                    onTrigger: () => showToast(s.notOpen),
                  })}
                  className="relative w-full rounded-xl overflow-hidden border-none cursor-pointer p-0 bg-transparent"
                >
                  <AppImg src="/@app-assets/TaobaoShangou/banners/banner_night.jpg" className="w-full h-[72px] object-cover" />
                  <span className="absolute inset-0 flex items-center justify-between px-4">
                    <span className="text-white font-bold text-[16px] drop-shadow">夜宵拼团 烧烤5折起</span>
                    <span className="h-8 px-3 rounded-full bg-white/95 text-[#5B5BD6] text-[13px] font-semibold flex items-center">立即抢 &gt;</span>
                  </span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
