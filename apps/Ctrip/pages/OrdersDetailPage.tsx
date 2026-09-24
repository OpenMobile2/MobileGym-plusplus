import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 订单详情(spec orders.detail)。待支付+倒计时;立即支付→cashier;取消订单→cancel;联系/导航wontfix。 */
export default function OrdersDetailPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const orders = useCtripStore((s) => s.orders);
  const startBooking = useCtripStore((s) => s.startBooking);
  const order = orders.find((o) => o.id === id) ?? orders[0];
  const unpaid = order.status === 'unpaid';
  const [left, setLeft] = React.useState(28 * 60 + 45);

  React.useEffect(() => {
    if (!unpaid) return;
    const t = window.setInterval(() => setLeft((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => window.clearInterval(t);
  }, [unpaid]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="订单详情" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 状态 */}
        <div className={`px-4 py-4 ${unpaid ? 'bg-[#FF6A2C]' : 'bg-[#0086F6]'} text-white`}>
          <div className="text-[18px] font-semibold">{order.statusText}</div>
          {unpaid && <div className="text-[13px] opacity-90 mt-1">请在 {mm}:{ss} 内完成支付,超时订单自动取消</div>}
        </div>

        {/* 金额 */}
        <div className="bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#333333]">在线支付金额</span>
            <Price value={order.price} size="m" />
          </div>
        </div>

        {/* 房源/行程 */}
        <div className="bg-white mt-2 px-4 py-3 flex gap-3">
          {order.image ? <Img src={order.image} className="w-16 h-16 rounded-lg object-cover shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-[#EAF4FF]" />}
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold line-clamp-2">{order.title}</div>
            <div className="text-[12px] text-[#999999] mt-1">{order.subtitle}</div>
          </div>
        </div>

        {/* 取消规则 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[14px] font-semibold mb-1">取消规则</div>
          <div className="text-[12px] text-[#666666]">支付成功前可免费取消;出行前按平台政策收取相应费用。</div>
        </div>

        {/* 联系/导航 */}
        <div className="bg-white mt-2 flex">
          {['联系房东', '致电', '地图导航'].map((t) => (
            <button key={t} {...bindTap({ kind: 'action', id: 'orderDetail.contact.wontfix' }, { params: { t }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="flex-1 py-3 text-[13px] text-[#0086F6] bg-transparent border-none cursor-pointer">{t}</button>
          ))}
        </div>

        {/* 入住必读 */}
        <div className="bg-white mt-2 px-4 py-3 text-[12px] text-[#666666]">入住必读:请携带有效证件办理入住,如有特殊需求请提前联系。</div>
      </div>

      {/* 底部 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center justify-end gap-2 px-3 py-2">
        <button {...bindTap('orderDetail.toCancel', { params: { id: order.id } })} className="text-[14px] text-[#333333] border border-[#DDDDDD] rounded-full px-5 py-2 bg-white cursor-pointer">取消订单</button>
        {unpaid && (
          <button
            {...bindTap('orderDetail.toCashier', { beforeTrigger: () => startBooking({ category: order.category, title: order.title, subtitle: order.subtitle, amount: order.price, image: order.image }) })}
            className="text-[14px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-6 py-2 border-none cursor-pointer"
          >立即支付</button>
        )}
      </div>
      {toast}
    </div>
  );
}
