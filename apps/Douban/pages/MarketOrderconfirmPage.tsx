import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanStore } from '../state';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { C, Img } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { CheckCircle, fmt2, maskPhone } from './marketShared';
import { payWithSystem } from '../capabilities';

// 节点: market.orderConfirm —— 确认订单。
// 无地址(运费¥10)/有地址(¥0) · 代金券弹层(用小豆兑换5元/不使用/优惠码) · 支付方式 radio · 提交→payResult。

type PayMethod = 'wechat' | 'alipay';

export default function MarketOrderconfirmPage() {
  const { bindBack, bindTap, go } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const products = useDoubanStore((s) => s.products);
  const cart = useDoubanStore((s) => s.cart);
  const addresses = useDoubanStore((s) => s.addresses);
  const coupons = useDoubanStore((s) => s.coupons);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const redeemCoupon = useDoubanStore((s) => s.redeemCoupon);
  const submitOrder = useDoubanStore((s) => s.submitOrder);
  const repayOrder = useDoubanStore((s) => s.repayOrder);

  const defaultAddr = useMemo(() => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null, [addresses]);

  const lines = useMemo(() => {
    const checked = cart.filter((c) => c.checked);
    return checked
      .map((c) => ({ product: products.find((p) => p.id === c.productId), sku: c.sku, count: c.count }))
      .filter((l): l is { product: NonNullable<typeof l.product>; sku: string; count: number } => !!l.product);
  }, [cart, products]);

  const goodsTotal = useMemo(() => lines.reduce((s, l) => s + l.product.price * l.count, 0), [lines]);
  const freight = defaultAddr ? 0 : 10;

  // 代金券
  const voucher = coupons.find((c) => c.id === 'cp_5yuan');
  const [couponSel, setCouponSel] = useState<'voucher5' | 'none'>('none');
  const couponUsed = couponSel === 'voucher5' && voucher?.owned ? voucher.amount : 0;

  const payable = Math.max(0, goodsTotal + freight - couponUsed);

  const [pay, setPay] = useState<PayMethod>('wechat');

  const sheet = searchParams.get('sheet'); // coupon
  const openCoupon = () => setSearchParams((p) => { p.set('sheet', 'coupon'); return p; });
  const closeSheet = () => setSearchParams((p) => { p.delete('sheet'); return p; });

  const redeemVoucher = () => {
    if (!voucher) return;
    if ((currentUser.beans ?? 0) < voucher.costBeans) {
      toast('小豆余额不足');
      return;
    }
    redeemCoupon(voucher.id);
    setCouponSel('voucher5');
    toast('已兑换代金券');
  };

  const submit = () => {
    if (lines.length === 0) {
      toast('请选择商品');
      return;
    }
    if (!defaultAddr) {
      toast('请填写收货地址');
      return;
    }
    const finish = () => {
      submitOrder(defaultAddr.id, couponSel === 'voucher5' && voucher?.owned ? voucher.id : null);
      const order = useDoubanStore.getState().orders[0];
      if (order) {
        repayOrder(order.id);
        go('market.orderConfirm.payResult-open', { orderId: order.id });
      }
    };
    const subject = lines[0]?.product.title ?? '豆瓣市集';
    const launched = payWithSystem(
      {
        amount: payable,
        orderId: `db-${lines[0]?.product.id ?? '0'}`,
        subject,
        method: pay,
      },
      (result) => { if (result.resultCode === 'OK') finish(); },
    );
    if (!launched) toast('无法打开系统支付');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <button {...bindBack()} className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.green }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>确认订单信息</div>
        <div className="w-12 flex items-center justify-end pr-2">
          <span className="text-lg" style={{ color: C.text }}>…</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 收货地址(分组标题 + 卡片) */}
        <div className="px-4 pt-3 pb-1 text-[13px] font-semibold" style={{ color: C.text, background: C.bg }}>收货地址</div>
        {defaultAddr ? (
          <button
            {...bindTap('market.orderConfirm.addressList-open')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border-none cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: C.text }}>
                收货人:{defaultAddr.name} <span className="ml-2 font-normal">{maskPhone(defaultAddr.phone)}</span>
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: C.sub }}>{defaultAddr.region} {defaultAddr.detail}</div>
            </div>
            <span className="text-lg" style={{ color: C.sub }}>›</span>
          </button>
        ) : (
          <button
            {...bindTap('market.orderConfirm.address-open')}
            className="w-full flex flex-col items-center gap-2 py-6 bg-white border-none cursor-pointer"
          >
            <span className="text-3xl font-light" style={{ color: '#B9BEC6' }}>+</span>
            <span className="text-sm" style={{ color: C.danger }}>新建地址</span>
          </button>
        )}

        {/* 商品清单 */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="text-[13px] font-semibold mb-2" style={{ color: C.text }}>豆瓣豆品</div>
          {lines.map((l, i) => (
            <div key={i} className="flex gap-3 py-2">
              <Img src={l.product.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] line-clamp-2" style={{ color: C.text }}>{l.product.title}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>{l.sku}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[13px] font-semibold" style={{ color: C.text }}>¥{fmt2(l.product.price)}</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>×{l.count}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t mt-1" style={{ borderColor: C.border }}>
            <span className="text-[13px]" style={{ color: C.text }}>运费</span>
            <span className="text-[13px]" style={{ color: C.text }}>{freight === 0 ? '¥0.00' : `¥${fmt2(freight)}`}</span>
          </div>
        </div>

        {/* 代金券行 */}
        <button
          {...bindTap({ kind: 'action', id: 'market.orderConfirm.couponSheet.open' }, { onTrigger: openCoupon })}
          className="w-full flex items-center gap-2 px-4 py-3.5 mt-2 bg-white border-none cursor-pointer text-left"
        >
          <span className="text-[13px]" style={{ color: C.text }}>市集代金券</span>
          <span className="ml-auto text-[13px]" style={{ color: couponUsed > 0 ? C.danger : C.sub }}>
            {couponUsed > 0 ? `-¥${fmt2(couponUsed)}` : '领取代金券 ›'}
          </span>
        </button>

        {/* 支付方式 */}
        <div className="mt-2 bg-white">
          <div className="px-4 pt-3 pb-1 text-[13px] font-semibold" style={{ color: C.text }}>选择支付方式</div>
          <button
            {...bindTap({ kind: 'action', id: 'market.orderConfirm.pay.select.wechat' }, { onTrigger: () => setPay('wechat') })}
            className="w-full flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-left bg-transparent"
          >
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs shrink-0" style={{ background: '#09BB07' }}>微</span>
            <span className="flex-1 text-[14px]" style={{ color: C.text }}>使用微信支付</span>
            <Radio on={pay === 'wechat'} />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'market.orderConfirm.pay.select.alipay' }, { onTrigger: () => setPay('alipay') })}
            className="w-full flex items-center gap-3 px-4 py-3 border-none cursor-pointer text-left bg-transparent"
          >
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs shrink-0" style={{ background: '#1677FF' }}>支</span>
            <span className="flex-1 text-[14px]" style={{ color: C.text }}>使用支付宝支付</span>
            <Radio on={pay === 'alipay'} />
          </button>
        </div>

        {/* 价格明细 */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="text-[13px] font-semibold mb-2" style={{ color: C.text }}>价格明细</div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px]" style={{ color: C.sub }}>商品金额</span>
            <span className="text-[13px]" style={{ color: C.text }}>¥{fmt2(goodsTotal)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[13px]" style={{ color: C.sub }}>运费</span>
            <span className="text-[13px]" style={{ color: C.text }}>¥{fmt2(freight)}</span>
          </div>
          {couponUsed > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-[13px]" style={{ color: C.sub }}>市集代金券</span>
              <span className="text-[13px]" style={{ color: C.danger }}>-¥{fmt2(couponUsed)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t mt-1" style={{ borderColor: C.border }}>
            <span className="text-[13px]" style={{ color: C.text }}>合计</span>
            <span className="text-[13px] font-bold" style={{ color: C.danger }}>¥{fmt2(payable)}</span>
          </div>
        </div>
      </div>

      {/* 底部提交条:应付 + 共优惠汇总链 + 红色方角提交 */}
      <div className="flex items-center h-14 px-4 shrink-0 border-t bg-white" style={{ borderColor: C.border }}>
        <div className="mr-auto leading-tight">
          <div>
            <span className="text-xs" style={{ color: C.text }}>应付: </span>
            <span className="text-lg font-bold" style={{ color: C.danger }}>¥{fmt2(payable)}</span>
          </div>
          {couponUsed > 0 && (
            <button
              {...bindTap({ kind: 'action', id: 'market.orderConfirm.couponSheet.open' }, { onTrigger: openCoupon })}
              className="text-[11px] bg-transparent border-none p-0 cursor-pointer"
              style={{ color: C.danger }}
            >
              共优惠¥{fmt2(couponUsed)} 查看明细 ˄
            </button>
          )}
        </div>
        <button
          {...bindTap('market.orderConfirm.payResult-open', { onTrigger: submit })}
          className="h-10 px-6 rounded text-white text-sm font-semibold border-none cursor-pointer"
          style={{ background: C.danger }}
        >
          提交订单
        </button>
      </div>

      {/* 代金券弹层 */}
      {sheet === 'coupon' && (
        <Sheet title="市集代金券">
          <div className="px-4 pb-2 space-y-2">
            {/* 5元代金券:用小豆兑换 / 已拥有可勾选 */}
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: C.border }}>
              <div className="text-center px-2" style={{ color: C.danger }}>
                <span className="text-xs">¥</span><span className="text-2xl font-bold">5</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: C.text }}>市集通用代金券</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>有效期 {voucher?.validDays ?? 3} 天 · {voucher?.costBeans ?? 5} 小豆兑换</div>
              </div>
              {voucher?.owned ? (
                <button
                  {...bindTap({ kind: 'action', id: 'market.orderConfirm.coupon.select.voucher5' }, { onTrigger: () => setCouponSel('voucher5') })}
                  className="bg-transparent border-none p-0 cursor-pointer shrink-0"
                >
                  <CheckCircle checked={couponSel === 'voucher5'} />
                </button>
              ) : (
                <button
                  {...bindTap({ kind: 'action', id: 'market.orderConfirm.coupon.select.voucher5' }, { onTrigger: redeemVoucher })}
                  className="h-7 px-3 rounded-full text-white text-xs border-none cursor-pointer shrink-0"
                  style={{ background: C.green }}
                >
                  用小豆兑换
                </button>
              )}
            </div>

            {/* 不使用优惠券 */}
            <button
              {...bindTap({ kind: 'action', id: 'market.orderConfirm.coupon.select.none' }, { onTrigger: () => setCouponSel('none') })}
              className="w-full flex items-center gap-3 p-3 rounded-lg border bg-transparent cursor-pointer text-left"
              style={{ borderColor: C.border }}
            >
              <span className="flex-1 text-[13px]" style={{ color: C.text }}>不使用优惠券</span>
              <CheckCircle checked={couponSel === 'none'} />
            </button>

            {/* 优惠码输入 + 兑换 */}
            <RedeemCode
              bind={bindTap({ kind: 'action', id: 'market.orderConfirm.coupon.redeemCode' }, { onTrigger: () => toast('优惠码无效') })}
            />

            <button
              onClick={closeSheet}
              className="w-full h-11 mt-1 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
              style={{ background: C.green }}
            >
              确定
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ border: on ? `none` : '1.5px solid #C9CDD3', background: on ? C.green : 'transparent' }}
    >
      {on && <span className="w-2 h-2 rounded-full bg-white" />}
    </span>
  );
}

function RedeemCode({ bind }: { bind: object }) {
  const [code, setCode] = useState('');
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: C.border }}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="输入优惠码"
        className="flex-1 h-8 px-2 text-[13px] bg-transparent outline-none"
        style={{ color: C.text }}
      />
      <button {...bind} className="h-8 px-4 rounded-full text-xs border-none cursor-pointer" style={{ background: '#F2F3F5', color: C.text }}>
        兑换
      </button>
    </div>
  );
}
