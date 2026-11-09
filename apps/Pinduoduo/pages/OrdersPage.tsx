import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, PriceYuan, EmptyState, showToast, wontfix } from '../components/ui';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ORDER_TABS } from '../constants';
import { IcChevronRight, IcSearch, IcShare, IcTruck } from '../res/icons';
import type { Order, OrderStatus } from '../types';

const STATUS_TEXT: Record<OrderStatus, string> = {
  pendingPayment: '等待付款',
  grouping: '拼团中 · 待分享成团',
  packing: '商家备货中',
  shipped: '待收货',
  completed: '交易成功',
  refunding: '退款处理中',
  refunded: '退款成功',
};

export function OrdersPage() {
  const [sp] = useSearchParams();
  const initStatus = sp.get('status') || 'all';
  const isQuickRefund = sp.get('refund') === 'quick';

  const { bindTap, bindBack, go, back } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const orders = usePinduoduoStore((st) => st.orders);
  const items = usePinduoduoStore((st) => st.items);
  const confirmQuickRefund = usePinduoduoStore((st) => st.confirmQuickRefund);
  const remindShip = usePinduoduoStore((st) => st.remindShip);
  const payOrder = usePinduoduoStore((st) => st.payOrder);
  const cancelOrder = usePinduoduoStore((st) => st.cancelOrder);
  const confirmReceipt = usePinduoduoStore((st) => st.confirmReceipt);
  const soloFinishGroup = usePinduoduoStore((st) => st.soloFinishGroup);

  const [tab, setTab] = useState<string>(initStatus);
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [refundOid, setRefundOid] = useState<string>('');

  const statusList =
    tab === 'all' ? orders
    : tab === 'completed' ? orders.filter((o) => o.status === 'completed' && !o.reviewed)
    : orders.filter((o) => o.status === tab);
  const list =
    tab !== 'shipped' || deliveryFilter === 'all' || deliveryFilter === 'transit'
      ? statusList
      : [];
  const refundOrder = orders.find((o) => o.id === refundOid);
  const refundAmount = refundOrder ? (refundOrder.paidAmount > 0 ? refundOrder.paidAmount : refundOrder.itemTotal) : 0;

  const secBtn = 'px-3 h-8 rounded-md border border-[#D7D7D7] bg-white text-[13px] text-[#444]';
  const priBtn = 'px-3 h-8 rounded-md bg-[#ED3027] text-white text-[13px]';

  const renderButtons = (o: Order) => {
    const btns: React.ReactNode[] = [];
    if (o.status === 'pendingPayment') {
      btns.push(
        <button key="cancel" className={secBtn}
          {...bindTap({ kind: 'action', id: 'orders.cancel.confirm' }, { stopPropagation: true, onTrigger: () => { cancelOrder(o.id); showToast('订单已取消'); } })}
        >取消订单</button>,
        <button key="pay" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.pay.now' }, { stopPropagation: true, onTrigger: () => { payOrder(o.id); showToast('付款成功'); } })}
        >立即付款</button>,
      );
    } else if (o.status === 'grouping') {
      btns.push(
        <button key="reorder" className={secBtn}
          {...bindTap('orders.reorder-open', { params: { itemId: o.lines[0].itemId }, stopPropagation: true })}
        >再次拼单</button>,
        <button key="solo" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.group.solo' }, { stopPropagation: true, onTrigger: () => { soloFinishGroup(o.id); showToast('拼单成功'); } })}
        >直接免拼</button>,
      );
    } else if (o.status === 'packing') {
      btns.push(
        <button key="refund" className={secBtn}
          {...bindTap('orders.refund.show', { stopPropagation: true, onTrigger: () => { setRefundOid(o.id); go('orders.refund.show'); } })}
        >申请退款</button>,
        <button key="remind" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.remind.ship' }, { params: {}, stopPropagation: true, onTrigger: () => { remindShip(o.id); showToast('已提醒商家发货'); } })}
        >提醒发货</button>,
      );
    } else if (o.status === 'shipped') {
      btns.push(
        <button key="refund" className={secBtn}
          {...bindTap('refundform.open', { params: { orderId: o.id }, stopPropagation: true })}
        >申请退款</button>,
        <button key="receipt" className={priBtn}
          {...bindTap({ kind: 'action', id: 'orders.receipt.confirm' }, { stopPropagation: true, onTrigger: () => { confirmReceipt(o.id); showToast('确认收货成功'); } })}
        >确认收货</button>,
      );
    } else if (o.status === 'completed' && !o.reviewed) {
      btns.push(
        <button key="reorder" className={secBtn}
          {...bindTap('orders.reorder-open', { params: { itemId: o.lines[0].itemId }, stopPropagation: true })}
        >再次拼单</button>,
        <button key="review" className={priBtn}
          {...bindTap('orders.review-open', { params: { orderId: o.id }, stopPropagation: true })}
        >评价</button>,
      );
    } else {
      btns.push(
        <button key="reorder" className={priBtn}
          {...bindTap('orders.reorder-open', { params: { itemId: o.lines[0].itemId }, stopPropagation: true })}
        >再次拼单</button>,
      );
    }
    return btns;
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar
        title={s.title_orders}
        className="bg-white"
        right={(
          <div className="flex items-center gap-3 pr-1 text-[#333]">
            <button
              {...bindTap({ kind: 'action', id: 'orders.search.wontfix' }, { onTrigger: wontfix })}
              aria-label="搜索订单"
            >
              <IcSearch size={22} strokeWidth={1.5} />
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orders.share.wontfix' }, { onTrigger: wontfix })}
              aria-label="分享订单"
            >
              <IcShare size={20} strokeWidth={1.5} />
            </button>
          </div>
        )}
      />

      {/* 状态 Tab 条 */}
      <div className="shrink-0 bg-white flex border-b border-[#EEEEEE]">
        {ORDER_TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'orders.tab.select.status' }, {
                params: { status: t.key },
                onTrigger: () => {
                  setTab(t.key);
                  setDeliveryFilter('all');
                },
              })}
              className="flex-1 py-2.5 relative min-w-0"
            >
              <span className={`text-[13px] whitespace-nowrap ${active ? 'text-[#E22E1F] font-semibold' : 'text-[#333]'}`}>
                {s[t.labelKey]}
              </span>
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#E22E1F]" />}
            </button>
          );
        })}
      </div>

      {/* 待收货二级物流筛选。 */}
      {tab === 'shipped' && (
        <div className="shrink-0 bg-white px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { key: 'all', label: `全部 ${statusList.length}` },
            { key: 'signed', label: '已签收 0' },
            { key: 'pickup', label: '待取件 0' },
            { key: 'delivering', label: '派件中 0' },
            { key: 'transit', label: `运输中 ${statusList.length}` },
          ].map((filter) => (
            <button
              key={filter.key}
              {...bindTap(
                { kind: 'action', id: 'orders.tab.select.status' },
                { params: { status: `shipped:${filter.key}` }, onTrigger: () => setDeliveryFilter(filter.key) },
              )}
              className={`shrink-0 h-7 px-3 rounded-full text-[12px] ${
                deliveryFilter === filter.key ? 'bg-[#FFF0EF] text-[#E22E1F]' : 'bg-[#F7F7F7] text-[#555]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      )}

      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        <div className="h-10 px-3 flex items-center bg-[#EAF8E8] text-[#27A638] text-[13px]">
          今日快递：{orders.filter((order) => order.status === 'shipped').length}个在途中
          <IcChevronRight size={17} className="ml-auto" />
        </div>
        {tab === 'shipped' && (
          <button
            {...bindTap({ kind: 'action', id: 'orders.coupon.wontfix' }, { onTrigger: wontfix })}
            className="w-full h-[66px] px-3 bg-white flex items-center border-b-8 border-[#F5F5F5] text-left"
          >
            <span className="text-[#E22E1F] text-[27px] leading-none font-bold mr-2">
              <span className="text-[14px] align-middle">¥</span>5
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] text-[#222] font-medium">限时秒杀 送5元券</span>
              <span className="block mt-0.5 text-[12px] text-[#AAA]">限量抢5元无门槛券</span>
            </span>
            <span className="ml-auto h-9 px-3 rounded-[3px] bg-[#E9362C] text-white text-[14px] flex items-center">立即领取</span>
          </button>
        )}
        {list.length === 0 ? (
          <EmptyState text={s.empty_orders} />
        ) : (
          list.map((o) => {
            const orderedItem = items.find((item) => item.id === o.lines[0]?.itemId);
            const recommendations = [
              ...items.filter((item) => item.category === orderedItem?.category && item.id !== orderedItem?.id),
              ...items.filter((item) => item.id !== orderedItem?.id),
            ].slice(0, 5);
            return (
              <React.Fragment key={o.id}>
                <div
                  {...bindTap('orders.detail-open', { params: { orderId: o.id } })}
                  className="mt-2 bg-white overflow-hidden"
                >
              {/* 店铺行 */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <span className="flex items-center min-w-0 text-[13px] font-medium text-[#333]">
                  <span className="truncate">{o.shopName}</span>
                  <span className="ml-1 shrink-0 text-[9px] leading-4 px-1 rounded-[2px] bg-[#4B2A1B] text-[#F7D8B2]">官方旗舰</span>
                  <IcChevronRight size={14} className="text-[#999] shrink-0" />
                </span>
                <span className="text-[13px] text-[#E22E1F] shrink-0 ml-2">{STATUS_TEXT[o.status]}</span>
              </div>
              {/* 商品图文行 */}
              {o.lines.map((ln, i) => (
                <div key={i} className="flex gap-2.5 px-3 py-1.5">
                  <Img src={ln.image} className="w-[78px] h-[78px] rounded-[3px] object-cover shrink-0" alt={ln.title} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#222] leading-[18px] line-clamp-2">{ln.title}</div>
                    <div className="text-[11px] text-[#A0A0A0] mt-1 truncate">{ln.skuDesc}</div>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[10px] leading-[16px] px-1 rounded-[2px] bg-[#EAF9E8] text-[#1FA638]">退货包运费保障中</span>
                      <span className="text-[10px] leading-[16px] px-1 rounded-[2px] bg-[#EAF9E8] text-[#1FA638]">超时赔付</span>
                      {o.fufei && (
                        <span className="text-[10px] leading-[16px] px-1 rounded-[2px] bg-[#EAF9E8] text-[#1FA638]">先用后付</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <PriceYuan value={ln.price} className="text-[#999] text-[13px] font-normal" symbolClass="text-[10px]" />
                    <div className="text-[11px] text-[#999] mt-1">x{ln.qty}</div>
                  </div>
                </div>
              ))}
              {/* 合计 + 按钮组 */}
              <div className="px-3 pb-3 pt-1">
                <div className="flex items-center justify-end gap-1 text-[12px] text-[#555] min-h-6">
                   {o.paidAmount > 0 && o.itemTotal > o.paidAmount && (
                     <span className="text-[#E22E1F]">
                       <span className="inline-block bg-[#E22E1F] text-white text-[9px] leading-4 px-1 rounded-[2px] mr-1">券</span>
                       已优惠{(o.itemTotal - o.paidAmount).toFixed(2)}元
                     </span>
                   )}
                   <span>{o.payMethod || '未支付'}</span>
                   <span>实付:</span>
                   <PriceYuan
                     value={o.status === 'pendingPayment' ? o.itemTotal : o.paidAmount}
                     className="text-[#333] text-[14px]"
                     symbolClass="text-[10px]"
                   />
                </div>
                {o.fufei && o.status === 'shipped' && (
                  <div className="text-right text-[11px] text-[#555] mt-0.5">
                    确认收货后自动付款 ¥{o.autoPayAmount.toFixed(2)}
                  </div>
                )}
                <div className="flex items-center justify-end gap-2 mt-2.5">
                  <span className="px-3 h-8 flex items-center text-[13px] text-[#444]">更多</span>
                  {renderButtons(o)}
                </div>
                {o.status === 'shipped' && (
                  <div className="mt-2 h-8 px-2 rounded-[3px] bg-[#F6F6F6] flex items-center text-[11px] text-[#24A837] truncate">
                    <IcTruck size={15} className="mr-1 shrink-0" />13小时前 运输中 承诺明天送达，超时必赔
                  </div>
                )}
              </div>
                </div>
                {o.status === 'shipped' && (
                  <div className="bg-white border-t border-[#F3F3F3] px-3 pt-2.5 pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] text-[#9A5D2E]">{o.shopName} · 精选好货</span>
                      <span className="text-[12px] text-[#9A5D2E] flex items-center">查看更多<IcChevronRight size={14} /></span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                      {recommendations.map((item) => (
                        <button
                          key={item.id}
                          {...bindTap('orders.reorder-open', {
                            params: { itemId: item.id },
                            stopPropagation: true,
                          })}
                          className="w-[82px] shrink-0 text-left"
                        >
                          <Img src={item.image} className="w-[82px] h-[82px] rounded-[3px] object-cover bg-[#F5F5F5]" alt={item.title} />
                          <PriceYuan value={item.pinPrice} className="block text-center mt-1 text-[#E22E1F] text-[14px]" symbolClass="text-[10px]" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
        <div className="h-4" />
      </div>

      {/* 极速退款弹层 */}
      {isQuickRefund && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-5">
            <div className="text-center text-[16px] font-medium text-[#333]">商品未发货,享极速退款</div>
            <div className="text-center text-[28px] font-bold text-[#E22E1F] my-4">
              <PriceYuan value={refundAmount} className="text-[28px]" symbolClass="text-[16px]" />
            </div>
            <div className="text-center text-[12px] text-[#999] mb-4">款项将原路退回,预计 1-3 个工作日到账</div>
            <button
              {...bindTap({ kind: 'action', id: 'orders.quickrefund.confirm' }, {
                onTrigger: () => { confirmQuickRefund(refundOid); showToast('退款成功'); back(); },
              })}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
            >确认退款</button>
          </div>
        </div>
      )}
    </div>
  );
}
