import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useTaobaoStore } from '../state';
import { REFUND_TYPES } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, ShopBadge, BottomSheet, usePanel, useToast } from '../components/ui';
import { PayPanel } from '../components/PayPanel';
import { formatCountdown, formatDateTime, formatRemain } from '../utils/format';

const SERVICE_ITEMS = [
  { name: '退货宝', desc: '服务已生效,退换货运费保障' },
  { name: '7天价保', desc: '买贵了可申请退差价' },
  { name: '过敏包退', desc: '使用后过敏可退货退款' },
  { name: '假一赔四', desc: '判定假货可获四倍赔付' },
  { name: '极速退款', desc: '满足条件秒到账' },
  { name: '7天无理由退换', desc: '商品完好不影响二次销售可申请' },
];

/** 订单详情(spec: orders.detail + refundType/service/pay 弹层) */
export default function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const { value: panel, open: openPanel } = usePanel();
  const { bindTap, back, go } = useTaobaoGestures();
  const [toast, showToast] = useToast();

  const order = useTaobaoStore((s) => s.orders.find((o) => o.id === orderId));
  const markOrderPaid = useTaobaoStore((s) => s.markOrderPaid);
  const confirmReceipt = useTaobaoStore((s) => s.confirmReceipt);
  const extendReceipt = useTaobaoStore((s) => s.extendReceipt);
  const buyAgain = useTaobaoStore((s) => s.buyAgain);

  const [refundType, setRefundType] = useState('退货/退款');
  const [tick, setTick] = useState(0);

  // 倒计时刷新(模拟时间)
  useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  void tick;

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F7]">
        <TopBar title="订单详情" />
        <div className="flex-1 flex items-center justify-center text-[#999999]">订单不存在</div>
      </div>
    );
  }

  const now = TimeService.now();
  const statusHead =
    order.status === 'pendingPayment'
      ? { title: '待付款', sub: order.payDeadline ? `剩余 ${formatCountdown(order.payDeadline - now)} 自动关闭` : '' }
      : order.status === 'pendingShip'
        ? { title: '待发货', sub: '48小时内发货' }
        : order.status === 'shipped'
          ? { title: '已发货', sub: order.autoConfirmAt ? `还剩${formatRemain(order.autoConfirmAt - now)}自动确认` : '' }
          : order.status === 'completed'
            ? { title: '交易成功', sub: '' }
            : { title: '退款成功', sub: '' };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title="订单详情" />

      <div className="flex-1 overflow-y-auto px-2.5" data-scroll-container="order-detail" data-scroll-direction="vertical">
        {/* 状态头 */}
        <div className="mt-2 bg-gradient-to-r from-[#FF5000] to-[#FF7A45] rounded-t-xl text-white px-3 py-3">
          <div className="text-[17px] font-bold">{statusHead.title}</div>
          {statusHead.sub && <div className="text-[12px] opacity-90 mt-0.5">{statusHead.sub}</div>}
        </div>

        {/* 物流摘要 + 地址 */}
        <div className="bg-white px-3 py-2.5">
          {order.status === 'shipped' || order.status === 'completed' ? (
            <div
              {...bindTap('orders.logistics-open', { params: { orderId: order.id } })}
              className="text-[13px] cursor-pointer pb-2 border-b border-[#F5F5F5]"
            >
              <span className="text-[#FF5000] font-semibold">
                {order.logistics.noLogistics ? '商家选择无需物流发货,暂无物流信息' : (order.logistics.nodes[0]?.status ?? '已发货')}
              </span>
              {!order.logistics.noLogistics && order.logistics.nodes[0] && (
                <span className="text-[#999999] ml-2">{order.logistics.nodes[0].desc}</span>
              )}
              <span className="text-[#999999] float-right">›</span>
            </div>
          ) : null}
          <div className="flex gap-2 pt-2">
            <span>📍</span>
            <div className="flex-1 text-[13px]">
              <div>{order.addressSnapshot.full}</div>
              <div className="text-[#999999] text-[12px] mt-0.5">
                {order.addressSnapshot.name} {order.addressSnapshot.phone}
                <span className="ml-1 text-[10px] border border-[#CCCCCC] rounded px-0.5">号码保护中</span>
              </div>
            </div>
          </div>
        </div>

        {/* 商品 */}
        <div className="bg-white rounded-b-xl px-3 py-2.5 mt-px">
          <div className="flex items-center text-[13px] mb-1">
            <ShopBadge badge={order.shopBadge} />
            <span className="font-semibold">{order.shopName}</span>
            <span className="text-[#999999] ml-0.5">›</span>
          </div>
          {order.lines.map((l) => (
            <div key={l.itemId} className="flex gap-2.5 py-2">
              <Img src={l.image} className="w-18 h-18 w-20 h-20 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] line-clamp-2 leading-snug">{l.title}</div>
                <div className="text-[11px] text-[#999999] mt-0.5">{l.skuDesc}</div>
                <div className="text-[11px] text-[#FF5000] mt-0.5">不支持7天无理由</div>
              </div>
              <div className="text-right shrink-0">
                <Price value={l.price} size="s" />
                <div className="text-[11px] text-[#999999]">x{l.qty}</div>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2 mt-1">
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.order.buyAgain' }, {
                params: { orderId: order.id },
                onTrigger: () => { buyAgain(order.id); showToast('已加入购物车'); },
              })}
              className="text-[12px] rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5 cursor-pointer"
            >
              加入购物车
            </button>
            {(order.status === 'shipped' || order.status === 'completed') && (
              <button
                {...bindTap({ kind: 'action', id: 'orderDetail.refund.open' }, {
                  params: { orderId: order.id },
                  onTrigger: () => openPanel('refundType'),
                })}
                className="text-[12px] rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5 cursor-pointer"
              >
                申请售后
              </button>
            )}
          </div>
          {order.gift && (
            <div className="flex justify-between text-[12px] text-[#666666] border-t border-[#F8F8F8] pt-2 mt-2">
              <span>赠品 {order.gift}</span><span>1件</span>
            </div>
          )}
        </div>

        {/* 金额 */}
        <div className="bg-white rounded-xl mt-2 px-3 py-1">
          <KV k={`商品总价 共${order.lines.length}件`} v={`¥${order.itemTotal}`} />
          {order.shopDiscount > 0 && <KV k="店铺优惠 含官方立减" v={`-¥${order.shopDiscount}`} red />}
          <KV k="运费(快递)" v={`¥${order.shippingFee}`} />
          <div className="flex justify-between py-2.5 text-[13px]">
            <span className="font-semibold">{order.status === 'pendingPayment' ? '需付款' : '实付款'}</span>
            <Price value={order.paidAmount} size="m" />
          </div>
        </div>

        {/* 订单信息 */}
        <div className="bg-white rounded-xl mt-2 px-3 py-1">
          <div className="flex justify-between items-center py-2.5 text-[13px]">
            <span className="text-[#666666]">订单编号 {order.orderNo}</span>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.orderNo.copy' }, {
                onTrigger: () => {
                  window.__OS__?.clipboard?.copyText?.(order.orderNo);
                  showToast('已复制');
                },
              })}
              className="text-[12px] text-[#333333] border border-[#DDDDDD] rounded-full px-2 py-0.5 bg-white cursor-pointer"
            >
              复制
            </button>
          </div>
          {order.payMethod && <KV k="支付方式" v={order.payMethod} />}
          <KV k="交易快照" v="发生交易争议时,可作为判断依据 ›" />
          <KV k="创建时间" v={formatDateTime(order.createdAt)} />
          {order.paidAt && <KV k="付款时间" v={formatDateTime(order.paidAt)} />}
          {order.shippedAt && <KV k="发货时间" v={formatDateTime(order.shippedAt)} />}
          {order.completedAt && <KV k="成交时间" v={formatDateTime(order.completedAt)} />}
        </div>

        {/* 服务保障 */}
        <div className="bg-white rounded-xl mt-2 px-3 py-2.5 mb-3">
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold">服务保障</span>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.service.open' }, {
                onTrigger: () => openPanel('service'),
              })}
              className="text-[12px] text-[#999999] bg-transparent border-none cursor-pointer"
            >
              查看更多 ›
            </button>
          </div>
          <div className="flex gap-3 mt-1.5 text-[12px] text-[#666666]">
            <span>🛡️ 退货宝</span><span>7天价保</span><span>假一赔四</span><span>极速退款</span>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center justify-end px-3 py-2 gap-2">
        {order.status === 'pendingPayment' && (
          <>
            <span className="mr-auto text-[13px]">合计: <Price value={order.paidAmount} size="m" /></span>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.pay.open' }, { onTrigger: () => openPanel('pay') })}
              className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[14px] px-5 py-2.5 border-none cursor-pointer"
            >
              继续付款 {order.payDeadline ? `剩余${formatCountdown(order.payDeadline - now)}` : ''}
            </button>
          </>
        )}
        {order.status === 'shipped' && (
          <>
            <button
              {...bindTap({ kind: 'action', id: 'orders.receipt.extend' }, {
                params: { orderId: order.id },
                onTrigger: () => { extendReceipt(order.id); showToast('已延长收货3天'); },
              })}
              className="text-[13px] rounded-full border border-[#DDDDDD] bg-white px-3.5 py-2 cursor-pointer"
            >
              延长收货
            </button>
            <button
              {...bindTap('orders.logistics-open', { params: { orderId: order.id } })}
              className="text-[13px] rounded-full border border-[#DDDDDD] bg-white px-3.5 py-2 cursor-pointer"
            >
              查看物流
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.receipt.confirm' }, {
                params: { orderId: order.id },
                onTrigger: () => openPanel('confirmReceipt'),
              })}
              className="text-[13px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white px-3.5 py-2 border-none cursor-pointer"
            >
              确认收货
            </button>
          </>
        )}
        {order.status === 'completed' && (
          <>
            <button
              {...bindTap('orders.logistics-open', { params: { orderId: order.id } })}
              className="text-[13px] rounded-full border border-[#DDDDDD] bg-white px-3.5 py-2 cursor-pointer"
            >
              查看物流
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.order.buyAgain' }, {
                params: { orderId: order.id },
                onTrigger: () => { buyAgain(order.id); showToast('已加入购物车'); },
              })}
              className="text-[13px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white px-3.5 py-2 border-none cursor-pointer"
            >
              再买一单
            </button>
          </>
        )}
      </div>

      {/* 售后类型弹层 */}
      {panel === 'refundType' && (
        <BottomSheet onClose={() => back()} title="选择售后类型">
          <div className="px-4 pb-2">
          <div className="flex gap-2 items-center mb-1">
            <Img src={order.lines[0].image} className="w-12 h-12 rounded-lg" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] line-clamp-1">{order.lines[0].title}</div>
              <div className="text-[11px] text-[#999999]">{order.lines[0].skuDesc}</div>
            </div>
          </div>
          <div className="text-[11px] text-[#C2410C] bg-[#FFF7EC] rounded px-2 py-1 mb-1">🛡️ 本单享退货宝 免首重运费</div>
          {REFUND_TYPES.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'refund.type.select.option' }, {
                params: { type: t.label },
                onTrigger: () => setRefundType(t.label),
              })}
              className="w-full flex items-center justify-between py-3 bg-transparent border-none border-b border-[#F8F8F8] cursor-pointer"
            >
              <span className="text-left">
                <span className="text-[14px]">{t.label}</span>
                <span className="block text-[11px] text-[#999999] mt-0.5">{t.desc}</span>
              </span>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 ${
                refundType === t.label ? 'bg-[#FF5000] border-[#FF5000] text-white' : 'border-[#CCCCCC] text-transparent'
              }`}>✓</span>
            </button>
          ))}
          <button
            {...bindTap('refund.form-open', { params: { orderId: order.id, type: refundType } })}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] border-none cursor-pointer mt-3 mb-2"
          >
            下一步
          </button>
          </div>
        </BottomSheet>
      )}

      {/* 服务保障弹层 */}
      {panel === 'service' && (
        <BottomSheet onClose={() => back()} title="服务保障">
          <div className="px-4 pb-3 grid grid-cols-2 gap-2">
            {SERVICE_ITEMS.map((sItem) => (
              <div key={sItem.name} className="bg-[#FAFAFA] rounded-xl p-3">
                <div className="text-[13px] font-semibold">{sItem.name} <span className="text-[#00B578]">✓</span></div>
                <div className="text-[11px] text-[#999999] mt-1 leading-relaxed">{sItem.desc}</div>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* 继续付款弹层 */}
      {panel === 'pay' && (
        <PayPanel
          amount={order.paidAmount}
          onSuccess={() => {
            markOrderPaid(order.id);
            go('pay.success-open', { orderId: order.id });
          }}
          onClose={() => back()}
        />
      )}

      {/* 确认收货弹层(复用 orders.list 的 actionId) */}
      {panel === 'confirmReceipt' && (
        <BottomSheet onClose={() => back()} title="确认收到货了吗">
          <div className="px-4 pb-2">
            <div className="text-[12px] text-[#999999] mb-2">请收到商品确认无误后再确认收货</div>
            <button
              {...bindTap({ kind: 'action', id: 'orders.confirmReceipt.confirm' }, {
                params: { orderId: order.id },
                onTrigger: () => { confirmReceipt(order.id); back(); showToast('确认收货成功'); },
              })}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[15px] border-none cursor-pointer mb-2"
            >
              确认收货
            </button>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}

function KV({ k, v, red }: { k: string; v: string; red?: boolean }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-[#F8F8F8] text-[13px] last:border-0">
      <span className="text-[#666666]">{k}</span>
      <span className={red ? 'text-[#FF0036]' : 'text-[#111111]'}>{v}</span>
    </div>
  );
}
