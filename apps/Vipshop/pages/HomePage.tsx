import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Price, DiscountTag, Countdown, useToast, NOT_OPEN, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { HOME_CATEGORIES, KINGKONG_GRID, subsOf } from '../constants';
import { IcSearch, IcCamera, IcBell, IcFlash, IcCrown } from '../res/icons';

export default function HomePage() {
  const { bindTap } = useVipshopGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get('cat') || 'recommend';
  const sub = searchParams.get('sub') || '全部';
  const selectCat = (id: string) => setSearchParams((p) => { p.set('cat', id); p.delete('sub'); return p; }, { replace: true });
  const selectSub = (v: string) => setSearchParams((p) => { p.set('sub', v); return p; }, { replace: true });
  const [toast, showToast] = useToast();

  const items = useVipshopStore((s) => s.items);
  const brands = useVipshopStore((s) => s.brands);

  const isRecommend = cat === 'recommend';
  const subTabs = isRecommend ? [] : subsOf(cat);
  const feed = isRecommend
    ? items
    : items.filter((i) => i.category === cat && (sub === '全部' || i.subCategory === sub));
  const flashItems = items.filter((i) => i.stockTight || i.discountText <= '3.8折').slice(0, 6);
  const topBrand = brands[0];

  return (
    <div className="flex flex-col h-full">
      {/* 顶栏:粉渐变 + 搜索 */}
      <div className="shrink-0" style={{ background: 'linear-gradient(180deg,#FBDCEC,#F5F5F5)' }}>
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <div
            {...bindTap('home.search-open')}
            className="flex-1 h-8 bg-white rounded-full flex items-center px-3 gap-1.5 cursor-pointer"
          >
            <IcSearch size={15} className="text-[#888888]" />
            <span className="text-[12px] text-[#BBBBBB]">雪纺连衣裙</span>
            <span className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'home.camera.disabled' }, { onTrigger: () => showToast(NOT_OPEN), stopPropagation: true })}
              className="bg-transparent border-none cursor-pointer p-0"
            >
              <IcCamera size={16} className="text-[#888888]" />
            </button>
          </div>
          <button
            {...bindTap('home.message-open')}
            className="bg-transparent border-none cursor-pointer relative"
            aria-label="消息"
          >
            <IcBell size={22} className="text-[#222222]" />
          </button>
        </div>
        {/* 顶部品类 */}
        <div className="flex overflow-x-auto no-scrollbar px-2 gap-1" data-scroll-container="home-cats" data-scroll-direction="horizontal">
          {HOME_CATEGORIES.map((c) => {
            const on = c.id === cat;
            return (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'home.category.select.target' }, { params: { target: c.id }, onTrigger: () => selectCat(c.id) })}
                className={`shrink-0 px-3 py-1.5 text-[14px] bg-transparent border-none cursor-pointer ${on ? 'font-semibold' : 'text-[#666666]'}`}
                style={on ? { color: VIP.primary } : undefined}
              >
                {c.label}
                {on && <span className="block h-0.5 w-5 mx-auto mt-0.5 rounded-full" style={{ background: VIP.primary }} />}
              </button>
            );
          })}
        </div>
        {/* 二级智能分类(选中非"推荐"一级时出现) */}
        {subTabs.length > 0 && (
          <div className="flex overflow-x-auto no-scrollbar px-2 pb-1.5 gap-1 bg-white/60" data-scroll-container="home-subs" data-scroll-direction="horizontal">
            {subTabs.map((sc) => {
              const on = sc === sub;
              return (
                <button
                  key={sc}
                  {...bindTap({ kind: 'action', id: 'home.category.select.target' }, { params: { target: sc }, onTrigger: () => selectSub(sc) })}
                  className={`shrink-0 px-2.5 py-1 text-[12px] rounded-full border-none cursor-pointer ${on ? 'font-semibold' : 'text-[#888888]'}`}
                  style={on ? { color: VIP.primary, background: '#FDECF5' } : { background: 'transparent' }}
                >
                  {sc}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {/* 以下区块(金刚区/超V/秒杀/专场卡)仅"推荐"页展示 —— 非推荐品类tab只保留商品流(gate6 走查二轮) */}
        {isRecommend && (
        <>
        {/* 金刚区(每格 → 该一级品类页;圆圈放该品类商品图) */}
        <div className="bg-white grid grid-cols-4 gap-y-3 py-3">
          {KINGKONG_GRID.map((k) => {
            const kImg = items.find((i) => i.category === k.id)?.image;
            return (
              <button
                key={k.id}
                {...bindTap('home.category-open', { params: { id: k.id } })}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                {kImg ? (
                  <Img src={kImg} className="w-10 h-10 rounded-full object-cover border" style={{ borderColor: '#F5D5E6' }} />
                ) : (
                  <span className="w-10 h-10 rounded-full" style={{ background: k.color }} />
                )}
                <span className="text-[11px] text-[#666666]">{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* 超V横幅 */}
        <button
          {...bindTap({ kind: 'action', id: 'home.svipBanner.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mx-2 mt-2 w-[calc(100%-16px)] rounded-lg p-2.5 flex items-center gap-2 border-none cursor-pointer"
          style={{ background: 'linear-gradient(90deg,#3a2a1a,#141414)' }}
        >
          <IcCrown size={18} className="text-[#F4D58D]" />
          <span className="text-[13px] text-[#F4D58D] font-semibold">开通超级VIP</span>
          <span className="text-[11px] text-[#C9A063]">全场折上9.5折 · 预计年省¥1200</span>
          <span className="flex-1" />
          <span className="text-[11px] text-[#141414] bg-[#F4D58D] rounded-full px-2 py-0.5">立即开通</span>
        </button>

        {/* 限时秒杀入口 */}
        <div
          {...bindTap('home.flash-open')}
          className="mx-2 mt-2 bg-white rounded-lg p-2.5 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <IcFlash size={16} style={{ color: VIP.red }} />
            <span className="text-[15px] font-bold" style={{ color: VIP.red }}>限时秒杀</span>
            <span className="text-[11px] text-[#888888]">24小时不间断</span>
            <span className="flex-1" />
            <span className="text-[11px] text-[#888888]">距结束</span>
            <Countdown endsAt={brands[0]?.endsAt ?? 0} />
            <span className="text-[12px] text-[#888888]">›</span>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
            {flashItems.map((it) => (
              <div key={it.id} className="shrink-0 w-16">
                <Img src={it.image} className="w-16 h-16 rounded object-cover" />
                <Price value={it.price} size="s" />
              </div>
            ))}
          </div>
        </div>

        {/* 大牌闪降/专场卡 */}
        {topBrand && (
          <div
            {...bindTap('home.event-open', { params: { id: topBrand.id } })}
            className="mx-2 mt-2 rounded-lg overflow-hidden cursor-pointer relative"
          >
            <Img src={topBrand.banner} className="w-full h-28 object-cover" />
            <div className="absolute inset-0 flex flex-col justify-center px-4" style={{ background: 'linear-gradient(90deg,rgba(228,0,127,0.75),rgba(122,60,255,0.35))' }}>
              <span className="text-white text-[16px] font-bold">{topBrand.name} · 超级大牌日</span>
              <span className="text-white text-[12px] mt-0.5">{topBrand.slogan}</span>
              <span className="mt-1 inline-block w-fit text-[12px] text-[#E4007F] bg-white rounded-full px-2 py-0.5 font-semibold">{topBrand.discountText}</span>
            </div>
          </div>
        )}

        {/* 今日特卖标题(仅推荐页) */}
        <div className="mt-2 px-2 pt-1 pb-1">
          <span className="text-[15px] font-bold text-[#222222]">今日特卖</span>
          <span className="text-[12px] text-[#888888] ml-2">正品保障 · 低至2折</span>
        </div>
        </>
        )}

        {/* 瀑布流(推荐=全部;品类tab=纯商品流) */}
        {!isRecommend && <div className="h-2" />}
        <ItemGrid
          items={feed}
          bindingOf={(it) => bindTap('home.item-open', { params: { id: it.id } })}
        />
        {feed.length === 0 && <div className="text-center text-[13px] text-[#888888] py-10">该品类暂无商品</div>}
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
