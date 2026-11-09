import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, VIP } from '../components/ui';

const METHODS = [
  { id: '上门取件', desc: '快递员上门,免费取件' },
  { id: '自行寄回', desc: '自己寄回,运费到付' },
];
const PICKUP_TIMES = ['今天 14:00-18:00', '明天 09:00-12:00', '明天 14:00-18:00', '后天 09:00-12:00'];
// 取件码:固定演示值(禁用 Math.random,保持可复现)
const PICKUP_CODE = '86-7391';

export default function RefundReturnPage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id) ?? s.orders[0]);
  const submitRefund = useVipshopStore((s) => s.submitRefund);
  const [method, setMethod] = useState('上门取件');
  const [pickupTime, setPickupTime] = useState(PICKUP_TIMES[0]);

  const line = order?.lines[0];
  const isPickup = method === '上门取件';

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="退货退款" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="return-body" data-scroll-direction="vertical">
        {line && (
          <div className="bg-white mt-2 px-3 py-3 flex gap-3">
            <Img src={line.image} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-2">{line.title}</div>
              <div className="text-[11px] text-[#888888] mt-1">{line.skuDesc}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-[#888888]">退款金额</div>
              <Price value={order?.paidAmount ?? line.price} size="m" />
            </div>
          </div>
        )}

        {/* 取件方式 */}
        <div className="bg-white mt-2 px-3 py-2">
          <div className="text-[13px] font-semibold text-[#222222] py-1">退货方式</div>
          {METHODS.map((m) => {
            const on = m.id === method;
            return (
              <button
                key={m.id}
                {...bindTap({ kind: 'action', id: 'return.method.select.target' }, { params: { target: m.id }, onTrigger: () => setMethod(m.id) })}
                className="w-full flex items-center gap-3 py-2.5 border-none cursor-pointer text-left bg-white"
              >
                <span
                  className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                  style={on ? { borderColor: VIP.primary } : { borderColor: '#CCC' }}
                >
                  {on && <span className="w-2.5 h-2.5 rounded-full" style={{ background: VIP.primary }} />}
                </span>
                <span className="flex-1">
                  <span className="text-[14px] text-[#222222]">{m.id}</span>
                  <span className="block text-[11px] text-[#888888]">{m.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 上门取件时间 + 取件码 */}
        {isPickup && (
          <div className="bg-white mt-2 px-3 py-2">
            <div className="text-[13px] font-semibold text-[#222222] py-1">上门取件时间</div>
            <div className="flex flex-wrap gap-2 py-1">
              {PICKUP_TIMES.map((t) => {
                const on = t === pickupTime;
                return (
                  <button
                    key={t}
                    {...bindTap({ kind: 'action', id: 'return.pickupTime.select.target' }, { params: { target: t }, onTrigger: () => setPickupTime(t) })}
                    className="text-[12px] rounded px-2.5 py-1.5 border cursor-pointer"
                    style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#333', borderColor: '#EEE', background: '#F8F8F8' }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 rounded-lg px-3 py-2 flex items-center justify-between" style={{ background: '#FDECF5' }}>
              <span className="text-[12px] text-[#666666]">取件码</span>
              <span className="text-[16px] font-bold tracking-wider" style={{ color: VIP.primary }}>{PICKUP_CODE}</span>
            </div>
            <div className="text-[11px] text-[#888888] mt-1">请将取件码告知上门快递员核验。</div>
          </div>
        )}

        <div className="bg-white mt-2 px-3 py-3 text-[12px] text-[#666666]">
          退款说明:商品寄回签收后 1-3 个工作日内,退款原路退回付款账户。
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] p-3">
        <button
          {...bindTap('return.confirm-open', {
            params: { id },
            beforeTrigger: () => submitRefund(id, isPickup ? `退货退款·上门取件(${pickupTime})` : '退货退款·自行寄回'),
          })}
          className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.ctaBlack }}
        >
          确认{isPickup ? '预约上门取件' : '退货退款'}
        </button>
      </div>
    </div>
  );
}
