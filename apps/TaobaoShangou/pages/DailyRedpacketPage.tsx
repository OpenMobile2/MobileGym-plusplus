import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Price, showToast } from '../components/common';
import { IcPlus, IcRight, IcSearch } from '../res/icons';
import type { TbShop } from '../types';
import { useStatusBarBg } from '../statusbar';

/** 天天必爆 4 小券卡(IMG_6067) */
const BURST_CARDS: { big: string; sub: string; tag?: string }[] = [
  { big: '¥2', sub: '满30可用' },
  { big: '¥?', sub: '门槛随机' },
  { big: '¥18.8', sub: '门槛随机', tag: '随机' },
  { big: '¥25', sub: '惊喜好礼', tag: '夜宵' },
];

const SLOTS = ['11:00', '17:00', '19:00'];

/** 大额红包限时抢券卡(IMG_6067) */
const RUSH_COUPONS = [
  { amount: 22, threshold: 55 },
  { amount: 18, threshold: 45 },
];

/** 三张爆红包 chips(IMG_6068) */
const BURST_CHIPS = [
  { amount: 16, threshold: 70 },
  { amount: 9, threshold: 45 },
  { amount: 7, threshold: 35 },
];

const CAT_TABS: { label: string; cats: string[] | null }[] = [
  { label: '全部', cats: null },
  { label: '奶茶咖啡', cats: ['milktea', 'coffee'] },
  { label: '便当简餐', cats: ['cnfast', 'salad'] },
  { label: '汉堡披萨', cats: ['burger'] },
  { label: '粥食点心', cats: ['congee', 'dessert', 'cake'] },
];

const FILTER_CHIPS = ['大额红包商家', '免配送费', '品牌商家', '蜂鸟准时达'];

function passChip(shop: TbShop, f: string): boolean {
  switch (f) {
    case '大额红包商家': return shop.burstCoupon.amount >= 13;
    case '免配送费': return shop.deliveryFee === 0;
    case '品牌商家': return parseInt(shop.monthlySales, 10) >= 1000;
    default: return true; // 蜂鸟准时达:展示型条件
  }
}

