import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { expireText, fmt } from '../utils';
import type { TbShop } from '../types';
import { Sheet, showToast } from './common';
import { IcClose, IcDown, IcUp } from '../res/icons';

/** 「已领取」灰色印章 */
function ClaimedStamp() {
  return (
    <span className="shrink-0 w-14 h-14 rounded-full border-2 border-[#BBBBBB] text-[#BBBBBB] text-[12px] font-bold flex items-center justify-center rotate-[-18deg]">
      已领取
    </span>
  );
}

/**
 * 店铺红包优惠弹层(spec shop.couponSheet,IMG_6049)
 * 平台红包(已领取印章)/其他N张折叠/吃货卡推广/店铺红包(关注领券)/优惠活动
 */
export function ShopCouponSheet({ shop }: { shop: TbShop }) {
  const { bindTap, back } = useTbsgGestures();
  const [, setSp] = useSearchParams();
  const coupons = useTbsgStore((s) => s.coupons);
  const claimShopCoupon = useTbsgStore((s) => s.claimShopCoupon);
  const [expanded, setExpanded] = useState(false);
  const now = TimeService.now();

  const platform = coupons.filter((c) => c.type === 'burst' || c.type === 'platform');
  const shown = expanded ? platform : platform.slice(0, 2);
  const restCount = platform.length - 2;
  const sc = shop.shopCoupon;

  return (
    <Sheet maxH="86%">
      {/* 标题 */}
      <div className="relative shrink-0 pt-4 pb-2">
        <div className="text-center text-[17px] font-bold text-[#1A1A1A]">红包优惠</div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.couponSheet.close' }, { onTrigger: () => back() })}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#F3F6F8] border-none flex items-center justify-center cursor-pointer"
          aria-label="关闭"
        >
          <IcClose size={18} className="text-[#1A1A1A]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-5" data-scroll-container="coupon-sheet" data-scroll-direction="vertical">
        {/* 平台红包 */}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[15px] font-bold text-[#1A1A1A]">平台红包</span>
          <span className="text-[11px] text-[#999999]">每单限用1张</span>
        </div>
        {shown.map((c) => (
          <div key={c.id} className="flex items-center bg-white rounded-xl border border-[#EEEEEE] px-4 py-3.5 mt-2">
            <div className="w-20 shrink-0">
              <div className="text-[#F53F3F] font-bold leading-none">
                <span className="text-[13px]">¥</span><span className="text-[26px]">{fmt(c.amount)}</span>
              </div>
              <div className="text-[11px] text-[#999999] mt-1">满{fmt(c.threshold)}可用</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#1A1A1A] truncate">{c.name}</div>
              <div className="text-[12px] text-[#F53F3F] mt-0.5">{expireText(c.expireAt, now)}</div>
            </div>
            {c.status === 'claimed' ? <ClaimedStamp /> : (
              <span className="shrink-0 text-[12px] text-[#999999]">未领取</span>
            )}
          </div>
        ))}
        {restCount > 0 && (
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shop.coupon.expand' },
              { onTrigger: () => setExpanded((v) => !v) },
            )}
            className="w-full py-2.5 text-[13px] text-[#999999] bg-transparent border-none cursor-pointer flex items-center justify-center gap-0.5"
          >
            {expanded ? '收起' : `其他${restCount}张`}
            {expanded ? <IcUp size={14} /> : <IcDown size={14} />}
          </button>
        )}

        {/* 超级吃货卡推广(金色) */}
        <div className="rounded-xl mt-2 p-3.5 border border-[#E8C48A]" style={{ background: 'linear-gradient(135deg,#FFF7E8,#FDEBC8)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#1A1A1A]">立即购卡,红包爆涨超省钱</span>
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.foodcardSheet.open' },
                { onTrigger: () => setSp((p) => { p.set('panel', 'foodcard'); return p; }) },
              )}
              className="shrink-0 h-8 px-3 rounded-lg text-white text-[13px] font-bold border-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg,#C98A3B,#A46A22)' }}
            >
              ¥0.9抢购
            </button>
          </div>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="w-32 shrink-0 rounded-lg px-2.5 py-2 text-[#8A5A16]" style={{ background: 'linear-gradient(135deg,#F8DFAE,#EFC77F)' }}>
              <div className="text-[10px] font-semibold">👑 超级吃货卡</div>
              <div className="font-bold leading-tight mt-0.5">
                <span className="text-[16px]">¥5</span><span className="text-[10px]">起</span>
                <span className="text-[11px] mx-0.5">×</span><span className="text-[16px]">12</span><span className="text-[10px]">张</span>
              </div>
              <div className="text-[10px] mt-0.5">无门槛 · 爆红包|可爆涨</div>
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#1A1A1A]">60元超级吃货卡</div>
              <div className="text-[11px] text-[#A46A22] bg-[#F8DFAE] rounded px-1.5 py-0.5 inline-block mt-1">最高爆涨至28</div>
            </div>
          </div>
        </div>

        {/* 店铺红包 */}
        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-[15px] font-bold text-[#1A1A1A]">店铺红包</span>
          <span className="text-[11px] text-[#999999]">每单限1张</span>
        </div>
        <div className="relative flex items-center bg-white rounded-xl border border-[#EEEEEE] px-4 py-3.5 mt-2">
          <span className="absolute -top-0 left-0 text-[10px] text-white bg-[#EB493B] rounded-br-lg rounded-tl-xl px-1.5 py-0.5">关注有礼</span>
          <div className="w-20 shrink-0 pt-2">
            <div className="text-[#F53F3F] font-bold leading-none">
              <span className="text-[13px]">¥</span><span className="text-[26px]">{fmt(sc.amount)}</span>
            </div>
            <div className="text-[11px] text-[#999999] mt-1">满{fmt(sc.threshold)}可用</div>
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[14px] font-semibold text-[#1A1A1A] truncate">{shop.fullName}</div>
            <div className="text-[12px] text-[#999999] mt-0.5">{expireText(now + 7 * 24 * 3600_000, now)}</div>
            <div className="text-[12px] text-[#F53F3F] mt-0.5">可与平台红包叠加使用</div>
          </div>
          {sc.claimed ? <ClaimedStamp /> : (
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.coupon.followClaim' },
                { onTrigger: () => { claimShopCoupon(shop.id); showToast('领取成功,已关注店铺'); } },
              )}
              className="shrink-0 h-9 px-3.5 rounded-full bg-[#EB493B] text-white text-[13px] font-bold border-none cursor-pointer"
            >
              关注领券
            </button>
          )}
        </div>

        {/* 优惠活动 */}
        <div className="text-[15px] font-bold text-[#1A1A1A] mt-4">优惠活动</div>
        {shop.promos.length > 0 && (
          <div className="flex items-start gap-2 mt-2">
            <span className="shrink-0 text-[10px] text-[#EB493B] border border-[#EB493B]/60 rounded px-1 py-[1px] mt-0.5">满减</span>
            <span className="text-[13px] text-[#1A1A1A]">
              {shop.promos.map((p) => `满${fmt(p.full)}元减${fmt(p.off)}元`).join(',')}
            </span>
          </div>
        )}
        <div className="flex items-start gap-2 mt-2">
          <span className="shrink-0 text-[10px] text-[#EB493B] border border-[#EB493B]/60 rounded px-1 py-[1px] mt-0.5">配送费优惠</span>
          <span className="text-[13px] text-[#1A1A1A]">
            配送费立减约{fmt(Math.max(0, Math.round((shop.deliveryFeeOrig - shop.deliveryFee) * 100) / 100))}元
          </span>
        </div>
      </div>
    </Sheet>
  );
}
