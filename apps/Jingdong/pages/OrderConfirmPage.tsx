import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ActivityResult } from '@/os/types/manifest';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, PriceYuan, showToast } from '../components/ui';
import { PayPanel } from '../components/PayPanel';
import { IcMapPin, IcChevronRight, IcCheck, IcClose } from '../res/icons';

const PAY_METHODS = [
  { id: 'baitiao', label: '京东白条', sub: '先消费 后还款', tagline: '国家贴息', green: true },
  { id: 'jdpay', label: '京东支付·招商银行储蓄卡(0612)', sub: '换卡支付,最高减8.0元', tagline: '', green: false },
  { id: 'fufei', label: '先享后付', sub: '0元下单 先用后付', tagline: '', green: true },
  { id: 'wechat', label: '微信支付', sub: '', tagline: '', green: false },
];

export function OrderConfirmPage() {
  const { bindTap, bindBack, back, go } = useJingdongGestures();
  const [sp] = useSearchParams();
  const panel = sp.get('panel');
  // 立即购买:只结算当前商品,不把购物车已勾选整车带进来
  const buyItemId = sp.get('buyItemId') || '';
  const buyQty = Math.max(1, Number(sp.get('qty') || '1') || 1);
  const buySkuDesc = sp.get('skuDesc') || '';
  // 待付款订单·去支付:带已有 orderId 进入确认/支付页
  const pendingOrderId = sp.get('orderId') || '';
  // 本页刚创建的待付款单(placeOrder 会清购物车,需在 URL 更新前用本地 id 保住商品行)
  const [localOrderId, setLocalOrderId] = useState('');
  const effectiveOrderId = pendingOrderId || localOrderId;

  const cart = useJingdongStore((s) => s.cart);
  const items = useJingdongStore((s) => s.items);
  const orders = useJingdongStore((s) => s.orders);
  const addresses = useJingdongStore((s) => s.addresses);
  const selectedAddressId = useJingdongStore((s) => s.selectedAddressId);
  const coupons = useJingdongStore((s) => s.coupons);
  const placeOrder = useJingdongStore((s) => s.placeOrder);
  const payOrder = useJingdongStore((s) => s.payOrder);
  const setOrderPayMethod = useJingdongStore((s) => s.setOrderPayMethod);

  const pendingOrder = effectiveOrderId
    ? orders.find((o) => o.id === effectiveOrderId && o.status === 'unpaid')
    : undefined;
  const buyItem = buyItemId ? items.find((i) => i.id === buyItemId) : undefined;
  const checked = cart.filter((c) => c.checked);
  const lines = pendingOrder
    ? pendingOrder.lines.map((l) => ({
        itemId: l.itemId,
        title: l.title,
        image: l.image,
        skuDesc: l.skuDesc,
        price: l.price,
        qty: l.qty,
        self: pendingOrder.self,
        key: '',
      }))
    : buyItem
      ? [{ itemId: buyItem.id, title: buyItem.title, image: buyItem.image, skuDesc: buySkuDesc, price: buyItem.price, qty: buyQty, self: buyItem.self, key: '' }]
      : checked.length
        ? checked.map((c) => ({ itemId: c.itemId, title: c.title, image: c.image, skuDesc: c.skuDesc, price: c.price, qty: c.qty, self: c.self, key: c.key }))
        : [];

  const addr = addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault) || addresses[0];
  const itemTotal = lines.reduce((t, l) => t + l.price * l.qty, 0);

  const matchPayId = (label: string) =>
    PAY_METHODS.find((m) => label.includes(m.label) || m.label.includes(label))?.id ?? 'baitiao';

  const [giftMode, setGiftMode] = useState<'self' | 'gift'>('self');
  const [delivery, setDelivery] = useState<'express' | 'pickup'>('express');
  const [pay, setPay] = useState(() => (pendingOrder ? matchPayId(pendingOrder.payMethod) : 'baitiao'));
  const [period, setPeriod] = useState(0); // 0 不分期
  const [couponId, setCouponId] = useState<string | null>(null);
  const [couponTab, setCouponTab] = useState<'usable' | 'unusable'>('usable');

  const usableCoupons = coupons.filter((c) => c.claimed && c.threshold <= itemTotal + 0.01);
  const couponOff = couponId ? (usableCoupons.find((c) => c.id === couponId)?.amount ?? 0) : 0;
  const payLabel = PAY_METHODS.find((m) => m.id === pay)?.label ?? '';
  const total = Math.max(0, (pendingOrder?.paidAmount ?? itemTotal) - (pendingOrder ? 0 : couponOff));
  const periods = [0, ...(items.find((i) => i.id === lines[0]?.itemId)?.baitiaoPeriods ?? [3, 6])];

  // 创建待付款订单(中途取消密码弹层时订单留在待付款)
  const createUnpaidOrder = () => {
    if (pendingOrder) return pendingOrder.id;
    if (!lines.length) {
      showToast('请先选择商品');
      return '';
    }
    if (buyItem) {
      return placeOrder({
        itemId: buyItem.id,
        qty: buyQty,
        skuDesc: buySkuDesc,
        discount: couponOff,
        couponId: couponId ?? undefined,
        baitiaoPeriod: pay === 'baitiao' ? periods[period] : undefined,
        channel: 'shopping',
        payMethod: payLabel,
        status: 'unpaid',
      });
    }
    return placeOrder({
      keys: checked.map((c) => c.key),
      discount: couponOff,
      couponId: couponId ?? undefined,
      baitiaoPeriod: pay === 'baitiao' ? periods[period] : undefined,
      channel: 'shopping',
      payMethod: payLabel,
      status: 'unpaid',
    });
  };

  const openPayPanel = () => {
    const id = createUnpaidOrder();
    if (!id) return;
    setLocalOrderId(id);
    setOrderPayMethod(id, payLabel, pay === 'baitiao' ? periods[period] : undefined);
    go('confirm.pay-panel-open', { orderId: id });
  };

  /** 微信支付走跨 App 支付桥直接完成；其它方式打开密码弹层本地下单 */
  const submitPay = () => {
    if (pay !== 'wechat') {
      openPayPanel();
      return;
    }
    const id = createUnpaidOrder();
    if (!id) return;
    setLocalOrderId(id);
    setOrderPayMethod(id, payLabel, pay === 'baitiao' ? periods[period] : undefined);
    const launched = window.__OS__?.startActivityForResult?.(
      'wechat',
      {
        action: 'ACTION_PAY',
        scheme: 'weixin',
        data: {
          amount: total,
          orderId: `jd-${id}`,
          merchantName: '京东',
          subject: lines[0]?.title ?? '',
          source: 'jingdong',
        },
      },
      (result: ActivityResult) => {
        if (result.resultCode === 'OK') {
          payOrder(id);
          go('confirm.pay-done', { orderId: id });
        }
      },
    );
    if (!launched) openPayPanel();
  };

  const payAmount = pendingOrder?.paidAmount ?? total;

  if (!lines.length && panel !== 'pay') {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="确认订单" className="pt-10" />
        <div className="flex-1 flex items-center justify-center text-[#999] text-[14px]">暂无待结算商品</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="确认订单" className="pt-10" />

      {/* 自己买/送朋友 */}
      <div className="shrink-0 flex items-center justify-center gap-8 bg-white pb-1">
        {(['self', 'gift'] as const).map((m) => (
          <button
            key={m}
            {...bindTap({ kind: 'action', id: 'confirm.mode.select.gift' }, { onTrigger: () => setGiftMode(m) })}
            className={`py-1 text-[16px] ${giftMode === m ? 'text-[#1A1A1A] font-semibold' : 'text-[#999]'}`}
          >
            {m === 'self' ? '自己买' : '🎁 送朋友'}
            {giftMode === m && <div className="mx-auto mt-1 w-6 h-0.5 rounded bg-[#E1251B]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="confirm-scroll" data-scroll-direction="vertical">
        {/* 地址 */}
        <button {...bindTap('confirm.address-open')} className="w-full bg-white mt-2 px-3 py-3 flex items-center gap-2 text-left">
          <IcMapPin size={18} className="text-[#E1251B] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium text-[#1A1A1A] truncate">{addr.region} {addr.detail}</div>
            <div className="text-[12px] text-[#999] mt-0.5">{addr.name} {addr.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
          </div>
          <IcChevronRight size={16} className="text-[#CCC]" />
        </button>

        {/* 配送方式 */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="flex items-center gap-2 mb-2">
            {lines[0]?.self && <span className="text-[10px] px-1 rounded-sm bg-[#E1251B] text-white">自营</span>}
            <span className="text-[13px] text-[#666]">京东自营</span>
          </div>
          <div className="flex gap-2">
            {(['express', 'pickup'] as const).map((d) => (
              <button
                key={d}
                {...bindTap({ kind: 'action', id: 'confirm.delivery.select.method' }, { onTrigger: () => setDelivery(d) })}
                className={`px-4 py-1.5 rounded text-[13px] border ${delivery === d ? 'border-[#E1251B] text-[#E1251B] bg-[#FFF0EF]' : 'border-[#EEE] text-[#666]'}`}
              >{d === 'express' ? '京东快递' : '送至自提点'}</button>
            ))}
          </div>
          <div className="text-[12px] text-[#E1251B] mt-2">明天[周二] 09:00-15:00 可选京准达 · 免费上门退换</div>

          {/* 商品清单 */}
          {lines.map((l, i) => (
            <div key={l.key || `${l.itemId}_${i}`} className="flex gap-2.5 pt-3 mt-3 border-t border-[#F5F5F5]">
              <Img src={l.image} className="w-16 h-16 rounded-lg object-cover bg-[#F5F5F5]" alt={l.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] leading-[17px] text-[#1A1A1A] line-clamp-2">{l.title}</div>
                {l.skuDesc && <div className="text-[11px] text-[#999] mt-0.5">{l.skuDesc}</div>}
              </div>
              <div className="text-right">
                <PriceYuan value={l.price} className="text-[#1A1A1A] text-[14px]" />
                <div className="text-[12px] text-[#999]">x{l.qty}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 金额明细 */}
        <div className="bg-white mt-2 px-3 py-1 text-[13px]">
          <div className="flex justify-between py-2.5"><span className="text-[#666]">商品金额</span><span className="text-[#1A1A1A]">¥{itemTotal.toFixed(2)}</span></div>
          <div className="flex justify-between py-2.5 border-t border-[#F5F5F5]"><span className="text-[#666]">运费</span><span className="text-[#1A1A1A]">¥0.00</span></div>
          <button {...bindTap('confirm.coupon-open')} className="w-full flex justify-between items-center py-2.5 border-t border-[#F5F5F5]">
            <span className="text-[#666]">优惠券</span>
            <span className="flex items-center">
              {couponOff > 0
                ? <span className="text-[#E1251B]">-¥{couponOff.toFixed(2)}</span>
                : <span className="text-[#999]">{usableCoupons.length}张可用</span>}
              <IcChevronRight size={14} className="text-[#CCC]" />
            </span>
          </button>
          <div className="flex justify-end items-baseline py-2.5 border-t border-[#F5F5F5]">
            <span className="text-[#666] mr-2">合计:</span><PriceYuan value={total} className="text-[#E1251B] text-[17px]" />
          </div>
        </div>

        {/* 支付方式 */}
        <div className="bg-white mt-2 px-3 py-1">
          <div className="text-[14px] font-medium text-[#1A1A1A] py-2.5">支付方式</div>
          {PAY_METHODS.map((m) => (
            <div key={m.id} className="border-t border-[#F5F5F5]">
              <button
                {...bindTap({ kind: 'action', id: 'confirm.pay.select.method' }, { onTrigger: () => setPay(m.id) })}
                className="w-full flex items-center gap-2 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] text-[#1A1A1A]">{m.label}</span>
                    {m.tagline && <span className={`text-[10px] px-1 rounded-sm ${m.green ? 'bg-[#1BA956] text-white' : 'bg-[#E1251B] text-white'}`}>{m.tagline}</span>}
                  </div>
                  {m.sub && <div className={`text-[11px] mt-0.5 ${m.id === 'fufei' ? 'text-[#22B24C]' : 'text-[#999]'}`}>{m.sub}</div>}
                </div>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center ${pay === m.id ? 'bg-[#E1251B]' : 'border border-[#CCC]'}`}>
                  {pay === m.id && <IcCheck size={13} className="text-white" />}
                </span>
              </button>
              {/* 白条分期 */}
              {m.id === 'baitiao' && pay === 'baitiao' && (
                <div className="flex gap-2 pb-3 overflow-x-auto">
                  {periods.map((p, i) => (
                    <button
                      key={p}
                      {...bindTap({ kind: 'action', id: 'confirm.baitiao.select.period' }, { onTrigger: () => setPeriod(i) })}
                      className={`shrink-0 px-3 py-2 rounded text-[12px] border text-center ${period === i ? 'border-[#E1251B] bg-[#FFF0EF] text-[#E1251B]' : 'border-[#EEE] text-[#666]'}`}
                    >
                      <div className="font-medium">{p === 0 ? '不分期' : `¥${(total / p).toFixed(2)} x ${p}期`}</div>
                      <div className="text-[10px] mt-0.5">{p === 0 ? '0服务费' : '免息'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>

      {/* 底部支付:立即支付 → 创建待付款订单 + 打开密码弹层 */}
      <div className="shrink-0 flex items-center px-3 h-14 bg-white border-t border-[#EEE]">
        <div className="flex-1 text-[13px] text-[#666]">合计 <PriceYuan value={total} className="text-[#E1251B] text-[18px]" /></div>
        <button
          {...bindTap({ kind: 'action', id: 'confirm.pay.open' }, { onTrigger: submitPay })}
          className={`rounded-full text-white text-[15px] font-medium px-8 h-10 flex flex-col items-center justify-center leading-none ${
            pay === 'wechat' ? 'bg-[#07C160]' : 'bg-[#E1251B]'
          }`}
        >
          <span>{pay === 'baitiao' && period > 0 ? '分期付款' : '立即支付'} ¥{total.toFixed(2)}</span>
          {pay === 'baitiao' && period > 0 && <span className="text-[10px] font-normal mt-0.5">白条{periods[period]}期免息</span>}
        </button>
      </div>

      {/* 支付密码弹层:展示已选方式;关闭→待付款列表 */}
      {panel === 'pay' && pendingOrder && (
        <PayPanel
          amount={payAmount}
          payMethod={payLabel || pendingOrder.payMethod}
          onSuccess={() => {
            payOrder(pendingOrder.id);
            go('confirm.pay-done', { orderId: pendingOrder.id });
          }}
          onClose={() => {
            go('confirm.pay-close-to-unpaid');
          }}
        />
      )}

      {/* 优惠券弹层 */}
      {panel === 'coupon' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1 bg-black/40" />
          <div className="bg-white rounded-t-2xl h-[70%] flex flex-col">
            <div className="flex items-center justify-center relative py-3 border-b border-[#F5F5F5]">
              <span className="text-[16px] font-semibold">优惠券</span>
              <button {...bindBack()} aria-label="关闭" className="absolute right-3 w-7 h-7 flex items-center justify-center">
                <IcClose size={20} className="text-[#999]" />
              </button>
            </div>
            <div className="flex px-3 py-2 gap-2">
              {(['usable', 'unusable'] as const).map((t) => (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'ordercoupon.tab.select.usable' }, { onTrigger: () => setCouponTab(t) })}
                  className={`flex-1 py-2 rounded-lg text-[14px] font-medium ${couponTab === t ? 'text-[#E1251B] bg-[#FFF0EF]' : 'text-[#666] bg-[#F7F7F7]'}`}
                >{t === 'usable' ? `可用券 ${usableCoupons.length}` : '不可用券 0'}</button>
              ))}
            </div>
            <div className="flex justify-between px-3 py-2 text-[13px]">
              <span className="text-[#333]">已选优惠共减</span>
              <span className="text-[#E1251B] font-semibold">-¥{couponOff.toFixed(2)}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-2">
              {couponTab === 'usable' && usableCoupons.map((c) => {
                const on = couponId === c.id;
                return (
                  <button
                    key={c.id}
                    {...bindTap({ kind: 'action', id: 'ordercoupon.item.choose' }, { onTrigger: () => setCouponId(on ? null : c.id) })}
                    className="w-full flex items-center bg-[#FFFBEF] rounded-lg p-3 mb-2 text-left"
                  >
                    <div className="w-20 text-center border-r border-dashed border-[#E8D9A8] pr-2">
                      <div className="text-[#B8860B]"><span className="text-[14px]">¥</span><span className="text-[26px] font-bold">{c.amount}</span></div>
                    </div>
                    <div className="flex-1 pl-3 min-w-0">
                      <div className="text-[15px] font-semibold text-[#1A1A1A]">满{c.threshold}元可用</div>
                      <div className="text-[12px] text-[#666] mt-0.5 truncate">{c.scope}</div>
                      <div className="text-[11px] text-[#E1251B] mt-0.5">{c.expire}</div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${on ? 'bg-[#E1251B]' : 'border border-[#CCC]'}`}>
                      {on && <IcCheck size={13} className="text-white" />}
                    </span>
                  </button>
                );
              })}
              {couponTab === 'usable' && usableCoupons.length === 0 && <div className="text-center text-[#BBB] text-[13px] py-10">暂无可用优惠券</div>}
              {couponTab === 'unusable' && <div className="text-center text-[#BBB] text-[13px] py-10">暂无不可用优惠券</div>}
            </div>
            <div className="p-3">
              <button
                {...bindTap({ kind: 'action', id: 'ordercoupon.apply.confirm' }, { onTrigger: () => { showToast(couponOff > 0 ? `已抵扣¥${couponOff.toFixed(2)}` : '未选择优惠券'); back(); } })}
                className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-medium"
              >确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
