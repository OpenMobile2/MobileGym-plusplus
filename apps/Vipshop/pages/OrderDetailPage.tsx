import React, { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { ClipboardService } from '@/os/ClipboardService';
import { sharePlainText } from '@/os/shareBridge';
import type { ActivityResult } from '@/os/types/manifest';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, BottomSheet, usePanel, useToast, EmptyState, VIP } from '../components/ui';
import { PAY_METHODS } from '../constants';
import { IcLocation, IcCopy, IcTruck, IcService, IcShield, IcMore } from '../res/icons';
import type { VipOrderStatus } from '../types';

const STATUS_LABEL: Record<VipOrderStatus, string> = {
  pendingPayment: '等待付款',
  pendingReceipt: '商家已发货,待收货',
  completed: '交易完成',
  canceled: '交易已取消',
  refunding: '退款处理中',
};

/** 剩余毫秒 → "28分46秒" */
function leftText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}分${String(s % 60).padStart(2, '0')}秒`;
}

export default function OrderDetailPage() {
  const { id = '' } = useParams();
  const { bindTap, go, back } = useVipshopGestures();
  const [toast, showToast] = useToast();
  const { value: panel } = usePanel();
  const location = useLocation();

  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id));
  const confirmReceipt = useVipshopStore((s) => s.confirmReceipt);
  const cancelOrder = useVipshopStore((s) => s.cancelOrder);
  const payOrder = useVipshopStore((s) => s.payOrder);

  // 倒计时每秒重渲染(仅待付款时)
  const [, forceTick] = React.useState(0);
  const isPending = order?.status === 'pendingPayment';
  useEffect(() => {
    if (!isPending) return undefined;
    const t = window.setInterval(() => forceTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [isPending]);

  // 从确认订单页 replace 过来时自动弹收银台;只弹一次,否则收银台按返回会被立刻重开
  const autoPayDone = useRef(false);
  const autoPay = (location.state as { autoPay?: boolean } | null)?.autoPay === true;
  useEffect(() => {
    if (!autoPay || autoPayDone.current || !isPending || panel) return;
    autoPayDone.current = true;
    go('orderDetail.pay-open', { id });
  }, [autoPay, isPending, panel, go, id]);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]">
        <TopBar title="订单详情" />
        <EmptyState text="订单不存在" />
      </div>
    );
  }

  const latestLog = order.logistics[0];
  const payLeft = order.payDeadline ? order.payDeadline - TimeService.now() : 0;
  const payExpired = order.status === 'pendingPayment' && order.payDeadline !== null && payLeft <= 0;

  const doPay = (label: string) => {
    payOrder(order.id, label);
    // 支付完成离开收银台,直接到支付成功页(replace 掉待付款详情这条)
    go('orderDetail.paid-open', { orderId: order.id }, { mode: 'replace' });
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      {/* 待付款顶栏对齐真机:标题即「待付款：¥179.00」,副标题是自动取消倒计时 */}
      <TopBar title={order.status === 'pendingPayment'
        ? <span>待付款：<span style={{ color: VIP.price }}>¥{order.paidAmount.toFixed(2)}</span></span>
        : '订单详情'} />

      <div className="flex-1 overflow-y-auto" data-scroll-container="order-detail" data-scroll-direction="vertical">
        {order.status === 'pendingPayment' ? (
          <div className="bg-white px-4 pb-2 text-center text-[12px] text-[#666666]">
            {payExpired
              ? '付款已超时,订单将自动取消'
              : <>剩 <span style={{ color: VIP.primary }}>{leftText(payLeft)}</span> 自动取消订单</>}
          </div>
        ) : (
          /* 状态 banner */
          <div className="px-4 py-4 text-white" style={{ background: `linear-gradient(135deg,#FF6FA5,${VIP.primary})` }}>
            <div className="text-[18px] font-semibold">{STATUS_LABEL[order.status]}</div>
          </div>
        )}

        {/* 物流摘要 */}
        {latestLog && order.status !== 'pendingPayment' && order.status !== 'canceled' && (
          <button
            {...bindTap('orderDetail.logistics-open', { params: { id: order.id } })}
            className="w-full bg-white px-3 py-3 flex items-center gap-2 border-none cursor-pointer text-left"
          >
            <IcTruck size={18} style={{ color: VIP.primary }} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-1">{latestLog.text}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">{order.courier} · {latestLog.time}</div>
            </div>
            <span className="text-[12px] text-[#888888]">查看物流 ›</span>
          </button>
        )}

        {/* 收货地址 */}
        <div className="bg-white mt-2 px-3 py-3 flex items-start gap-2">
          <IcLocation size={18} style={{ color: VIP.primary }} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-[#222222]">{order.addressSnapshot.name}</span>
              <span className="text-[13px] text-[#666666]">{order.addressSnapshot.phone}</span>
            </div>
            <div className="text-[12px] text-[#666666] mt-0.5">{order.addressSnapshot.full}</div>
          </div>
        </div>

        {/* 商品清单 */}
        <div className="bg-white mt-2">
          <div className="px-3 py-2 text-[13px] font-semibold text-[#222222] border-b border-[#F5F5F5]">{order.brandName}</div>
          {order.lines.map((l, i) => (
            <div key={`${l.itemId}_${i}`} className="flex gap-2.5 px-3 py-2.5 border-b border-[#F5F5F5]">
              <Img src={l.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#222222] line-clamp-2">{l.title}</div>
                <div className="text-[11px] text-[#888888] mt-0.5">{l.skuDesc}</div>
              </div>
              <div className="text-right shrink-0">
                <Price value={l.price} size="s" />
                <div className="text-[11px] text-[#888888] mt-0.5">x{l.qty}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 金额明细 */}
        <div className="bg-white mt-2 px-3 py-2 text-[12px] text-[#666666]">
          <div className="flex justify-between py-1"><span>商品总额</span><span>¥{order.itemTotal.toFixed(2)}</span></div>
          <div className="flex justify-between py-1"><span>运费</span><span>{order.shippingFee === 0 ? '包邮' : `¥${order.shippingFee}`}</span></div>
          <div className="flex justify-between py-1 border-t border-[#F5F5F5] mt-1 pt-2 text-[#222222] font-semibold">
            <span>实付款</span><span style={{ color: VIP.price }}>¥{order.paidAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* 订单信息 */}
        <div className="bg-white mt-2 px-3 py-2 text-[12px] text-[#666666]">
          <div className="flex justify-between items-center py-1.5">
            <span>订单编号</span>
            <span className="flex items-center gap-1.5">
              <span className="text-[#222222]">{order.orderNo}</span>
              <button
                {...bindTap({ kind: 'action', id: 'orderDetail.copyOrderNo.submit' }, {
                  onTrigger: () => { ClipboardService.copyText(order.orderNo, 'vipshop'); showToast('订单编号已复制'); },
                })}
                className="flex items-center gap-0.5 text-[11px] rounded px-1.5 py-0.5 border cursor-pointer bg-white"
                style={{ color: VIP.primary, borderColor: VIP.primary }}
              >
                <IcCopy size={11} />复制
              </button>
            </span>
          </div>
          {order.payMethod
            ? <div className="flex justify-between py-1.5"><span>支付方式</span><span className="text-[#222222]">{order.payMethod}</span></div>
            : <div className="flex justify-between py-1.5"><span>下单时间</span><span className="text-[#222222]">待付款</span></div>}
          <div className="flex justify-between py-1.5 items-center">
            <span className="flex items-center gap-1"><IcShield size={12} style={{ color: VIP.gold }} />100%正品保障</span>
            <span className="text-[#BBBBBB]">假一赔十</span>
          </div>
        </div>

        <div className="h-3" />
      </div>

      {/* 底部按钮栏。待付款态照真机排:客服/更多是图标+文字的窄块,右侧才是找朋友付+付款倒计时 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-2 h-14 gap-2">
        <button
          {...bindTap('orderDetail.service-open')}
          className={order.status === 'pendingPayment'
            ? 'shrink-0 flex flex-col items-center justify-center gap-0.5 w-11 text-[10px] text-[#666666] bg-transparent border-none cursor-pointer'
            : 'flex items-center gap-1 text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]'}
        >
          <IcService size={order.status === 'pendingPayment' ? 17 : 14} />客服
        </button>

        {order.status !== 'pendingPayment' && <span className="flex-1" />}

        {order.isInternational && (
          <button
            {...bindTap('orderDetail.trace-open', { params: { id: order.id } })}
            className="text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white"
            style={{ color: VIP.gold, borderColor: VIP.gold }}
          >
            商品溯源
          </button>
        )}

        {/* 还没付款没什么可售后的,真机待付款页也不给这个入口 */}
        {order.status !== 'pendingPayment' && order.status !== 'canceled' && (
          <button
            {...bindTap('orderDetail.refund-open', { params: { id: order.id } })}
            className="text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white text-[#666666] border-[#DDDDDD]"
          >
            申请售后
          </button>
        )}

        {order.status === 'pendingPayment' && (
          <>
            {/* 真机版式:取消订单收在「更多」里,主按钮是带倒计时的付款 */}
            <button
              {...bindTap('orderDetail.more-open', { params: { id: order.id } })}
              className="shrink-0 flex flex-col items-center justify-center gap-0.5 w-11 text-[10px] text-[#666666] bg-transparent border-none cursor-pointer"
            >
              <IcMore size={17} />更多
            </button>
            <span className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'orderDetail.friendPay.share' }, {
                onTrigger: () => {
                  // 代付= 把付款链接分享给朋友,走系统分享(ACTION_SEND)
                  const launched = sharePlainText(
                    `【唯品会】帮我付一下这单 ¥${order.paidAmount.toFixed(2)}(订单 ${order.orderNo})`,
                    { onResult: (r) => { if (r.resultCode === 'OK') showToast('代付链接已发出'); } },
                  );
                  if (!launched) showToast('没有可用的分享目标');
                },
              })}
              className="shrink-0 text-[13px] rounded px-3 py-2 border cursor-pointer bg-white text-[#222222] border-[#222222] whitespace-nowrap"
            >
              找朋友付
            </button>
            <button
              {...bindTap('orderDetail.pay-open', { params: { id: order.id } })}
              className="shrink-0 text-[14px] rounded px-4 py-2 border-none cursor-pointer text-white font-semibold whitespace-nowrap"
              style={{ background: VIP.ctaBlack }}
            >
              {payExpired ? '重新下单' : `付款 ${leftText(payLeft)}`}
            </button>
          </>
        )}

        {order.status === 'pendingReceipt' && (
          <button
            {...bindTap({ kind: 'action', id: 'orderDetail.confirmReceipt.submit' }, {
              onTrigger: () => { confirmReceipt(order.id); showToast('确认收货成功'); },
            })}
            className="text-[14px] rounded-full px-5 py-1.5 border-none cursor-pointer text-white font-semibold"
            style={{ background: VIP.ctaBlack }}
          >
            确认收货
          </button>
        )}
        {order.status === 'completed' && !order.reviewed && (
          <button
            {...bindTap('orderDetail.review-open', { params: { id: order.id } })}
            className="text-[14px] rounded-full px-5 py-1.5 border-none cursor-pointer text-white font-semibold"
            style={{ background: VIP.ctaBlack }}
          >
            评价有礼
          </button>
        )}
      </div>

      {/* 收银台:提交订单后弹出,也可从「付款」按钮再次打开。按返回关掉它就落回本页(待付款) */}
      {panel === 'pay' && (
        <BottomSheet onClose={() => back()} title="选择支付方式" heightClass="max-h-[60%]">
          <div className="px-3 pt-1 pb-2 text-center">
            <span className="text-[12px] text-[#888888]">需支付</span>
            <div className="mt-0.5"><Price value={order.paidAmount} size="l" /></div>
          </div>
          {PAY_METHODS.map((pm) => (
            <button
              key={pm.id}
              {...bindTap({ kind: 'action', id: 'cashier.payMethod.select.target' }, {
                params: { target: pm.id },
                onTrigger: () => {
                  if (pm.id === 'wechat') {
                    const launched = window.__OS__?.startActivityForResult?.(
                      'wechat',
                      {
                        action: 'ACTION_PAY',
                        scheme: 'weixin',
                        data: {
                          amount: order.paidAmount,
                          orderId: order.orderNo,
                          merchantName: '唯品会',
                          subject: order.lines[0]?.title ?? '唯品会订单',
                          source: 'vipshop',
                        },
                      },
                      (result: ActivityResult) => { if (result.resultCode === 'OK') doPay(pm.label); },
                    );
                    if (launched) return;
                  }
                  doPay(pm.label);
                },
              })}
              className="w-full flex items-center gap-2 px-3 py-3.5 border-b border-[#F5F5F5] bg-white border-x-0 cursor-pointer text-left"
            >
              <span className="flex-1 text-[14px] text-[#222222]">
                {pm.label}
                {pm.desc && <span className="ml-2 text-[11px]" style={{ color: VIP.orange }}>{pm.desc}</span>}
              </span>
              <span className="text-[12px] text-[#BBBBBB]">›</span>
            </button>
          ))}
        </BottomSheet>
      )}

      {/* 「更多」:真机把取消订单收在这里 */}
      {panel === 'more' && (
        <BottomSheet onClose={() => back()} title="更多操作" heightClass="max-h-[40%]">
          <button
            {...bindTap({ kind: 'action', id: 'orderDetail.cancel.submit' }, {
              onTrigger: () => { cancelOrder(order.id); back(); showToast('订单已取消'); },
            })}
            className="w-full px-3 py-3.5 text-left text-[14px] text-[#222222] bg-white border-none border-b border-[#F5F5F5] cursor-pointer"
          >
            取消订单
          </button>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
