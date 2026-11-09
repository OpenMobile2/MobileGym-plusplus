import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, ShopBadge, usePanel } from '../components/ui';
import { PayPanel } from '../components/PayPanel';
import { IcArrowRight } from '../res/icons';
import { formatMoney, fmt } from '../utils/format';
import type { TaobaoStringKey } from '../res/strings';
import type { ActivityResult } from '@/os/types/manifest';

/**
 * PAY_METHODS 的 value 与 bench_env(checkout.payMethod)强绑定,保持中文原值;
 * 展示文案通过 labelKey 转换,详见 res/strings.ts。
 */
const PAY_METHOD_KEYS: { value: string; labelKey: TaobaoStringKey }[] = [
  { value: '支付宝', labelKey: 'payAlipay' },
  { value: '分期付款', labelKey: 'payInstallment' },
  { value: '花呗分期', labelKey: 'payHuabeiInstallment' },
  { value: '找朋友帮忙付', labelKey: 'payAskFriend' },
];

/**
 * 确认订单(spec: order.confirm + order.payPanel)
 * - 地址卡 → 地址列表(select 模式)
 * - 立即支付 → 创建待付款订单 + 打开支付弹层
 * - 弹层关闭 → 订单留在待付款;输满6位 → 待发货 + 支付成功页
 */
