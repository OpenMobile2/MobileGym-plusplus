import React from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, EmptyState, showToast } from '../components/ui';
import { IcPackage, IcMapPin, IcChevronRight } from '../res/icons';

const HEAD: Record<string, { title: string; sub: string }> = {
  unpaid: { title: '等待付款', sub: '请在 30 分钟内完成支付' },
  undelivered: { title: '已下单', sub: '快递运输 · 您提交了订单,请等待系统确认' },
  unused: { title: '待使用', sub: '请在有效期内到店使用' },
  done: { title: '交易完成', sub: '感谢您的惠顾,期待再次光临' },
  refunding: { title: '退款中', sub: '您的退款申请正在处理中' },
  refunded: { title: '退款成功', sub: '退款已原路返回' },
  cancelled: { title: '已取消', sub: '订单已取消,可再次购买' },
};

export function OrderDetailPage() {
  const { bindTap } = useJingdongGestures();
  const { orderId } = useParams();
  const orders = useJingdongStore((s) => s.orders);
  const remindOrder = useJingdongStore((s) => s.remindOrder);
  const order = orders.find((o) => o.id === orderId) || orders[0];

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="订单详情" className="pt-10" />
        <EmptyState text="订单不存在" />
      </div>
    );
  }

  const head = HEAD[order.status] || HEAD.undelivered;
  const discount = Math.round((order.itemTotal - order.paidAmount + Number.EPSILON) * 100) / 100;
  const firstItemId = order.lines[0]?.itemId;

  // —— 秒送/外卖订单:配送态详情(与首页京东自营的快递订单完全不同) ——
  if (order.channel === 'miaosong') {
    const done = order.status === 'done' || order.status === 'refunded';
    const steps = ['下单', '备餐中', '配送中', done ? '已完成' : '待送达'];
    const activeStep = done ? 3 : 1; // 演示:备餐中
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="订单详情" className="pt-10" />
        <div className="flex-1 overflow-y-auto" data-scroll-container="orderdetail-scroll" data-scroll-direction="vertical">
          {/* 配送状态头 */}
          <div className="mx-3 mt-2 bg-white rounded-xl p-4">
            <div className="text-[13px] text-[#888]">预计送达</div>
            <div className="text-[22px] font-bold text-[#1A1A1A] mt-0.5">今天 13:37 <span className="text-[15px] font-normal text-[#666]">送达</span></div>
            <div className="text-[15px] font-semibold text-[#FF2D2D] mt-1">{done ? '已送达' : '商家备餐中'}</div>
            {/* 进度条 */}
            <div className="flex items-center mt-3">
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${i <= activeStep ? 'bg-[#FF2D2D] text-white' : 'bg-[#EEE] text-[#999]'}`}>{['¥', '🍚', '🛵', '✓'][i]}</div>
                    <span className={`text-[10px] mt-1 ${i <= activeStep ? 'text-[#FF2D2D]' : 'text-[#999]'}`}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-[3px] mx-1 -mt-4 rounded ${i < activeStep ? 'bg-[#FF2D2D]' : 'bg-[#EEE]'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 配送地图占位 */}
          <div className="mx-3 mt-2.5 rounded-xl overflow-hidden relative h-[130px] bg-gradient-to-br from-[#E8F3EC] to-[#DCEAF5]">
            <span className="absolute right-2 top-2 text-[10px] text-[#B8860B] bg-[#FFF4E0] rounded px-1.5 py-0.5">京东秒送</span>
            <div className="absolute inset-0 flex items-center justify-center gap-2 text-[#666] text-[13px]">
              <span className="text-[26px]">🛵</span>{done ? '订单已送达' : '骑手正在赶来,请耐心等待~'}
            </div>
          </div>

          {/* 操作行:催单 / 申请退款 / 联系商家 */}
          <div className="mx-3 mt-2.5 bg-white rounded-xl flex items-stretch text-center text-[13px]">
            <button {...bindTap({ kind: 'action', id: 'orderdetail.remind.action' }, { onTrigger: () => { remindOrder(order.id); showToast('已催单'); } })} className="flex-1 py-3 text-[#333]">催单</button>
            {(order.status === 'undelivered' || order.status === 'done' || order.status === 'unused') && (
              <>
                <div className="w-px my-2 bg-[#F0F0F0]" />
                <button {...bindTap('orderdetail.refund-open', { params: { orderId: order.id } })} className="flex-1 py-3 text-[#333]">申请退款</button>
              </>
            )}
            <div className="w-px my-2 bg-[#F0F0F0]" />
            <button {...bindTap({ kind: 'action', id: 'orderdetail.contact.action' }, { onTrigger: () => showToast('正在为您接入商家客服…') })} className="flex-1 py-3 text-[#333]">联系商家</button>
          </div>

          {/* 商品 + 金额 */}
          <div className="mx-3 mt-2.5 bg-white rounded-xl p-4">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-[10px] text-[#8A6D3B] bg-[#F3E9D6] rounded px-1">外卖</span>
              <span className="text-[14px] font-medium text-[#1A1A1A] truncate">{order.shopName}</span>
              <IcChevronRight size={14} className="text-[#999]" />
            </div>
            {order.lines.map((l) => (
              <div key={l.itemId} className="flex items-start gap-2.5 mb-3">
                <Img src={l.image} className="w-16 h-16 rounded-lg object-cover bg-[#F5F5F5] shrink-0" alt={l.title} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#1A1A1A] line-clamp-2 leading-[17px]">{l.title}</div>
                  <div className="text-[11px] text-[#999] mt-1">{l.skuDesc}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[14px] font-semibold text-[#1A1A1A]">¥{l.price.toFixed(2)}</div>
                  <div className="text-[11px] text-[#999] mt-0.5">x{l.qty}</div>
                </div>
              </div>
            ))}
            <div className="border-t border-[#F2F2F2] pt-3 space-y-2 text-[13px]">
              <Row label="商品金额" value={`¥${order.itemTotal.toFixed(2)}`} />
              {discount > 0 && <Row label="优惠" value={`-¥${discount.toFixed(2)}`} valueClass="text-[#FF2D2D]" />}
              <div className="flex items-center justify-between">
                <span className="text-[#555]">实付款</span>
                <span className="text-[16px] font-bold text-[#FF2D2D]">¥{order.paidAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 订单信息 */}
          <div className="mx-3 mt-2.5 mb-4 bg-white rounded-xl p-4 space-y-2.5 text-[13px]">
            <div className="flex items-start gap-2">
              <IcMapPin size={16} className="text-[#FF2D2D] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[13px] text-[#1A1A1A]">{order.addressSnapshot.full}</div>
                <div className="text-[12px] text-[#888] mt-0.5">{order.addressSnapshot.name} {order.addressSnapshot.phone}</div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#F2F2F2] pt-2.5">
              <span className="text-[#888]">订单编号</span>
              <span className="flex items-center gap-2 text-[#333]">{order.orderNo}
                <button onClick={() => showToast('已复制')} className="text-[12px] text-[#2860C4] border border-[#CBD8EE] rounded px-1.5 py-0.5">复制</button>
              </span>
            </div>
            <Row label="支付方式" value={order.payMethod} valueClass="text-[#333]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="订单详情" className="pt-10" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="orderdetail-scroll" data-scroll-direction="vertical">
        {/* 状态头 */}
        <div className="mx-3 mt-2 bg-white rounded-xl p-4">
          <div className="flex items-center gap-2">
            <IcPackage size={22} className="text-[#E1251B]" />
            <span className="text-[18px] font-bold text-[#E1251B]">{head.title}</span>
          </div>
          <div className="text-[13px] text-[#888] mt-1.5 pl-7">{head.sub}</div>
        </div>

        {/* 收货地址 */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl p-4 flex items-start gap-2">
          <IcMapPin size={18} className="text-[#E1251B] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="text-[14px] text-[#1A1A1A] leading-snug">{order.addressSnapshot.full}</div>
            <div className="text-[12px] text-[#888] mt-1">{order.addressSnapshot.name} {order.addressSnapshot.phone}</div>
          </div>
        </div>

        {/* 商品 + 金额 */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl p-4">
          <div className="flex items-center gap-1 mb-3">
            {order.self && <span className="text-[10px] text-white bg-[#E1251B] rounded px-1 py-0.5">自营</span>}
            <span className="text-[14px] font-medium text-[#1A1A1A] truncate">{order.shopName}</span>
            <IcChevronRight size={14} className="text-[#999]" />
          </div>
          {order.lines.map((l) => (
            <div key={l.itemId} className="flex items-start gap-2.5 mb-3">
              <Img src={l.image} className="w-16 h-16 rounded-lg object-cover bg-[#F5F5F5] shrink-0" alt={l.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#1A1A1A] line-clamp-2 leading-[17px]">{l.title}</div>
                <div className="text-[11px] text-[#999] mt-1">{l.skuDesc}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-semibold text-[#1A1A1A]">¥{l.price.toFixed(2)}</div>
                <div className="text-[11px] text-[#999] mt-0.5">x{l.qty}</div>
              </div>
            </div>
          ))}
          <div className="border-t border-[#F2F2F2] pt-3 space-y-2 text-[13px]">
            <Row label="商品金额" value={`¥${order.itemTotal.toFixed(2)}`} />
            {discount > 0 && <Row label="优惠" value={`-¥${discount.toFixed(2)}`} valueClass="text-[#E1251B]" />}
            <div className="flex items-center justify-between">
              <span className="text-[#555]">实付款</span>
              <span className="text-[16px] font-bold text-[#E1251B]">¥{order.paidAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 订单信息 */}
        <div className="mx-3 mt-2.5 mb-4 bg-white rounded-xl p-4 space-y-2.5 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-[#888]">订单编号</span>
            <span className="flex items-center gap-2 text-[#333]">
              {order.orderNo}
              <button onClick={() => showToast('已复制')} className="text-[12px] text-[#2860C4] border border-[#CBD8EE] rounded px-1.5 py-0.5">复制</button>
            </span>
          </div>
          <Row label="支付方式" value={order.payMethod} valueClass="text-[#333]" />
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-3 py-2.5 flex items-center justify-end gap-2">
        <button
          {...bindTap({ kind: 'action', id: 'orderdetail.remind.action' }, { onTrigger: () => { remindOrder(order.id); showToast('已催单'); } })}
          className="h-8 px-3.5 rounded-full border border-[#DDD] text-[13px] text-[#555]"
        >
          我要催单
        </button>
        {(order.status === 'undelivered' || order.status === 'done' || order.status === 'unused') && (
          <button {...bindTap('orderdetail.refund-open', { params: { orderId: order.id } })} className="h-8 px-3.5 rounded-full border border-[#DDD] text-[13px] text-[#555]">
            申请退款
          </button>
        )}
        {firstItemId && (
          <button {...bindTap('orderdetail.reorder-open', { params: { itemId: firstItemId } })} className="h-8 px-3.5 rounded-full border border-[#DDD] text-[13px] text-[#555]">
            再次购买
          </button>
        )}
        {order.status === 'done' && !order.reviewed ? (
          <button {...bindTap('orderdetail.review-open', { params: { orderId: order.id } })} className="h-8 px-3.5 rounded-full bg-[#E1251B] text-[13px] text-white">
            评价
          </button>
        ) : (
          <button {...bindTap('orderdetail.logistics-open', { params: { orderId: order.id } })} className="h-8 px-3.5 rounded-full bg-[#E1251B] text-[13px] text-white">
            查看物流
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = 'text-[#555]' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#888]">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
