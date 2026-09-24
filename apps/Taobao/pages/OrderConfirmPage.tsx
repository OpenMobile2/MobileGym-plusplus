import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, ShopBadge, usePanel } from '../components/ui';
import { PayPanel } from '../components/PayPanel';
import { IcArrowRight } from '../res/icons';
import { formatMoney } from '../utils/format';

/**
 * 确认订单(spec: order.confirm + order.payPanel)
 * - 地址卡 → 地址列表(select 模式)
 * - 立即支付 → 创建待付款订单 + 打开支付弹层
 * - 弹层关闭 → 订单留在待付款;输满6位 → 待发货 + 支付成功页
 */
export default function OrderConfirmPage() {
  const { bindTap, go, back } = useTaobaoGestures();
  const { value: panel, open: openPanel } = usePanel();

  const checkout = useTaobaoStore((s) => s.checkout);
  const addresses = useTaobaoStore((s) => s.addresses);
  const orders = useTaobaoStore((s) => s.orders);
  const setCheckoutPayMethod = useTaobaoStore((s) => s.setCheckoutPayMethod);
  const setCheckoutNote = useTaobaoStore((s) => s.setCheckoutNote);
  const createOrder = useTaobaoStore((s) => s.createOrder);
  const markOrderPaid = useTaobaoStore((s) => s.markOrderPaid);

  // 支付弹层打开后,订单已创建:取最近一笔待付款
  const pendingOrder = orders.find((o) => o.status === 'pendingPayment');

  if (!checkout && panel !== 'pay') {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F7]">
        <TopBar title="确认订单" />
        <div className="flex-1 flex items-center justify-center text-[#999999] text-[14px]">
          没有待结算的商品
        </div>
      </div>
    );
  }

  const addr = addresses.find((a) => a.id === checkout?.addressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];
  const lines = checkout?.lines ?? [];
  const itemTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const payMethod = checkout?.payMethod ?? '支付宝';
  const payAmount = panel === 'pay' && pendingOrder ? pendingOrder.paidAmount : itemTotal;

  const PAY_METHODS = ['支付宝', '分期付款', '花呗分期', '找朋友帮忙付'];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title={<span className="text-[13px]">🛡️ 7天无理由退货 · 极速退款 · 不符包赔</span>} />

      <div className="flex-1 overflow-y-auto px-2.5" data-scroll-container="order-confirm" data-scroll-direction="vertical">
        {/* 买给自己/送给朋友 */}
        <div className="flex bg-white rounded-t-xl mt-2 text-center text-[14px]">
          <div className="flex-1 py-2.5 font-semibold border-b-2 border-[#FF5000]">买给自己</div>
          <div className="flex-1 py-2.5 text-[#999999]">送给朋友</div>
        </div>

        {/* 地址卡 */}
        {addr && (
          <div
            {...bindTap('orderConfirm.address.change')}
            className="bg-white px-3 py-3 flex items-center gap-2 cursor-pointer"
          >
            <span className="text-[#FF5000]">📍</span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">{addr.detail}</div>
              <div className="text-[12px] text-[#999999] mt-0.5">
                {addr.region} · {addr.name} {addr.phone.slice(0, 3)}****{addr.phone.slice(-4)}
                <span className="ml-1 text-[10px] border border-[#CCCCCC] rounded px-0.5">号码保护中</span>
              </div>
            </div>
            <IcArrowRight size={16} className="text-[#999999]" />
          </div>
        )}

        {/* 商品卡 */}
        <div className="bg-white rounded-b-xl px-3 pb-3">
          {lines.map((l) => (
            <div key={l.itemId + l.skuDesc} className="pt-3">
              <div className="flex gap-2.5">
                <Img src={l.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] leading-snug line-clamp-2">{l.title}</div>
                  <div className="text-[11px] text-[#999999] mt-1">{l.skuDesc}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">7天无理由退货 · 极速退款</div>
                </div>
                <div className="text-right shrink-0">
                  <Price value={l.price} size="m" />
                  <div className="text-[11px] text-[#999999] mt-1">x{l.qty}</div>
                </div>
              </div>
            </div>
          ))}
          {/* 配送等行 */}
          <Row label="配送" value="快递 包邮 · 预计后天送达" />
          <Row label="退货权益" value="退换货无忧服务 可逆择" />
          <Row label="备注" custom>
            <input
              {...bindTap({ kind: 'action', id: 'orderConfirm.note.edit' }, { onTrigger: () => {} })}
              placeholder="选填,请先和商家协商一致"
              defaultValue={checkout?.note ?? ''}
              onChange={(e) => setCheckoutNote(e.target.value)}
              className="text-right text-[13px] bg-transparent border-none outline-none flex-1"
            />
          </Row>
        </div>

        {/* 价格明细 */}
        <div className="bg-white rounded-xl mt-2 px-3 py-1">
          <Row label="商品总价" value={`¥${formatMoney(itemTotal)}`} />
          <Row label="店铺优惠" value="不可用" dim />
          <Row label="平台优惠" value="不可用" dim />
          <Row label="红包(消费券未抵)" value="不可用" dim />
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="font-semibold">合计</span>
            <Price value={itemTotal} size="m" />
          </div>
        </div>

        {/* 支付方式 */}
        <div className="bg-white rounded-xl mt-2 px-3 py-1 mb-3">
          {PAY_METHODS.map((m) => (
            <button
              key={m}
              {...bindTap({ kind: 'action', id: 'orderConfirm.payMethod.select.option' }, {
                params: { method: m },
                onTrigger: () => setCheckoutPayMethod(m),
              })}
              className="w-full flex items-center justify-between h-10 bg-transparent border-none cursor-pointer"
            >
              <span className="text-[13px] flex items-center gap-1.5">
                {m === '支付宝' && <span className="text-[#1677FF]">支</span>}
                {m}
                {m === '分期付款' && <span className="text-[10px] text-[#FF5000] bg-[#FFF1E8] rounded px-1">国家贴息 最高3期免息</span>}
              </span>
              <span className={`w-4.5 h-4.5 w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${
                payMethod === m ? 'bg-[#FF5000] border-[#FF5000] text-white' : 'border-[#CCCCCC] text-transparent'
              }`}>✓</span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部支付栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center justify-end px-3 py-2 gap-2">
        <span className="text-[12px] text-[#999999] mr-auto">共{lines.reduce((s, l) => s + l.qty, 0)}件</span>
        <button
          {...bindTap({ kind: 'action', id: 'orderConfirm.pay.open' }, {
            onTrigger: () => {
              if (!checkout) return;
              createOrder();
              openPanel('pay');
            },
          })}
          className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] font-medium px-6 py-2.5 border-none cursor-pointer"
        >
          ¥{formatMoney(itemTotal)} 立即支付
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
      <span className="text-[#666666] shrink-0">{label}</span>
      {custom ? children : <span className={dim ? 'text-[#BBBBBB]' : 'text-[#111111]'}>{value}</span>}
    </div>
  );
}
