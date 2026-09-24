import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, useToast, VIP } from '../components/ui';

const COLORS = ['同款原色', '藏蓝', '米白', '焦糖'];
const SIZES = ['S', 'M', 'L', 'XL'];

export default function RefundExchangePage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [toast] = useToast();
  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id) ?? s.orders[0]);
  const submitRefund = useVipshopStore((s) => s.submitRefund);
  const [color, setColor] = useState('同款原色');
  const [size, setSize] = useState('M');

  const line = order?.lines[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="申请换货" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="exchange-body" data-scroll-direction="vertical">
        {line && (
          <div className="bg-white mt-2 px-3 py-3 flex gap-3">
            <Img src={line.image} className="w-16 h-16 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-2">{line.title}</div>
              <div className="text-[11px] text-[#888888] mt-1">原规格:{line.skuDesc}</div>
            </div>
          </div>
        )}

        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[13px] font-semibold text-[#222222] mb-2">更换颜色</div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => {
              const on = c === color;
              return (
                <button
                  key={c}
                  {...bindTap({ kind: 'action', id: 'exchange.variant.select.target' }, { params: { target: c }, onTrigger: () => setColor(c) })}
                  className="text-[12px] rounded px-3 py-1.5 border cursor-pointer"
                  style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#333', borderColor: '#EEE', background: '#F8F8F8' }}
                >
                  {c}
                </button>
              );
            })}
          </div>
          <div className="text-[13px] font-semibold text-[#222222] mt-4 mb-2">更换尺码</div>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((sz) => {
              const on = sz === size;
              return (
                <button
                  key={sz}
                  {...bindTap({ kind: 'action', id: 'exchange.variant.select.target' }, { params: { target: sz }, onTrigger: () => setSize(sz) })}
                  className="text-[12px] rounded px-3 py-1.5 border cursor-pointer"
                  style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#333', borderColor: '#EEE', background: '#F8F8F8' }}
                >
                  {sz}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white mt-2 px-3 py-3 text-[12px] text-[#666666]">
          换货说明:唯品会包邮换新,新商品将在旧商品寄回后 48 小时内发出。
        </div>
        <div className="mt-3 px-3 text-[13px] text-[#222222]">已选换货规格:<span style={{ color: VIP.primary }}>{color} · {size}</span></div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] p-3">
        <button
          {...bindTap('exchange.confirm-open', {
            params: { id },
            beforeTrigger: () => submitRefund(id, `换货 ${color}/${size}`),
          })}
          className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.ctaBlack }}
        >
          确认换货申请
        </button>
      </div>
      {toast}
    </div>
  );
}
