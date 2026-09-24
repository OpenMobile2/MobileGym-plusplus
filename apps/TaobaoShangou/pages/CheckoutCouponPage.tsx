import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar } from '../components/common';
import { cartSubtotal, expireText, fmt } from '../utils';
import { IcDown, IcUp } from '../res/icons';
import type { TbCoupon } from '../types';

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 ${
        checked ? 'bg-[#F53F3F]' : 'border border-[#CCCCCC] bg-white'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 6.2 5 9l5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </span>
  );
}

/** 券卡(IMG_6042 视觉:左大面额+门槛,中名称+到期,右单选) */
function CouponCard({
  coupon, checked, disabled, reason, binding, action,
}: {
  coupon: TbCoupon;
  checked?: boolean;
  disabled?: boolean;
  reason?: string;
  binding?: React.HTMLAttributes<HTMLButtonElement>;
  action?: React.ReactNode;
}) {
  const now = TimeService.now();
  const body = (
    <>
      <div className={`w-[84px] shrink-0 text-center ${disabled ? 'text-[#BBBBBB]' : 'text-[#F53F3F]'}`}>
        <div className="font-bold leading-none">
          <span className="text-[14px]">¥</span>
          <span className="text-[28px]">{fmt(coupon.amount)}</span>
        </div>
        <div className="text-[11px] mt-1">满{fmt(coupon.threshold)}可用</div>
      </div>
      <div className="flex-1 min-w-0 border-l border-dashed border-[#EEEEEE] pl-3">
        <div className={`text-[15px] font-semibold truncate ${disabled ? 'text-[#BBBBBB]' : 'text-[#1A1A1A]'}`}>{coupon.name}</div>
        <div className="text-[11px] text-[#999999] mt-1">{expireText(coupon.expireAt, now)}</div>
        {reason && <div className="text-[11px] text-[#F53F3F] mt-0.5">{reason}</div>}
      </div>
      <div className="shrink-0 flex items-center">
        {action ?? (!disabled && <Radio checked={!!checked} />)}
      </div>
    </>
  );
  if (binding) {
    return (
      <button
        {...(binding as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        className="w-full flex items-center bg-white rounded-xl p-3 mt-2.5 border-none cursor-pointer text-left"
      >
        {body}
      </button>
    );
  }
  return <div className="w-full flex items-center bg-white rounded-xl p-3 mt-2.5">{body}</div>;
}

/** 选择平台红包/店铺活动券页(spec checkout.couponSelect,证据 IMG_R032/IMG_6042) */
export default function CheckoutCouponPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const [sp] = useSearchParams();
  const type = sp.get('type') === 'shop' ? 'shop' : 'platform';
  const shopId = sp.get('shopId') ?? undefined;

  const draft = useTbsgStore((st) => st.checkoutDraft);
  const coupons = useTbsgStore((st) => st.coupons);
  const shops = useTbsgStore((st) => st.shops);
  const claimShopCoupon = useTbsgStore((st) => st.claimShopCoupon);
  const setCheckoutCoupon = useTbsgStore((st) => st.setCheckoutCoupon);

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (!draft) return null;
    if (type === 'shop') return draft.shopCouponIds[shopId ?? ''] ?? null;
    return draft.platformCouponId;
  });
  const [unusableOpen, setUnusableOpen] = useState(false);

  const group = draft?.shopGroups.find((g) => (type === 'shop' ? g.shopId === shopId : true));
  const subtotal = group ? cartSubtotal(group.lines) : 0;
  const shop = type === 'shop' ? shops.find((x) => x.id === shopId) : undefined;

  /** 可选券集合 */
  const pool = type === 'platform'
    ? coupons.filter((c) => (c.type === 'platform' || c.type === 'burst') && c.status === 'claimed')
    : coupons.filter((c) => c.type === 'shop' && c.shopId === shopId && c.status === 'claimed');
  const usable = pool.filter((c) => subtotal >= c.threshold);
  const unusable = pool.filter((c) => subtotal < c.threshold);

  const selectedCoupon = selectedId ? usable.find((c) => c.id === selectedId) ?? null : null;
  const discount = selectedCoupon?.amount ?? 0;

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title={type === 'platform' ? '选择平台红包' : '选择店铺活动/券'} />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-[16px] font-bold text-[#1A1A1A]">{type === 'platform' ? '平台红包' : '店铺券'}</span>
          <span className="text-[12px] text-[#999999]">可选1张</span>
        </div>

        {/* 可用券 */}
        {usable.map((c) => (
          <CouponCard
            key={c.id}
            coupon={c}
            checked={selectedId === c.id}
            binding={bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'checkout.coupon.select' },
              {
                params: { couponId: c.id },
                onTrigger: () => setSelectedId((prev) => (prev === c.id ? null : c.id)),
              },
            )}
          />
        ))}

        {/* 店铺券未领:入会领券(IMG_R032) */}
        {type === 'shop' && shop && !shop.shopCoupon.claimed && (
          <div className="bg-white rounded-xl p-3 mt-2.5 relative">
            <span className="absolute right-4 -top-0 text-[10px] text-white bg-[#ED6C2C] rounded-b px-1.5 py-0.5">推荐</span>
            <div className="flex items-center">
              <div className="w-[84px] shrink-0 text-center text-[#F53F3F]">
                <div className="font-bold leading-none">
                  <span className="text-[14px]">¥</span>
                  <span className="text-[28px]">{fmt(shop.shopCoupon.amount)}</span>
                </div>
                <div className="text-[11px] mt-1">满{fmt(shop.shopCoupon.threshold)}可用</div>
              </div>
              <div className="flex-1 min-w-0 border-l border-dashed border-[#EEEEEE] pl-3">
                <div className="text-[15px] font-semibold text-[#1A1A1A]">品牌会员红包</div>
                <div className="text-[11px] text-[#999999] mt-1">{shop.shopCoupon.name}·入会即领</div>
              </div>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'checkout.coupon.memberClaim' },
                  {
                    onTrigger: () => {
                      claimShopCoupon(shop.id);
                      if (subtotal >= shop.shopCoupon.threshold) setSelectedId(shop.shopCoupon.id);
                    },
                  },
                )}
                className="shrink-0 h-8 px-3 rounded-full bg-[#F53F3F] text-white text-[13px] font-semibold border-none cursor-pointer"
              >
                入会领券
              </button>
            </div>
            <div className="border-t border-[#EEEEEE] mt-3 pt-2 text-[11px] text-[#999999]">
              免费入会并同意 服务协议 信息授权协议 相关协议
            </div>
          </div>
        )}

        {/* 不可用券折叠 */}
        {unusable.length > 0 && (
          <>
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'checkout.coupon.unusable.expand' },
                { onTrigger: () => setUnusableOpen((v) => !v) },
              )}
              className="w-full flex items-center justify-center gap-1 bg-white rounded-xl py-3.5 mt-2.5 border-none cursor-pointer text-[14px] text-[#666666]"
            >
              {unusable.length} 张不可用券
              {unusableOpen ? <IcUp size={14} className="text-[#999999]" /> : <IcDown size={14} className="text-[#999999]" />}
            </button>
            {unusableOpen && unusable.map((c) => (
              <CouponCard key={c.id} coupon={c} disabled reason={`未满¥${fmt(c.threshold)},还差¥${fmt(c.threshold - subtotal)}`} />
            ))}
          </>
        )}

        {usable.length === 0 && unusable.length === 0 && !(type === 'shop' && shop && !shop.shopCoupon.claimed) && (
          <div className="text-center text-[13px] text-[#999999] py-10">{s.couponEmpty}</div>
        )}
      </div>

      {/* 底部栏 */}
      <div className="shrink-0 bg-white px-4 py-2.5 flex items-center justify-end gap-3 border-t border-[#EEEEEE]">
        <span className="text-[13px] text-[#1A1A1A]">
          已选{selectedCoupon ? 1 : 0}种优惠
          {selectedCoupon && <span className="text-[#F53F3F]">,可减¥{fmt(discount)}</span>}
        </span>
        <button
          {...bindTap<HTMLButtonElement>('checkout.coupon.confirm', {
            beforeTrigger: () => setCheckoutCoupon(type === 'shop' ? 'shop' : 'platform', selectedId, sp.get('shopId') || undefined),
          })}
          className="h-10 px-9 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
        >
          确定
        </button>
      </div>
    </div>
  );
}
