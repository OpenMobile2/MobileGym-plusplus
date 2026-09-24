import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, BottomSheet, usePanel, useToast, EmptyState, VIP } from '../components/ui';
import { PAY_METHODS } from '../constants';
import { IcLocation, IcTicket, IcTruck, IcCheck, IcCrown, IcArrowRight } from '../res/icons';

const DELIVERY_OPTIONS = [
  { id: 'sf', label: '顺丰速运', desc: '预计明天送达' },
  { id: 'normal', label: '普通快递', desc: '预计3天内送达' },
];

export default function OrderConfirmPage() {
  const { bindTap, back } = useVipshopGestures();
  const { value: panel, open: openPanel } = usePanel();
  const [toast, showToast] = useToast();

  const checkout = useVipshopStore((s) => s.checkout);
  const addresses = useVipshopStore((s) => s.addresses);
  const coupons = useVipshopStore((s) => s.coupons);
  const setCheckoutPayMethod = useVipshopStore((s) => s.setCheckoutPayMethod);
  const setCheckoutCoupon = useVipshopStore((s) => s.setCheckoutCoupon);
  const toggleCheckoutSvip = useVipshopStore((s) => s.toggleCheckoutSvip);
  const createOrder = useVipshopStore((s) => s.createOrder);

  const [deliveryExpand, setDeliveryExpand] = useState(false);
  const [deliveryId, setDeliveryId] = useState('sf');
  const [detailExpand, setDetailExpand] = useState(false);

  if (!checkout) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]">
        <TopBar title="确认订单" />
        <EmptyState text="没有待确认的订单" hint="请先从购物车或商品页发起结算" />
      </div>
    );
  }

  const address = addresses.find((a) => a.id === checkout.addressId);
  const usableCoupons = coupons.filter((c) => !c.used);
  const selectedCoupon = checkout.couponId ? coupons.find((c) => c.id === checkout.couponId) : null;

  const itemTotal = checkout.lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const couponDiscount = selectedCoupon ? selectedCoupon.amount : 0;
  const svipDiscount = checkout.svip ? 15 : 0;
  const shipping = 0;
  const payable = Math.max(0, itemTotal - couponDiscount - svipDiscount + shipping);
  const delivery = DELIVERY_OPTIONS.find((d) => d.id === deliveryId) ?? DELIVERY_OPTIONS[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="确认订单" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="order-confirm" data-scroll-direction="vertical">
        {/* 收货地址卡 */}
        <button
          {...bindTap('orderConfirm.address-open')}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center gap-2 border-none cursor-pointer text-left"
        >
          <IcLocation size={20} style={{ color: VIP.primary }} className="shrink-0" />
          {address ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[#222222]">{address.name}</span>
                <span className="text-[13px] text-[#666666]">{address.phone}</span>
                {address.isDefault && (
                  <span className="text-[10px] rounded px-1" style={{ color: VIP.primary, background: '#FDECF5' }}>默认</span>
                )}
              </div>
              <div className="text-[12px] text-[#666666] mt-0.5 line-clamp-2">
                {address.region.replace(/ /g, '')}{address.detail}
              </div>
            </div>
          ) : (
            <div className="flex-1 text-[14px] text-[#888888]">请选择收货地址</div>
          )}
          <IcArrowRight size={16} className="text-[#BBBBBB] shrink-0" />
        </button>

        {/* 商品清单 */}
        <div className="bg-white mt-2">
          <div className="px-3 py-2 text-[13px] font-semibold text-[#222222] border-b border-[#F5F5F5]">
            {checkout.brandName}
          </div>
          {checkout.lines.map((l, i) => (
            <div key={`${l.itemId}_${i}`} className="flex gap-2.5 px-3 py-2.5 border-b border-[#F5F5F5]">
              <Img src={l.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#222222] line-clamp-2">{l.title}</div>
                <div className="mt-1 text-[11px] text-[#888888] bg-[#F5F5F5] rounded px-1.5 py-0.5 inline-block">{l.skuDesc}</div>
                <div className="flex items-center justify-between mt-1">
                  <Price value={l.price} size="m" />
                  <span className="text-[12px] text-[#888888]">x{l.qty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 优惠券行 */}
        <button
          {...bindTap({ kind: 'action', id: 'orderConfirm.coupon.open' }, { onTrigger: () => openPanel('coupon') })}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between border-none cursor-pointer text-left"
        >
          <span className="flex items-center gap-1.5 text-[13px] text-[#222222]"><IcTicket size={16} style={{ color: VIP.primary }} />优惠券</span>
          <span className="flex items-center gap-1 text-[13px]" style={{ color: selectedCoupon ? VIP.price : '#888888' }}>
            {selectedCoupon ? `-¥${selectedCoupon.amount}` : `${usableCoupons.length}张可用`}
            <IcArrowRight size={14} className="text-[#BBBBBB]" />
          </span>
        </button>

        {/* 配送方式行 */}
        <div className="bg-white mt-px">
          <button
            {...bindTap({ kind: 'action', id: 'orderConfirm.delivery.open' }, { onTrigger: () => setDeliveryExpand((v) => !v) })}
            className="w-full px-3 py-3 flex items-center justify-between border-none cursor-pointer text-left bg-white"
          >
            <span className="flex items-center gap-1.5 text-[13px] text-[#222222]"><IcTruck size={16} style={{ color: VIP.primary }} />配送方式</span>
            <span className="flex items-center gap-1 text-[13px] text-[#666666]">
              {delivery.label}
              <IcArrowRight size={14} className={`text-[#BBBBBB] transition-transform ${deliveryExpand ? 'rotate-90' : ''}`} />
            </span>
          </button>
          {deliveryExpand && (
            <div className="px-3 pb-2">
              {DELIVERY_OPTIONS.map((d) => {
                const on = d.id === deliveryId;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setDeliveryId(d.id); setDeliveryExpand(false); }}
                    className="w-full flex items-center gap-2 py-2 border-t border-[#F5F5F5] bg-white border-x-0 cursor-pointer text-left"
                  >
                    <span
                      className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                      style={on ? { borderColor: VIP.primary, background: VIP.primary } : { borderColor: '#CCC' }}
                    >
                      {on && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[13px] text-[#222222]">{d.label}</span>
                    <span className="text-[11px] text-[#888888]">{d.desc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 支付方式 */}
        <div className="bg-white mt-2">
          <div className="px-3 py-2 text-[13px] font-semibold text-[#222222] border-b border-[#F5F5F5]">支付方式</div>
          {PAY_METHODS.map((pm) => {
            const on = checkout.payMethod === pm.label;
            return (
              <button
                key={pm.id}
                {...bindTap({ kind: 'action', id: 'orderConfirm.payMethod.select.target' }, {
                  params: { target: pm.id },
                  onTrigger: () => setCheckoutPayMethod(pm.label),
                })}
                className="w-full flex items-center gap-2 px-3 py-3 border-b border-[#F5F5F5] bg-white border-x-0 cursor-pointer text-left"
              >
                <span className="flex-1 text-[13px] text-[#222222]">
                  {pm.label}
                  {pm.desc && <span className="ml-2 text-[11px]" style={{ color: VIP.orange }}>{pm.desc}</span>}
                </span>
                <span
                  className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                  style={on ? { borderColor: VIP.primary, background: VIP.primary } : { borderColor: '#CCC' }}
                >
                  {on && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* 超V年卡勾选 */}
        <button
          {...bindTap({ kind: 'action', id: 'orderConfirm.svip.toggle' }, { onTrigger: () => toggleCheckoutSvip() })}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center gap-2 border-none cursor-pointer text-left"
        >
          <IcCrown size={18} style={{ color: VIP.gold }} className="shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#222222] font-semibold">开通超V年卡</div>
            <div className="text-[11px] text-[#888888] mt-0.5">立享本单再减 ¥15,全年畅享会员价</div>
          </div>
          <span
            className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
            style={checkout.svip ? { borderColor: VIP.primary, background: VIP.primary } : { borderColor: '#CCC' }}
          >
            {checkout.svip && <IcCheck size={14} className="text-white" />}
          </span>
        </button>

        {/* 金额明细(可展开) */}
        <div className="bg-white mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'orderConfirm.detail.toggle' }, { onTrigger: () => setDetailExpand((v) => !v) })}
            className="w-full px-3 py-3 flex items-center justify-between border-none cursor-pointer text-left bg-white"
          >
            <span className="text-[13px] text-[#222222]">金额明细</span>
            <span className="flex items-center gap-1 text-[13px] text-[#666666]">
              合计 <Price value={payable} size="s" />
              <IcArrowRight size={14} className={`text-[#BBBBBB] transition-transform ${detailExpand ? 'rotate-90' : ''}`} />
            </span>
          </button>
          {detailExpand && (
            <div className="px-3 pb-3 text-[12px] text-[#666666]">
              <div className="flex justify-between py-1"><span>商品总额</span><span>¥{itemTotal.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span>运费</span><span>{shipping === 0 ? '包邮' : `¥${shipping}`}</span></div>
              {couponDiscount > 0 && <div className="flex justify-between py-1"><span>优惠券</span><span style={{ color: VIP.price }}>-¥{couponDiscount}</span></div>}
              {svipDiscount > 0 && <div className="flex justify-between py-1"><span>超V年卡</span><span style={{ color: VIP.price }}>-¥{svipDiscount}</span></div>}
              <div className="flex justify-between py-1 border-t border-[#F5F5F5] mt-1 pt-2 text-[#222222] font-semibold">
                <span>实付款</span><span style={{ color: VIP.price }}>¥{payable.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-3" />
      </div>

      {/* 底部提交栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 h-14 gap-2">
        <div className="flex-1 text-right">
          <span className="text-[12px] text-[#888888] mr-1">合计</span>
          <Price value={payable} size="l" />
        </div>
        <button
          {...bindTap('orderConfirm.submit-open', {
            params: { orderId: '0' },
            beforeTrigger: () => { createOrder(); },
          })}
          className="text-[15px] rounded-full px-8 py-2 border-none cursor-pointer text-white font-semibold"
          style={{ background: VIP.ctaBlack }}
        >
          提交订单
        </button>
      </div>

      {/* 优惠券弹层 */}
      {panel === 'coupon' && (
        <BottomSheet onClose={() => back()} title="选择优惠券">
          <div className="px-3 pb-4">
            <button
              {...bindTap({ kind: 'action', id: 'orderConfirm.couponPick.select.target' }, {
                params: { couponId: 'none' },
                onTrigger: () => { setCheckoutCoupon(null); back(); },
              })}
              className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-white border-x-0 border-t-0 cursor-pointer text-left"
            >
              <span className="text-[13px] text-[#222222]">不使用优惠券</span>
              <span
                className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                style={!checkout.couponId ? { borderColor: VIP.primary, background: VIP.primary } : { borderColor: '#CCC' }}
              >
                {!checkout.couponId && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
            </button>
            {usableCoupons.length === 0 && (
              <div className="text-[13px] text-[#888888] text-center py-8">暂无可用优惠券</div>
            )}
            {usableCoupons.map((c) => {
              const on = checkout.couponId === c.id;
              return (
                <button
                  key={c.id}
                  {...bindTap({ kind: 'action', id: 'orderConfirm.couponPick.select.target' }, {
                    params: { couponId: c.id },
                    onTrigger: () => { setCheckoutCoupon(c.id); back(); },
                  })}
                  className="w-full flex items-stretch gap-3 mt-3 rounded-lg overflow-hidden border cursor-pointer text-left"
                  style={{ borderColor: on ? VIP.primary : '#EEE' }}
                >
                  <div className="w-24 flex flex-col items-center justify-center py-3 text-white shrink-0" style={{ background: `linear-gradient(135deg,#FF6FA5,${VIP.primary})` }}>
                    <span className="text-[22px] font-bold leading-none">¥{c.amount}</span>
                    <span className="text-[10px] mt-1">{c.thresholdText}</span>
                  </div>
                  <div className="flex-1 min-w-0 py-2 pr-2">
                    <div className="text-[13px] font-semibold text-[#222222] truncate">{c.title}</div>
                    <div className="text-[11px] text-[#888888] mt-0.5">{c.type} · {c.validText}</div>
                  </div>
                  <span className="self-center mr-3 w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                    style={on ? { borderColor: VIP.primary, background: VIP.primary } : { borderColor: '#CCC' }}
                  >
                    {on && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