export default function OrderConfirmPage() {
  const { bindTap, go, back } = useTaobaoGestures();
  const s = useStrings();
  const { value: panel, open: openPanel } = usePanel();

  const checkout = useTaobaoStore((st) => st.checkout);
  const addresses = useTaobaoStore((st) => st.addresses);
  const orders = useTaobaoStore((st) => st.orders);
  const setCheckoutPayMethod = useTaobaoStore((st) => st.setCheckoutPayMethod);
  const setCheckoutNote = useTaobaoStore((st) => st.setCheckoutNote);
  const createOrder = useTaobaoStore((st) => st.createOrder);
  const markOrderPaid = useTaobaoStore((st) => st.markOrderPaid);

  // 支付弹层打开后,订单已创建:取最近一笔待付款
  const pendingOrder = orders.find((o) => o.status === 'pendingPayment');

  if (!checkout && panel !== 'pay') {
    return (
      <div className="flex flex-col h-full bg-app-bg">
        <TopBar title={s.orderConfirmTitle} />
        <div className="flex-1 flex items-center justify-center text-app-text-muted text-[14px]">
          {s.noCheckoutItemsText}
        </div>
      </div>
    );
  }

  const addr = addresses.find((a) => a.id === checkout?.addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];
  const lines = checkout?.lines ?? [];
  const itemTotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const payMethod = checkout?.payMethod ?? '支付宝';
  const payAmount = panel === 'pay' && pendingOrder ? pendingOrder.paidAmount : itemTotal;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={<span className="text-[13px]">{s.orderConfirmShieldBanner}</span>} />

      <div className="flex-1 overflow-y-auto px-2.5" data-scroll-container="order-confirm" data-scroll-direction="vertical">
        {/* 买给自己/送给朋友 */}
        <div className="flex bg-app-surface rounded-t-xl mt-2 text-center text-[14px]">
          <div className="flex-1 py-2.5 font-semibold border-b-2 border-[#FF5000]">{s.buyForSelfLabel}</div>
          <div className="flex-1 py-2.5 text-app-text-muted">{s.giftToFriendLabel}</div>
        </div>

        {/* 地址卡 */}
        {addr && (
          <div
            {...bindTap('orderConfirm.address.change')}
            className="bg-app-surface px-3 py-3 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-[#FF5000]">📍</span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{addr.detail}</div>
              <div className="text-[12px] text-app-text-muted mt-0.5">
                {addr.region} · {addr.name} {addr.phone.slice(0, 3)}****{addr.phone.slice(-4)}
                <span className="ml-1 text-[10px] border border-[#CCCCCC] rounded px-0.5">{s.numberProtectedLabel}</span>
              </div>
            </div>
            <IcArrowRight size={16} className="text-app-text-muted" />
          </div>
        )}

        {/* 商品卡 */}
        <div className="bg-app-surface rounded-b-xl px-3 pb-3">
          {lines.map((l) => (
            <div key={l.itemId + l.skuDesc} className="pt-3">
              <div className="flex gap-2.5">
                <Img src={l.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-snug line-clamp-2">{l.title}</div>
                  <div className="text-[11px] text-app-text-muted mt-1">{l.skuDesc}</div>
                  <div className="text-[11px] text-app-text-muted mt-0.5">{s.itemDetailGuaranteeNoReason} · {s.serviceFastRefundName}</div>
                </div>
                <div className="text-right shrink-0">
                  <Price value={l.price} size="m" />
                  <div className="text-[11px] text-app-text-muted mt-1">x{l.qty}</div>
                </div>
              </div>
            </div>
          ))}
          {/* 配送等行 */}
          <Row label={s.deliveryLabel} value={s.deliveryValueText} />
          <Row label={s.returnBenefitsLabel} value={s.returnBenefitsValueText} />
          <Row label={s.noteLabel} custom>
            <input
              {...bindTap({ kind: 'action', id: 'orderConfirm.note.edit' }, { onTrigger: () => {} })}
              placeholder={s.notePlaceholder}
              defaultValue={checkout?.note ?? ''}
              onChange={(e) => setCheckoutNote(e.target.value)}
              className="text-right text-[13px] bg-transparent border-none outline-none flex-1"
            />
          </Row>
        </div>

        {/* 价格明细 */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-1">
          <Row label={s.itemTotalLabel} value={`¥${formatMoney(itemTotal)}`} />
          <Row label={s.shopDiscountLabel} value={s.notAvailableValueLabel} dim />
          <Row label={s.platformDiscountLabel} value={s.notAvailableValueLabel} dim />
          <Row label={s.redPacketLabel} value={s.notAvailableValueLabel} dim />
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="font-semibold">{s.totalLabel}</span>
            <Price value={itemTotal} size="m" />
          </div>
        </div>

        {/* 支付方式 */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-1 mb-3">
          {PAY_METHOD_KEYS.map((m) => (
            <button
              key={m.value}
              {...bindTap({ kind: 'action', id: 'orderConfirm.payMethod.select.option' }, {
                params: { method: m.value },
                onTrigger: () => setCheckoutPayMethod(m.value),
              })}
              className="w-full flex items-center justify-between h-10 bg-transparent border-none cursor-pointer"
            >
              <span className="text-[13px] flex items-center gap-1.5">
                {m.value === '支付宝' && <span className="text-[#1677FF]">支</span>}
                {s[m.labelKey]}
                {m.value === '分期付款' && <span className="text-[10px] text-[#FF5000] bg-[#FFF1E8] rounded px-1">{s.installmentSubsidyText}</span>}
              </span>
              <span className={`w-4.5 h-4.5 w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${
                payMethod === m.value ? 'bg-[#FF5000] border-[#FF5000] text-white' : 'border-[#CCCCCC] text-transparent'
              }`}>✓</span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部支付栏 */}
      <div className="shrink-0 bg-app-surface border-t border-app-border flex items-center justify-end px-3 py-2 gap-2">
        <span className="text-[12px] text-app-text-muted mr-auto">{fmt(s.totalItemsCountFmt, { count: lines.reduce((sum, l) => sum + l.qty, 0) })}</span>
        <button
          {...bindTap({ kind: 'action', id: 'orderConfirm.pay.open' }, {
            onTrigger: () => {
              if (!checkout) return;
              const orderId = createOrder();
              if (!orderId) return;

              // 支付宝：跨 app startActivityForResult → 支付宝收银台（抄 12306 路径）
              if (payMethod === '支付宝') {
                const launched = window.__OS__?.startActivityForResult?.(
                  'alipay',
                  {
                    action: 'ACTION_PAY',
                    scheme: 'alipays',
                    data: {
                      amount: itemTotal,
                      orderId,
                      merchantName: '淘宝',
                      subject: s.orderConfirmTitle,
                    },
                  },
                  (result: ActivityResult) => {
                    if (result.resultCode === 'OK') {
                      markOrderPaid(orderId);
                      go('pay.success-open', { orderId });
                    }
                    // CANCELED / FAILED：订单留在待付款，与本地弹层关闭语义一致
                  },
                );
                if (launched) return;
              }

              // 其他支付方式 / 支付宝未启动成功：回落本地密码弹层
              openPanel('pay');
            },
          })}
          className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] font-medium px-6 py-2.5 border-none cursor-pointer"
        >
          {fmt(s.payNowFmt, { amount: formatMoney(itemTotal) })}
        </button>
      </div>

      {/* 支付弹层 */}
      {panel === 'pay' && pendingOrder && (
        <PayPanel
          amount={payAmount}
          onSuccess={() => {
            markOrderPaid(pendingOrder.id);
            go('pay.success-open', { orderId: pendingOrder.id });
          }}
          onClose={() => back()}
        />
      )}
    </div>
  );
}

function Row({
  label, value, dim, custom, children,
}: { label: string; value?: string; dim?: boolean; custom?: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-t border-[#F8F8F8] text-[13px] gap-3">
      <span className="text-app-text-muted shrink-0">{label}</span>
      {custom ? children : <span className={dim ? 'text-[#BBBBBB]' : 'text-app-text'}>{value}</span>}
    </div>
  );
}
