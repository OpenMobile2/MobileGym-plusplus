import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { pickImages } from '@/os/albumBridge';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Price, Countdown, useToast, NOT_OPEN, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { HOME_CATEGORIES, CATEGORY_TAXONOMY, groupTabsOf, subsOfGroup } from '../constants';
import { IcSearch, IcCamera, IcBell, IcCoins } from '../res/icons';

export default function HomePage() {
  const { bindTap } = useVipshopGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const cat = searchParams.get('cat') || 'recommend';
  const isRecommend = cat === 'recommend';
  const [group, setGroup] = useState('精选分类');
  const [toast, showToast] = useToast();

  const items = useVipshopStore((s) => s.items);
  const brands = useVipshopStore((s) => s.brands);
  const claimCoupon = useVipshopStore((s) => s.claimCoupon);
  const checkIn = useVipshopStore((s) => s.checkIn);
  const lastCheckIn = useVipshopStore((s) => s.session.lastCheckIn);

  const todayKey = (() => { const d = TimeService.getDate(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; })();
  const checkedIn = lastCheckIn === todayKey;
  const onCheckIn = () => {
    const earned = checkIn();
    showToast(earned > 0 ? `签到成功,+${earned} 唯品币` : '今日已签到,明天再来~');
  };

  const selectCat = (id: string) => { setGroup('精选分类'); setSearchParams((p) => { p.set('cat', id); return p; }, { replace: true }); };

  const catItems = useMemo(() => (isRecommend ? items : items.filter((i) => i.category === cat)), [items, cat, isRecommend]);
  const flashItems = useMemo(() => items.filter((i) => i.discountText <= '3.9折').slice(0, 2), [items]);
  const dealItems = useMemo(() => items.filter((i) => i.stockTight || i.discountText <= '3.8折').slice(0, 8), [items]);
  const topBrand = brands[0];
  const circleSubs = subsOfGroup(cat, group);
  const subImg = (sub: string) =>
    items.find((i) => i.category === cat && i.subCategory === sub)?.image
    ?? items.find((i) => i.category === cat)?.image ?? items[0]?.image ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* 顶栏:粉渐变 + 品牌特卖 + 签到/铃铛 + 搜索 + 品类条 */}
      <div className="shrink-0" style={{ background: 'linear-gradient(180deg,#FCD9EC,#F5F5F5)' }}>
        <div className="flex items-center px-3 pt-2 gap-1.5">
          <span className="text-[18px]">🐰</span>
          <span className="text-[17px] font-bold text-[#222222]">品牌特卖<span className="text-[13px] font-normal"> · 100%正品</span></span>
          <span className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'home.checkin.submit' }, { onTrigger: onCheckIn })}
            className="h-8 px-2 rounded-full border-none cursor-pointer text-[10px] flex items-center gap-0.5"
            style={checkedIn ? { background: VIP.gold, color: '#7A4A12' } : { background: VIP.primary, color: '#fff' }}
          >
            {checkedIn ? <><IcCoins size={12} />领币</> : '签到'}
          </button>
          <button {...bindTap('home.message-open')} className="bg-transparent border-none cursor-pointer relative" aria-label="消息">
            <IcBell size={22} className="text-[#222222]" />
            <span className="absolute top-0 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: VIP.red }} />
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 pt-1.5 pb-1">
          <div {...bindTap('home.search-open')} className="flex-1 h-9 bg-white rounded-full flex items-center px-3 gap-1.5 cursor-pointer">
            <IcSearch size={15} className="text-[#888888]" />
            <span className="text-[13px] text-[#666666]">面膜爆款补水</span>
            <span className="text-[9px] text-white rounded px-1 leading-4" style={{ background: VIP.primary }}>上升</span>
            <span className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'home.imageSearch.pick' }, {
                stopPropagation: true,
                onTrigger: () => {
                  // 拍照/图片搜索走系统相册选图(albumBridge → MediaService)
                  void pickImages({ multiple: false }).then((r) => {
                    if (r.cancelled || r.selected.length === 0) return;
                    showToast('已选择图片,正在为你识别');
                  });
                },
              })}
              className="bg-transparent border-none cursor-pointer p-0"
            >
              <IcCamera size={17} className="text-[#888888]" />
            </button>
            <span className="text-[13px] font-medium text-[#222222] pl-1 border-l border-[#EEE]">搜索</span>
          </div>
        </div>
        <div className="flex overflow-x-auto no-scrollbar px-2 pb-1" data-scroll-container="home-cats" data-scroll-direction="horizontal">
          {HOME_CATEGORIES.map((c) => {
            const on = c.id === cat;
            return (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'home.category.select.target' }, { params: { target: c.id }, onTrigger: () => selectCat(c.id) })}
                className={`shrink-0 px-3 py-1 bg-transparent border-none cursor-pointer ${on ? 'text-[18px] font-bold' : 'text-[15px] text-[#333333]'}`}
                style={on ? { color: '#222' } : undefined}
              >
                {c.label}
                {on && <span className="block h-1 w-5 mx-auto mt-0.5 rounded-full" style={{ background: VIP.primary }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#F5F5F5]" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {isRecommend ? (
          <>
            {/* 限时秒杀 + 大牌闪降:两卡并排 */}
            <div className="flex gap-2 px-2 pt-2">
              <div {...bindTap('home.flash-open')} className="flex-1 bg-white rounded-lg p-2 cursor-pointer">
                {/* 标题 shrink-0 + nowrap:倒计时占宽后曾把「限时秒杀」挤成「限时秒/杀」两行 */}
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[15px] font-bold text-[#222222] shrink-0 whitespace-nowrap">限时秒杀</span>
                  <span className="min-w-0 overflow-hidden"><Countdown endsAt={topBrand?.endsAt ?? 0} /></span>
                  <span className="text-[12px] text-[#888888] shrink-0">›</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {flashItems.map((it) => (
                    <div key={it.id} className="flex-1 min-w-0">
                      <Img src={it.image} className="w-full aspect-[3/4] rounded object-cover" />
                      <div className="text-center mt-0.5"><Price value={it.price} size="s" /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div {...bindTap('home.event-open', { params: { id: topBrand?.id ?? '' } })} className="flex-1 bg-white rounded-lg p-2 cursor-pointer">
                <div className="flex items-center gap-1">
                  <span className="text-[15px] font-bold text-[#222222]">大牌闪降</span>
                  <span className="text-[11px] ml-auto" style={{ color: VIP.primary }}>5折封顶 ›</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {items.slice(4, 6).map((it) => (
                    <div key={it.id} className="flex-1 min-w-0">
                      <Img src={it.image} className="w-full aspect-[3/4] rounded object-cover" />
                      <div className="text-center text-[11px] text-[#888888] truncate mt-0.5">{it.brandName}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 今日特卖 · 爆款抢先购 */}
            <div className="bg-white mx-2 mt-2 rounded-lg p-2.5">
              <div className="flex items-center">
                <span className="text-[15px] font-bold text-[#222222]">今日特卖</span>
                <span className="text-[13px] ml-1" style={{ color: VIP.red }}>🔥爆款抢先购</span>
                <span className="flex-1" />
                <span {...bindTap('home.flash-open')} className="text-[12px] text-[#888888] cursor-pointer">更多 ›</span>
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
                {dealItems.map((it) => (
                  <div key={it.id} {...bindTap('home.item-open', { params: { id: it.id } })} className="shrink-0 w-[76px] cursor-pointer">
                    <Img src={it.image} className="w-[76px] h-[100px] rounded object-cover" />
                    <div className="mt-1 flex items-center rounded overflow-hidden" style={{ background: VIP.ctaYellow }}>
                      <span className="text-[9px] text-[#222] px-0.5">特卖</span>
                      <span className="text-[11px] font-bold text-[#222] pr-1">¥{it.price}</span>
                    </div>
                    <div className="text-[10px] text-[#888888] mt-0.5 truncate">60天低价</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 省5元免邮券 */}
            <button
              {...bindTap(
                { kind: 'action', id: 'home.coupon.claim' },
                { onTrigger: () => { claimCoupon('免邮券', 5, '满5元可用'); showToast('免邮券已领取'); } },
              )}
              className="mx-2 mt-2 w-[calc(100%-16px)] rounded-lg px-3 py-2.5 flex items-center gap-2 bg-white border cursor-pointer"
              style={{ borderColor: VIP.red }}
            >
              <span className="text-[16px] font-bold" style={{ color: VIP.red }}>省 5 元</span>
              <div className="text-left flex-1">
                <div className="text-[13px] font-semibold text-[#222222]">送你一张免邮券</div>
                <div className="text-[10px] text-[#888888]">满5元可用,领取后72小时内有效</div>
              </div>
              <span className="text-[13px] text-white rounded px-3 py-1" style={{ background: VIP.ctaBlack }}>立即领取</span>
            </button>

            {/* 超V年卡 */}
            <button
              {...bindTap({ kind: 'action', id: 'home.svipBanner.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="mx-2 mt-2 w-[calc(100%-16px)] rounded-lg px-3 py-2 flex items-center gap-2 border-none cursor-pointer"
              style={{ background: 'linear-gradient(90deg,#FBEAD2,#F6D9AE)' }}
            >
              <span className="text-[17px] font-bold text-[#7A4A12] shrink-0">¥30</span>
              <span className="text-[13px] text-[#7A4A12] flex-1 min-w-0 text-left truncate">超V年卡限时直降 再送券</span>
              <span className="text-[13px] text-white rounded px-3 py-1 shrink-0 whitespace-nowrap" style={{ background: VIP.ctaBlack }}>立即开通</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 pt-3 pb-1.5">
              <span className="text-[15px] font-bold text-[#222222]">为你推荐</span>
              <span className="text-[11px] text-[#888888]">· 好物随心选</span>
            </div>
            <ItemGrid items={catItems} bindingOf={(it) => bindTap('home.item-open', { params: { id: it.id } })} />
          </>
        ) : (
          <>
            {/* 品类模式:精选分类分组 tab + 二级分类圈 + 商品流 */}
            <div className="bg-white flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
              {groupTabsOf(cat).map((g) => {
                const on = g === group;
                return (
                  <button
                    key={g}
                    {...bindTap(
                      { kind: 'action', id: 'home.categoryGroup.select.target' },
                      { params: { target: g }, onTrigger: () => setGroup(g) },
                    )}
                    className="shrink-0 text-[13px] rounded px-3 py-1.5 border-none cursor-pointer"
                    style={on ? { color: VIP.primary, background: '#FDECF5', fontWeight: 600, border: `1px solid ${VIP.primary}` } : { color: '#666', background: '#F5F5F5' }}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
            {/* 二级分类圈(商品图 + 名称;随分组 tab 同步切换) */}
            <div className="bg-white grid grid-cols-5 gap-y-3 pt-1 pb-3">
              {circleSubs.map((sub) => (
                <button
                  key={sub}
                  {...bindTap('home.category-open', { params: { id: cat, sub } })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <Img src={subImg(sub)} className="w-12 h-12 rounded-full object-cover" style={{ border: '1px solid #F0F0F0' }} />
                  <span className="text-[11px] text-[#444444]">{sub}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 px-2 pb-1">
              <span className="text-[14px] font-bold text-[#222222]">{CATEGORY_TAXONOMY[cat]?.label ?? ''}精选</span>
            </div>
            <ItemGrid items={catItems} bindingOf={(it) => bindTap('home.item-open', { params: { id: it.id } })} />
          </>
        )}
        {catItems.length === 0 && <div className="text-center text-[13px] text-[#888888] py-10">该品类暂无商品</div>}
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
