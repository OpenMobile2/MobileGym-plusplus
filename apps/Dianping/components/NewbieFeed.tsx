import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { NEWBIE_DEALS, NEWBIE_COUPONS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { dishImageUrl } from '../assets';

/** 新人福利频道内容(内嵌于首页顶部 Tab 之下,复用首页顶栏,对齐 dp_444) */
export function NewbieFeed() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, action } = useDianpingGestures();
  const shops = useDianpingStore((st) => st.shops);
  const showToast = useDianpingStore((st) => st.showToast);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});

  const deals = NEWBIE_DEALS.map((d) => ({ ...d, shop: shops.find((x) => x.id === d.shopId) }));
  const topDeals = deals.slice(0, 3);

  return (
    <div className="bg-[#FF6A2B] pb-3">
      {/* Banner */}
      <div className="px-3 pb-1 pt-2 text-center text-[24px] font-black italic tracking-tight text-white drop-shadow">
        新人专享福利 · 优惠尽享不停
      </div>

      {/* 新人特惠 首单必买(单份美食) */}
      <div className="mx-3 mt-1 rounded-[14px] bg-white p-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-black text-[#222]">新人特惠 首单必买</span>
          <span className="text-[12px] text-[#999]">抄底价团购在这里</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {topDeals.map((d) => (
            <button
              key={d.id}
              type="button"
              className="flex flex-col overflow-hidden rounded-[10px] border-none bg-[#FFF7F2] p-0 text-left cursor-pointer"
              {...(d.shop
                ? bindTap('food.shop-open', { params: { shopId: d.shopId } })
                : action('home.newbie.claim.action', () => showToast(s.notOpen)))}
            >
              <div className="h-[74px] w-full overflow-hidden bg-[#F0D9C8]" style={{ background: d.shop?.coverColor }}>
                {dishImageUrl(d.shopId, d.dishId) ? (
                  <img src={dishImageUrl(d.shopId, d.dishId)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="px-1.5 pb-1.5 pt-1">
                <div className="truncate text-[11px] font-medium text-[#333]">{d.title}</div>
                <div className="mt-0.5 flex items-baseline gap-0.5">
                  <span className="text-[10px] text-[#FF3B2F]">新人价</span>
                  <span className="text-[13px] font-bold text-[#FF3B2F]">¥{d.newPrice}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 新人福利券包(2 张) */}
      <div className="mx-3 mt-2 overflow-hidden rounded-[14px] bg-white">
        <div className="bg-gradient-to-r from-[#FF8A4C] to-[#FF6A2B] px-3 py-2">
          <span className="text-[15px] font-bold text-white">新人福利券包 · 每日必领</span>
        </div>
        <div className="flex gap-2 p-3">
          {NEWBIE_COUPONS.map((c) => {
            const got = claimed[c.id];
            return (
              <div key={c.id} className="flex flex-1 items-center gap-2 rounded-[10px] bg-[#FFF3EC] px-2 py-2">
                <div className="shrink-0">
                  <span className="text-[10px] font-bold text-[#FF3B2F]">¥</span>
                  <span className="text-[20px] font-black leading-none text-[#FF3B2F]">{c.amount}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-[#333]">{c.title}</div>
                  <div className="truncate text-[10px] text-[#999]">{c.cond}</div>
                </div>
                <button
                  type="button"
                  className={`shrink-0 rounded-full border-none px-2.5 py-1 text-[11px] font-medium cursor-pointer ${
                    got ? 'bg-[#EEE] text-[#999]' : 'bg-[#FF6A2B] text-white'
                  }`}
                  {...action('home.newbie.claim.action', () => {
                    if (got) return;
                    setClaimed((m) => ({ ...m, [c.id]: true }));
                    showToast(s.claimed);
                  })}
                >
                  {got ? s.claimed : '领取'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 抢购列表(单份美食) */}
      <div className="mx-3 mt-2 overflow-hidden rounded-[14px] bg-white">
        {deals.map((d) =>
          d.shop ? (
            <button
              key={d.id}
              type="button"
              className="flex w-full items-center gap-3 border-none border-b border-[#F5F5F5] bg-white px-3 py-3 text-left cursor-pointer"
              {...bindTap('food.shop-open', { params: { shopId: d.shopId } })}
            >
              <div className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: d.shop.coverColor }}>
                {dishImageUrl(d.shopId, d.dishId) ? (
                  <img src={dishImageUrl(d.shopId, d.dishId)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-[#222]">{d.title}</div>
                <div className="mt-0.5 truncate text-[11px] text-[#999]">
                  {d.shopLabel} · {(d.shop.distanceM / 1000).toFixed(1)}km
                </div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  <span className="rounded bg-[#FFF1EA] px-1 text-[10px] text-[#FF6633]">爆卖上万</span>
                  <span className="rounded bg-[#FFF1EA] px-1 text-[10px] text-[#FF6633]">多店通用</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-[10px] text-[#FF3B2F]">新人价</span>
                  <span className="text-[16px] font-bold text-[#FF3B2F]">¥{d.newPrice}</span>
                  <span className="text-[11px] text-[#CCC] line-through">¥{d.origin}</span>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-gradient-to-r from-[#FF8A4C] to-[#FF3B2F] px-4 py-1.5 text-[13px] font-bold text-white">
                抢
              </span>
            </button>
          ) : null,
        )}
      </div>
    </div>
  );
}
