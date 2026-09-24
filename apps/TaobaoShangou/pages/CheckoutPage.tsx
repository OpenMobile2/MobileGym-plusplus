import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Price, showToast } from '../components/common';
import { TablewareSheet } from '../components/TablewareSheet';
import { PaySheet } from '../components/PaySheet';
import { computeGroupAmounts, cartSubtotal, fmt, cents, yuan } from '../utils';
import {
  IcBack, IcEdit, IcPlus, IcRight,
} from '../res/icons';
import type { TbCartLine } from '../types';
import { useStatusBarBg } from '../statusbar';

const clock = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const maskPhone = (p: string) => (p.length >= 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : p);

/** 确认订单页(spec checkout.main,证据 IMG_6020/6021/IMG_R028;多店分组 qa:Q7) */
export default function CheckoutPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, go } = useTbsgGestures();
  useStatusBarBg('#FBF1DF');
  const [sp, setSp] = useSearchParams();
  const panel = sp.get('panel');

  const draft = useTbsgStore((st) => st.checkoutDraft);
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const coupons = useTbsgStore((st) => st.coupons);
  const addresses = useTbsgStore((st) => st.addresses);
  const currentAddressId = useTbsgStore((st) => st.currentAddressId);
  const setCheckoutField = useTbsgStore((st) => st.setCheckoutField);
  const payCheckout = useTbsgStore((st) => st.payCheckout);
  const abandonPay = useTbsgStore((st) => st.abandonPay);

  const [payMethod, setPayMethod] = useState<'alipay'>('alipay');
  const [slotsOpen, setSlotsOpen] = useState(false);

  const now = TimeService.now();

  /** 金额计算(qa:Q7 多店逐店计算;平台红包/增值服务仅记第一组) */
  const groupAmounts = useMemo(() => {
    if (!draft) return [];
    return draft.shopGroups.map((g, gi) => {
      const shop = shops.find((x) => x.id === g.shopId)!;
      const platformCoupon = gi === 0 && draft.platformCouponId
        ? coupons.find((c) => c.id === draft.platformCouponId) ?? null
        : null;
      const shopCouponId = draft.shopCouponIds[g.shopId];
      const shopCoupon = shopCouponId ? coupons.find((c) => c.id === shopCouponId) ?? null : null;
      const vasFee = gi === 0 ? (draft.vas.rush ? 2 : 0) + (draft.vas.latePay ? 1.21 : 0) : 0;
      return computeGroupAmounts(shop, g.lines, { mode: draft.mode, platformCoupon, shopCoupon, vasFee });
    });
  }, [draft, shops, coupons]);

  // 草稿已失效(下单/弃单后经返回落到此):提供可靠的"返回首页"逃生,绝不卡死
  if (!draft) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <div className="flex items-center h-11 px-2 shrink-0 bg-white">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-[#999999] px-8">
          <div className="text-[40px]">📄</div>
          <div className="text-[15px] mt-2 text-center">订单已提交,可在「我的-订单」查看</div>
          <button
            {...bindTap<HTMLButtonElement>('checkout.exit-home')}
            className="mt-5 h-10 px-10 rounded-full bg-[#ED6C2C] text-white text-[15px] font-semibold border-none cursor-pointer"
          >
            返回首页
          </button>
          <button {...bindTap<HTMLButtonElement>('checkout.exit-mine')} className="mt-3 text-[14px] text-[#ED6C2C] bg-transparent border-none cursor-pointer">
            查看我的订单
          </button>
        </div>
      </div>
    );
  }

  const shop0 = shops.find((x) => x.id === draft.shopGroups[0].shopId)!;
  const addr = addresses.find((a) => a.id === currentAddressId);
  const totalQty = draft.shopGroups.reduce((a, g) => a + g.lines.reduce((b, l) => b + l.qty, 0), 0);
  const total = yuan(groupAmounts.reduce((a, am) => a + cents(am.total), 0));
  const totalDiscount = yuan(groupAmounts.reduce((a, am) => a + cents(am.totalDiscount), 0));

  /** 预约配送4个30分钟时段 */
  const slotBase = Math.ceil((now + 30 * 60_000) / (30 * 60_000)) * 30 * 60_000;
  const slots = [0, 1, 2, 3].map((i) => `${clock(slotBase + i * 30 * 60_000)}-${clock(slotBase + (i + 1) * 30 * 60_000)}`);
  const etaText = `${clock(now + shop0.deliveryMinutes * 60_000)}-${clock(now + (shop0.deliveryMinutes + 15) * 60_000)}`;

  /** 换购候选:单店时该店3个低价品(排除已在订单中的) */
  const exchangeItems = draft.shopGroups.length === 1
    ? items
      .filter((i) => i.shopId === shop0.id && !draft.shopGroups[0].lines.some((l) => l.itemId === i.id))
      .sort((a, b) => a.price - b.price)
      .slice(0, 3)
    : [];

  const platformCoupon = draft.platformCouponId ? coupons.find((c) => c.id === draft.platformCouponId) : null;

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 顶部:米黄→白渐变 + 返回 + 滚动通知条 */}
      <div className="shrink-0 bg-gradient-to-b from-[#FBF1DF] to-white">
        <div className="flex items-center h-11 px-2">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-1 overflow-hidden">
            <span className="text-[12px]">🔉</span>
            <span className="text-[13px] text-[#6B5B3D] whitespace-nowrap truncate">夜间远距离配送,配送费原价上调</span>
          </div>
          <div className="w-9" />
        </div>
        {/* 外卖到家/到店自取 分段 */}
        <div className="flex items-center gap-2 px-4 pb-2">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'checkout.mode.toggle' },
              { params: { mode: 'delivery' }, onTrigger: () => setCheckoutField({ mode: 'delivery' }) },
            )}
            className={`h-8 px-4 rounded-full text-[13px] cursor-pointer ${
              draft.mode === 'delivery'
                ? 'bg-[#1A1A1A] text-white font-semibold border-none'
                : 'bg-white/70 text-[#666666] border border-[#E5E5E5]'
            }`}
          >
            {s.delivery}
          </button>
          {shop0.supportsPickup && (
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'checkout.mode.toggle' },
                { params: { mode: 'pickup' }, onTrigger: () => setCheckoutField({ mode: 'pickup' }) },
              )}
              className={`h-8 px-4 rounded-full text-[13px] cursor-pointer ${
                draft.mode === 'pickup'
                  ? 'bg-[#1A1A1A] text-white font-semibold border-none'
                  : 'bg-white/70 text-[#666666] border border-[#E5E5E5]'
              }`}
            >
              {s.pickup}
            </button>
          )}
        </div>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 pb-3">
        {/* 地址卡 */}
        <div className="bg-white rounded-xl p-4">
          {draft.mode === 'delivery' ? (
            <button
              {...bindTap<HTMLButtonElement>('checkout.address-open', { params: { from: 'checkout' } })}
              className="w-full text-left bg-transparent border-none cursor-pointer p-0"
            >
              <div className="flex items-center gap-1">
                <span className="text-[18px] font-bold text-[#1A1A1A] truncate">
                  {addr ? `${addr.poi}${addr.detail}` : '请选择收货地址'}
                </span>
                <IcRight size={16} className="text-[#999999] shrink-0 ml-auto" />
              </div>
              {addr && (
                <div className="flex items-center gap-2 mt-1.5 text-[13px] text-[#666666]">
                  <span>{addr.name}({addr.gender})</span>
                  <span>{maskPhone(addr.phone)}</span>
                  <IcEdit size={13} className="text-[#999999]" />
                </div>
              )}
            </button>
          ) : (
            <div>
              <div className="text-[12px] text-[#ED6C2C] font-semibold">到店自取</div>
              <div className="text-[18px] font-bold text-[#1A1A1A] mt-1">{shop0.fullName}</div>
              <div className="text-[13px] text-[#666666] mt-1">{shop0.address} · 距你{shop0.distanceKm}km</div>
              <div className="text-[13px] text-[#666666] mt-0.5">预计取餐时间 {clock(now + shop0.deliveryMinutes * 60_000)}</div>
            </div>
          )}

          {/* 配送时间(delivery 态) */}
          {draft.mode === 'delivery' && (
            <>
              <div className="flex gap-2 mt-3">
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'checkout.delivery.select' },
                    {
                      params: { slot: 'asap' },
                      onTrigger: () => {
                        setCheckoutField({ scheduled: null });
                        setSlotsOpen(false);
                      },
                    },
                  )}
                  className={`flex-1 rounded-lg px-2 py-2 cursor-pointer ${
                    !draft.scheduled ? 'border-[1.5px] border-[#00B45A] bg-[#F0FBF5]' : 'border border-[#E5E5E5] bg-white'
                  }`}
                >
                  <div className={`text-[15px] font-semibold ${!draft.scheduled ? 'text-[#00B45A]' : 'text-[#1A1A1A]'}`}>立即送出</div>
                  <div className={`text-[11px] mt-0.5 ${!draft.scheduled ? 'text-[#00B45A]' : 'text-[#999999]'}`}>预计{etaText}送达</div>
                </button>
                <button
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'checkout.delivery.select' },
                    { params: { slot: 'schedule' }, onTrigger: () => setSlotsOpen((v) => !v) },
                  )}
                  className={`flex-1 rounded-lg px-2 py-2 cursor-pointer ${
                    draft.scheduled ? 'border-[1.5px] border-[#00B45A] bg-[#F0FBF5]' : 'border border-[#E5E5E5] bg-white'
                  }`}
                >
                  <div className={`text-[15px] font-semibold ${draft.scheduled ? 'text-[#00B45A]' : 'text-[#1A1A1A]'}`}>预约配送</div>
                  <div className={`text-[11px] mt-0.5 flex items-center justify-center gap-0.5 ${draft.scheduled ? 'text-[#00B45A]' : 'text-[#999999]'}`}>
                    {draft.scheduled ?? '选择时间'}<IcRight size={11} />
                  </div>
                </button>
              </div>
              {slotsOpen && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      {...bindTap<HTMLButtonElement>(
                        { kind: 'action', id: 'checkout.delivery.select' },
                        {
                          params: { slot },
                          onTrigger: () => {
                            setCheckoutField({ scheduled: slot });
                            setSlotsOpen(false);
                          },
                        },
                      )}
                      className={`h-9 rounded-lg text-[13px] cursor-pointer ${
                        draft.scheduled === slot
                          ? 'border-[1.5px] border-[#00B45A] text-[#00B45A] bg-[#F0FBF5]'
                          : 'border border-[#E5E5E5] text-[#1A1A1A] bg-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              {/* 增值服务 */}
              <div className="mt-3 border-t border-[#EEEEEE] pt-2">
                {([
                  ['rush', '1对1急送', '可再提前7分钟', 2],
                  ['latePay', '超5分钟赔', '最高赔97.36元可叠加红包', 1.21],
                ] as const).map(([key, label, desc, fee]) => (
                  <button
                    key={key}
                    {...bindTap<HTMLButtonElement>(
                      { kind: 'action', id: 'checkout.vas.toggle' },
                      {
                        params: { vas: key },
                        onTrigger: () => setCheckoutField({ vas: { ...draft.vas, [key]: !draft.vas[key] } }),
                      },
                    )}
                    className="w-full flex items-center py-2 bg-transparent border-none cursor-pointer p-0"
                  >
                    <span className="text-[14px] font-semibold text-[#1A1A1A]">{label}</span>
                    <span className="text-[12px] text-[#999999] ml-2 truncate">{desc}</span>
                    <span className="ml-auto text-[13px] text-[#1A1A1A] font-semibold">¥{fmt(fee)}</span>
                    <span
                      className={`ml-2 w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${
                        draft.vas[key] ? 'bg-[#ED6C2C]' : 'border border-[#CCCCCC] bg-white'
                      }`}
                    >
                      {draft.vas[key] && (
                        <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6.2 5 9l5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 多店分组商品卡(qa:Q7) */}
        {draft.shopGroups.map((g, gi) => {
          const shop = shops.find((x) => x.id === g.shopId)!;
          const am = groupAmounts[gi];
          const shopCouponId = draft.shopCouponIds[g.shopId];
          const chosenShopCoupon = shopCouponId ? coupons.find((c) => c.id === shopCouponId) : null;
          const gSubtotal = cartSubtotal(g.lines);
          const usableShopCoupons = coupons.filter(
            (c) => c.type === 'shop' && c.shopId === g.shopId && c.status === 'claimed' && gSubtotal >= c.threshold,
          ).length + (shop.shopCoupon.claimed ? 0 : 1);
          return (
            <div key={g.shopId} className="bg-white rounded-xl p-4 mt-2.5">
              {/* 店头 */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white bg-[#ED6C2C] rounded px-1 py-0.5 font-semibold shrink-0">闪购</span>
                <span className="text-[15px] font-bold text-[#1A1A1A] truncate">{shop.fullName}</span>
                <span className="ml-auto text-[10px] text-[#ED6C2C] border border-[#F7C4A3] rounded px-1 py-0.5 shrink-0">蜂鸟准时达</span>
              </div>
              {/* 商品行 */}
              {g.lines.map((l) => {
                const item = items.find((i) => i.id === l.itemId);
                return (
                  <div key={l.id} className="flex gap-2.5 mt-3">
                    <AppImg src={item?.image ?? ''} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] text-[#1A1A1A] font-medium leading-5">{item?.name ?? ''}</span>
                        <span className="shrink-0 text-right">
                          {item?.origPrice != null && item.origPrice > l.price && (
                            <span className="text-[11px] text-[#999999] line-through mr-1">¥{fmt(item.origPrice)}</span>
                          )}
                          <Price value={l.price} size={15} />
                        </span>
                      </div>
                      {l.skuDesc && <div className="text-[12px] text-[#999999] mt-0.5 truncate">{l.skuDesc}</div>}
                      <div className="text-[12px] text-[#999999] mt-0.5">× {l.qty}</div>
                    </div>
                  </div>
                );
              })}
              {/* 费用行 */}
              {am.packFee > 0 && (
                <div className="flex items-center justify-between mt-3 text-[13px]">
                  <span className="text-[#1A1A1A]">打包费</span>
                  <span className="text-[#1A1A1A]">¥{fmt(am.packFee)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2 text-[13px]">
                <span className="text-[#1A1A1A]">配送费</span>
                <span>
                  {draft.mode === 'pickup' ? (
                    <span className="text-[#1A1A1A]">¥0</span>
                  ) : (
                    <>
                      {am.deliveryFeeOrig > am.deliveryFee && (
                        <>
                          <span className="text-[#00B45A] mr-1">惊喜减{fmt(am.deliveryFeeOrig - am.deliveryFee)}元</span>
                          <span className="text-[#999999] line-through mr-1">¥{fmt(am.deliveryFeeOrig)}</span>
                        </>
                      )}
                      <span className="text-[#1A1A1A] font-semibold">¥{fmt(am.deliveryFee)}</span>
                    </>
                  )}
                </span>
              </div>
              {/* 店铺活动/券行 */}
              <button
                {...bindTap<HTMLButtonElement>('checkout.shopcoupon-open', { params: { type: 'shop', shopId: g.shopId } })}
                className="w-full flex items-center justify-between mt-2 py-1 bg-transparent border-none cursor-pointer p-0 text-[13px]"
              >
                <span className="text-[#1A1A1A]">店铺活动/券</span>
                <span className="flex items-center gap-0.5">
                  {chosenShopCoupon ? (
                    <span className="text-[#F53F3F] font-semibold">-¥{fmt(chosenShopCoupon.amount)}</span>
                  ) : usableShopCoupons > 0 ? (
                    <span className="text-[#F53F3F]">{usableShopCoupons}张可用</span>
                  ) : (
                    <span className="text-[#999999]">无可用</span>
                  )}
                  <IcRight size={13} className="text-[#999999]" />
                </span>
              </button>
              {/* 平台红包行(仅第一组) */}
              {gi === 0 && (
                <button
                  {...bindTap<HTMLButtonElement>('checkout.platformcoupon-open', { params: { type: 'platform' } })}
                  className="w-full flex items-center justify-between mt-1 py-1 bg-transparent border-none cursor-pointer p-0 text-[13px]"
                >
                  <span className="text-[#1A1A1A]">平台红包</span>
                  <span className="flex items-center gap-0.5">
                    {platformCoupon ? (
                      <span className="text-[#F53F3F] font-semibold">-¥{fmt(platformCoupon.amount)}</span>
                    ) : (
                      <span className="text-[#999999]">{s.noCoupon}</span>
                    )}
                    <IcRight size={13} className="text-[#999999]" />
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {/* 换购横滑区(仅单店) */}
        {exchangeItems.length > 0 && (
          <div className="bg-white rounded-xl p-4 mt-2.5">
            <div className="text-[14px] font-bold text-[#1A1A1A]">超值换购,最高省0.5元</div>
            <div
              data-scroll-container="exchange"
              data-scroll-direction="horizontal"
              className="flex gap-2.5 mt-2.5 overflow-x-auto"
            >
              {exchangeItems.map((it) => (
                <div key={it.id} className="w-[104px] shrink-0">
                  <AppImg src={it.image} className="w-[104px] h-[84px] rounded-lg object-cover" />
                  <div className="text-[12px] text-[#1A1A1A] truncate mt-1">{it.name}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <Price value={it.price} size={14} orig={it.origPrice} />
                    <button
                      {...bindTap<HTMLButtonElement>(
                        { kind: 'action', id: 'checkout.exchange.add' },
                        {
                          params: { itemId: it.id },
                          onTrigger: () => {
                            const g0 = draft.shopGroups[0];
                            if (g0.lines.some((l) => l.id === `ex_${it.id}`)) {
                              showToast('已添加');
                              return;
                            }
                            const line: TbCartLine = {
                              id: `ex_${it.id}`, shopId: g0.shopId, itemId: it.id,
                              skuDesc: null, qty: 1, price: it.price, selected: true,
                            };
                            setCheckoutField({
                              shopGroups: [{ ...g0, lines: [...g0.lines, line] }, ...draft.shopGroups.slice(1)],
                            });
                          },
                        },
                      )}
                      className="w-5 h-5 rounded-full bg-[#ED6C2C] text-white flex items-center justify-center border-none cursor-pointer p-0 shrink-0"
                      aria-label="换购加购"
                    >
                      <IcPlus size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 备注/餐具 */}
        <div className="bg-white rounded-xl px-4 py-1 mt-2.5">
          <button
            {...bindTap<HTMLButtonElement>('checkout.remark-open')}
            className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer p-0 text-[14px]"
          >
            <span className="text-[#1A1A1A] font-semibold">{s.remark}</span>
            <span className="flex items-center gap-0.5 min-w-0">
              {draft.remark ? (
                <span className="text-[#1A1A1A] truncate max-w-[180px]">{draft.remark}</span>
              ) : (
                <span className="text-[#999999]">口味、偏好等</span>
              )}
              <IcRight size={14} className="text-[#999999] shrink-0" />
            </span>
          </button>
          <div className="h-px bg-[#EEEEEE]" />
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'checkout.tableware.open' },
              {
                onTrigger: () => setSp((p) => {
                  p.set('panel', 'tableware');
                  return p;
                }),
              },
            )}
            className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer p-0 text-[14px]"
          >
            <span className="text-[#1A1A1A] font-semibold">{s.tableware}</span>
            <span className="flex items-center gap-0.5">
              <span className={draft.tableware ? 'text-[#1A1A1A]' : 'text-[#999999]'}>
                {draft.tableware ?? '未选择'}
              </span>
              <IcRight size={14} className="text-[#999999]" />
            </span>
          </button>
        </div>

        {/* 支付方式 */}
        <div className="bg-white rounded-xl px-4 py-1 mt-2.5">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'checkout.payment.select' },
              { params: { method: 'alipay' }, onTrigger: () => setPayMethod('alipay') },
            )}
            className="w-full flex items-center py-3 bg-transparent border-none cursor-pointer p-0"
          >
            <span className="w-6 h-6 rounded-md bg-[#1677FF] text-white text-[13px] font-bold flex items-center justify-center shrink-0">支</span>
            <span className="text-[15px] text-[#1A1A1A] ml-2.5">支付宝</span>
            <span
              className={`ml-auto w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 ${
                payMethod === 'alipay' ? 'bg-[#ED6C2C]' : 'border border-[#CCCCCC] bg-white'
              }`}
            >
              {payMethod === 'alipay' && (
                <svg viewBox="0 0 12 12" width="11" height="11"><path d="M2 6.2 5 9l5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
          </button>
          {([['friend', '找朋友帮忙付', '💸'], ['huabei', '花呗极速付', '呗']] as const).map(([method, label, icon]) => (
            <button
              key={method}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'checkout.payment.select' },
                { params: { method }, onTrigger: () => showToast(s.notOpen) },
              )}
              className="w-full flex items-center py-3 bg-transparent border-none cursor-pointer p-0"
            >
              <span className="w-6 h-6 rounded-full bg-[#EAF2FF] text-[#1677FF] text-[12px] font-bold flex items-center justify-center shrink-0">{icon}</span>
              <span className="text-[15px] text-[#999999] ml-2.5">{label}</span>
              <span className="ml-auto w-[20px] h-[20px] rounded-full border border-[#CCCCCC] bg-white shrink-0" />
            </button>
          ))}
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'checkout.payment.expand' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            className="w-full flex items-center justify-center gap-1 py-2.5 bg-transparent border-none cursor-pointer text-[13px] text-[#666666]"
          >
            更多支付方式
            <IcRight size={13} className="text-[#999999] rotate-90" />
          </button>
        </div>

        {/* 发票/安心权益/惊喜返还 */}
        <div className="bg-white rounded-xl px-4 py-1 mt-2.5 text-[14px]">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'checkout.invoice.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer p-0"
          >
            <span className="text-[#1A1A1A] font-semibold">发票</span>
            <span className="flex items-center gap-0.5 text-[#666666]">
              该店支持外卖小票扫码开票
              <IcRight size={14} className="text-[#999999]" />
            </span>
          </button>
          <div className="h-px bg-[#EEEEEE]" />
          <div className="flex items-center justify-between py-3">
            <span className="flex items-center gap-1.5">
              <span className="text-[#1A1A1A] font-semibold">安心权益</span>
              <span className="text-[10px] text-white bg-[#7461D9] rounded px-1 py-0.5">悦享会员</span>
            </span>
            <span className="text-[#666666]">随心退·号码保护</span>
          </div>
          <div className="h-px bg-[#EEEEEE]" />
          <div className="flex items-center justify-between py-3">
            <span className="text-[#1A1A1A] font-semibold">惊喜返还</span>
            <span className="text-[#666666]">返110吃货豆,含吃货卡奖励等</span>
          </div>
        </div>
      </div>

      {/* 底部结算栏 */}
      <div className="shrink-0 bg-white px-4 py-2.5 flex items-center gap-3 border-t border-[#EEEEEE]">
        <div className="flex flex-col">
          <span className="text-[13px] text-[#1A1A1A]">共{totalQty}件</span>
          {totalDiscount > 0 && (
            <span className="text-[12px] text-[#F53F3F]">已优惠 ¥{fmt(totalDiscount)}</span>
          )}
        </div>
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'checkout.pay.open' },
            {
              onTrigger: () => setSp((p) => {
                p.set('panel', 'pay');
                return p;
              }),
            },
          )}
          className="flex-1 h-11 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
        >
          {s.payNow} ¥{fmt(total)}
        </button>
      </div>

      {/* 餐具弹层 */}
      {panel === 'tableware' && (
        <TablewareSheet onPick={(opt) => setCheckoutField({ tableware: opt })} />
      )}
      {/* 模拟收银台(qa:Q1;×=弃单生成待支付订单 qa:R4) */}
      {panel === 'pay' && (
        <PaySheet
          amount={total}
          payBinding={bindTap<HTMLButtonElement>('checkout.pay.success', {
            params: { orderId: draft.draftOrderId },
            beforeTrigger: () => payCheckout(),
            // 下单后把已失效的 /checkout 一并移出返回栈,返回落到店铺主页而非"已提交"死页
            onTrigger: () => go('checkout.pay.success', { orderId: draft.draftOrderId }, { popTo: '/checkout', popToInclusive: true }),
          })}
          closeBinding={bindTap<HTMLButtonElement>('checkout.pay.abandon', {
            params: { orderId: draft.draftOrderId },
            beforeTrigger: () => abandonPay(),
            // 关收银台生成待支付单后,同样移除已失效的 /checkout,返回不落到"已提交"死页
            onTrigger: () => go('checkout.pay.abandon', { orderId: draft.draftOrderId }, { popTo: '/checkout', popToInclusive: true }),
          })}
        />
      )}
    </div>
  );
}