export default function DailyRedpacketPage() {
  const { bindTap } = useTbsgGestures();
  useStatusBarBg('#E8322E');
  const s = useAppStrings(strings, stringsEn);

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const coupons = useTbsgStore((st) => st.coupons);
  const burstUsedToday = useTbsgStore((st) => st.burstUsedToday);
  const burstDaily = useTbsgStore((st) => st.burstDaily);

  const [slot, setSlot] = useState('11:00');
  const [kw, setKw] = useState('');
  const [catTab, setCatTab] = useState('全部');
  const [chips, setChips] = useState<string[]>([]);

  const claimedCount = useMemo(() => coupons.filter((c) => c.status === 'claimed').length, [coupons]);

  const list = useMemo(() => {
    const cats = CAT_TABS.find((t) => t.label === catTab)?.cats ?? null;
    const w = kw.trim();
    return shops
      .filter((x) => x.type === 'restaurant')
      .filter((x) => (w ? x.fullName.includes(w) : true))
      .filter((x) => (cats ? cats.includes(x.category) : true))
      .filter((x) => chips.every((f) => passChip(x, f)))
      .sort((a, b) => b.burstCoupon.amount - a.burstCoupon.amount)
      .slice(0, 10);
  }, [shops, kw, catTab, chips]);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]" data-status-bar-foreground="light">
      {/* 红色头部(IMG_6067) */}
      <div className="flex items-center px-4 h-12 shrink-0 bg-[#E8322E]">
        <span className="text-white font-bold text-[21px] italic">天天红包</span>
        <button
          {...bindTap<HTMLButtonElement>('redpacket.wallet-open')}
          className="ml-3 flex items-center text-white text-[15px] bg-transparent border-none cursor-pointer p-0"
        >
          我的 <span className="text-[#FFE14D] font-bold mx-0.5">{claimedCount}</span> 张红包
          <IcRight size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 天天必爆卡(红渐变续接头部) */}
        <div className="bg-gradient-to-b from-[#E8322E] to-[#F3F6F8] px-3 pt-1 pb-2">
          <div className="rounded-2xl bg-gradient-to-b from-[#FA5A4B] to-[#E8322E] p-3 border border-[#FF8A7A]">
            <div className="flex items-center justify-center gap-2">
              <span className="text-white font-bold text-[19px] italic">天天必爆</span>
              <span className="text-[#FFE14D] font-bold text-[26px] italic">18.8</span>
              <span className="text-white font-bold text-[19px] italic">下单更省</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {BURST_CARDS.map((c) => (
                <div key={c.big + c.sub} className="relative rounded-lg bg-gradient-to-b from-white to-[#FFE3DC] text-center py-2.5">
                  {c.tag && (
                    <span className="absolute right-0 top-0 text-[9px] px-1 rounded-bl-lg rounded-tr-lg bg-[#C4261D] text-white">{c.tag}</span>
                  )}
                  <div className="text-[#F53F3F] font-bold text-[19px] leading-tight">{c.big}</div>
                  <div className="text-[11px] text-[#C4471F] mt-0.5">{c.sub}</div>
                </div>
              ))}
            </div>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.daily.burst' }, {
                onTrigger: () => {
                  if (burstUsedToday) {
                    showToast('今日已爆,明天再来');
                    return;
                  }
                  burstDaily();
                  showToast('爆出红包!已放入券包');
                },
              })}
              className={`w-full h-11 mt-2.5 rounded-full text-[17px] font-bold border-none cursor-pointer ${
                burstUsedToday
                  ? 'bg-[#F7C4A3] text-white'
                  : 'bg-gradient-to-b from-[#FFF3D6] to-[#FFD98E] text-[#C4261D]'
              }`}
            >
              {burstUsedToday ? '今日已爆' : '免费爆1次'}
            </button>
          </div>
        </div>

        {/* 大额红包限时抢 */}
        <div className="mx-3 bg-white rounded-xl p-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[17px] text-[#1A1A1A]">大额红包<span className="text-[#F53F3F]">限时抢</span></span>
            {SLOTS.map((t) => (
              <button
                key={t}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.timeslot.select' }, {
                  params: { slot: t },
                  onTrigger: () => setSlot(t),
                })}
                className={`text-[14px] bg-transparent border-none cursor-pointer p-0 ${
                  slot === t ? 'text-[#F53F3F] font-bold border-b-2 border-[#F53F3F]' : 'text-[#666666]'
                }`}
              >
                {t}
                {slot === t && <span className="ml-0.5 text-[11px] font-normal">即将开抢</span>}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {RUSH_COUPONS.map((c) => (
              <button
                key={c.amount}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.rush.claim' }, {
                  onTrigger: () => showToast(`${slot}开抢,先逛逛`),
                })}
                className="flex rounded-xl overflow-hidden bg-[#F53F3F] border-none cursor-pointer p-0 text-left"
              >
                <span className="w-[55%] bg-white rounded-r-xl flex flex-col items-center justify-center py-2.5">
                  <span className="text-[#F53F3F] font-bold">
                    <span className="text-[13px]">¥</span>
                    <span className="text-[26px]">{c.amount}</span>
                  </span>
                  <span className="text-[11px] text-[#C4471F]">满{c.threshold}可用</span>
                </span>
                <span className="flex-1 flex flex-col items-center justify-center gap-1 px-1">
                  <span className="text-white text-[12px] font-semibold">惊喜爆红包</span>
                  <span className="text-white/80 text-[10px]">即将开抢</span>
                  <span className="text-[10px] px-1.5 py-[2px] rounded-full bg-white text-[#F53F3F] font-semibold">{slot}开抢</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 超值购卡(金卡) */}
        <div className="mx-3 mt-2 bg-white rounded-xl p-3">
          <div className="flex items-center">
            <span className="font-bold text-[17px] text-[#1A1A1A]">超值购卡</span>
            <span className="ml-2 text-[12px] text-[#666666]">购卡进店<span className="text-[#F53F3F]">爆涨更大</span></span>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.foodcard.stub' }, {
                onTrigger: () => showToast(s.notOpen),
              })}
              className="ml-auto flex items-center text-[12px] text-[#999999] bg-transparent border-none cursor-pointer p-0"
            >
              购买更多<IcRight size={14} />
            </button>
          </div>
          <div className="mt-2 rounded-xl bg-gradient-to-b from-[#FBEED9] to-[#F8DDB4] p-3">
            <div className="flex items-center">
              <div className="flex-1 text-center">
                <span className="text-[#8A5A16] font-bold"><span className="text-[13px]">¥</span><span className="text-[24px]">5</span><span className="text-[12px]">起</span> ×<span className="text-[20px]">6</span>张</span>
                <div className="text-[11px] text-[#8A5A16] mt-0.5">爆红包 | 可爆涨</div>
              </div>
              <span className="w-8 h-8 rounded-full bg-[#E9B84C] text-white text-[13px] font-bold flex items-center justify-center shrink-0">赠</span>
              <div className="flex-1 text-center">
                <span className="text-[#8A5A16] font-bold"><span className="text-[13px]">¥</span><span className="text-[24px]">3</span> ×<span className="text-[20px]">3</span>张</span>
                <div className="text-[11px] text-[#8A5A16] mt-0.5">学生专享 | 可爆涨</div>
              </div>
            </div>
            <div className="flex items-center mt-2.5">
              <span className="text-[14px] font-bold text-[#8A5A16]">👑 超级吃货卡 · 学生专享抽iphone</span>
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.foodcard.stub' }, {
                  onTrigger: () => showToast(s.notOpen),
                })}
                className="ml-auto h-8 px-3 rounded-full bg-gradient-to-r from-[#3B3020] to-[#5C4318] text-[#F6D9A0] text-[13px] font-bold border-none cursor-pointer"
              >
                ¥0.9 <span className="line-through text-[10px] opacity-70">¥30</span> 抢购
              </button>
            </div>
          </div>
          <div className="text-[10px] text-[#BBBBBB] mt-2">31天内有效 | 购买即视为同意 服务协议 超级吃货卡权益说明 相关协议</div>
        </div>

        {/* 搜索红包可用商家 */}
        <div className="mx-3 mt-2 bg-white rounded-xl p-3">
          <div className="flex items-center h-10 rounded-full bg-[#F3F4F6] pl-3 pr-1">
            <IcSearch size={16} className="text-[#999999] shrink-0" />
            <input
              {...bindTap<HTMLInputElement>({ kind: 'action', id: 'redpacket.shopsearch.input' }, { onTrigger: () => {} })}
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              placeholder="搜索红包可用商家"
              className="flex-1 ml-2 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
            />
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.shopsearch.input' }, {
                params: { value: kw },
                onTrigger: () => {},
              })}
              className="h-8 px-4 rounded-full bg-[#F53F3F] text-white text-[14px] font-semibold border-none cursor-pointer"
            >
              {s.search}
            </button>
          </div>
          {/* 三张爆红包 chips */}
          <div className="grid grid-cols-3 gap-2 mt-2.5">
            {BURST_CHIPS.map((c) => (
              <div key={c.amount} className="flex items-center rounded-lg border border-[#F5C1BC] bg-[#FFF7F5] px-2 py-1.5">
                <span className="text-[#F53F3F] font-bold shrink-0"><span className="text-[11px]">¥</span><span className="text-[20px]">{c.amount}</span></span>
                <span className="w-[1px] self-stretch bg-[#F5C1BC] mx-1.5 my-0.5" style={{ backgroundImage: 'linear-gradient(#F5C1BC 60%, transparent 40%)' }} />
                <span className="min-w-0">
                  <span className="block text-[11px] text-[#C4471F] font-semibold truncate">天天爆红包</span>
                  <span className="block text-[10px] text-[#C4471F] truncate">满{c.threshold}元可用</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 品类tab + 筛选chips */}
        <div className="sticky top-0 z-10 bg-[#F3F6F8] pt-1">
          <div className="flex gap-5 px-4 overflow-x-auto" data-scroll-container="cattabs" data-scroll-direction="horizontal">
            {CAT_TABS.map((t) => (
              <button
                key={t.label}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.filter.select' }, {
                  params: { filter: t.label },
                  onTrigger: () => setCatTab(t.label),
                })}
                className={`shrink-0 py-1.5 text-[15px] bg-transparent border-none cursor-pointer p-0 ${
                  catTab === t.label ? 'text-[#1A1A1A] font-bold border-b-2 border-[#F53F3F]' : 'text-[#666666]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 px-3 py-1.5 overflow-x-auto" data-scroll-container="filterchips" data-scroll-direction="horizontal">
            {FILTER_CHIPS.map((f) => (
              <button
                key={f}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'redpacket.filter.select' }, {
                  params: { filter: f },
                  onTrigger: () => setChips((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])),
                })}
                className={`shrink-0 h-8 px-3 rounded-lg text-[12px] border cursor-pointer ${
                  chips.includes(f) ? 'bg-[#FDEBE9] border-[#F53F3F] text-[#F53F3F] font-semibold' : 'bg-white border-transparent text-[#1A1A1A]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 红包可用商家列表 */}
        <div className="px-3 py-1 flex flex-col gap-2 pb-4">
          {list.length === 0 && (
            <div className="bg-white rounded-xl py-10 text-center text-[13px] text-[#999999]">暂无符合条件的商家</div>
          )}
          {list.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl p-3">
              <div
                {...bindTap<HTMLDivElement>('redpacket.shop-open', { params: { shopId: shop.id } })}
                className="flex items-center gap-2 cursor-pointer"
              >
                <AppImg src={shop.logo} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] text-[#1A1A1A] truncate">{shop.fullName}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5 truncate">
                    <span className="text-[#ED6C2C] font-semibold">{shop.rating}分</span>
                    <span className="ml-1.5">月售{shop.monthlySales}</span>
                    <span className="ml-1.5">起送¥{shop.minOrder}</span>
                    <span className="ml-1.5">{shop.deliveryMinutes}分钟 {shop.distanceKm}km</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2.5 overflow-x-auto" data-scroll-container="shopitems" data-scroll-direction="horizontal">
                {/* 爆红包竖卡 + 去使用 */}
                <div
                  {...bindTap<HTMLDivElement>('redpacket.shop-open', { params: { shopId: shop.id } })}
                  className="w-[86px] shrink-0 rounded-lg border border-[#F5C1BC] bg-gradient-to-b from-[#FDEBE9] to-white flex flex-col items-center pt-2 cursor-pointer overflow-hidden"
                >
                  <span className="text-[10px] px-1.5 py-[1px] rounded-full bg-[#FDEBE9] text-[#EB493B] border border-[#F5C1BC]">爆红包</span>
                  <div className="text-[#F53F3F] font-bold mt-1.5">
                    <span className="text-[12px]">¥</span>
                    <span className="text-[24px]">{shop.burstCoupon.amount}</span>
                  </div>
                  <span className="text-[10px] text-[#C4471F]">满{shop.burstCoupon.threshold}可用</span>
                  <span className="mt-auto w-full h-8 bg-[#F53F3F] text-white text-[12px] font-semibold flex items-center justify-center">{s.couponUse} &gt;</span>
                </div>
                {/* 商品横滑 */}
                {items
                  .filter((i) => i.shopId === shop.id)
                  .sort((a, b) => b.monthlySales - a.monthlySales)
                  .slice(0, 4)
                  .map((it) => (
                    <div
                      key={it.id}
                      {...bindTap<HTMLDivElement>('redpacket.item-open', { params: { shopId: shop.id } })}
                      className="w-[86px] shrink-0 cursor-pointer"
                    >
                      <AppImg src={it.image} className="w-[86px] h-[86px] rounded-lg object-cover" />
                      <div className="text-[11px] text-[#1A1A1A] truncate mt-1">{it.name}</div>
                      <div className="flex items-center">
                        <Price value={it.price} size={14} />
                        <span className="ml-auto w-5 h-5 rounded-full bg-[#ED6C2C] text-white flex items-center justify-center">
                          <IcPlus size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
