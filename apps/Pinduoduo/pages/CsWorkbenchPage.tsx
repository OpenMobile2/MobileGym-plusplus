import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, PriceYuan, wontfix } from '../components/ui';
import {
  IcRefresh, IcTruck, IcClock, IcInvoice, IcHeadphones, IcCard, IcGift, IcStore,
} from '../res/icons';

// 官方客服工作台
export function CsWorkbenchPage() {
  const { bindTap } = usePinduoduoGestures();
  const order = usePinduoduoStore((s) => s.orders[0]);

  const grid: {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    bind: React.HTMLAttributes<HTMLElement>;
  }[] = [
    { icon: IcRefresh, label: '申请退款', bind: bindTap('cs.refund-open') },
    { icon: IcTruck, label: '查物流', bind: bindTap('cs.logistics-open') },
    { icon: IcClock, label: '催发货', bind: bindTap({ kind: 'action', id: 'cs.misc.wontfix' }, { onTrigger: wontfix }) },
    { icon: IcCard, label: '申请运费', bind: bindTap({ kind: 'action', id: 'cs.misc.wontfix' }, { onTrigger: wontfix }) },
    { icon: IcInvoice, label: '退款记录', bind: bindTap({ kind: 'action', id: 'cs.misc.wontfix' }, { onTrigger: wontfix }) },
    { icon: IcHeadphones, label: '售后纠纷', bind: bindTap({ kind: 'action', id: 'cs.misc.wontfix' }, { onTrigger: wontfix }) },
    { icon: IcGift, label: '账户问题', bind: bindTap({ kind: 'action', id: 'cs.misc.wontfix' }, { onTrigger: wontfix }) },
    { icon: IcStore, label: '投诉商家', bind: bindTap({ kind: 'action', id: 'cs.misc.wontfix' }, { onTrigger: wontfix }) },
  ];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="官方客服" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 欢迎条 */}
        <div className="mx-3 mt-2 rounded-xl bg-gradient-to-r from-[#FF5A3C] to-[#E22E1F] text-white px-4 py-4">
          <div className="text-[15px] font-medium">Hi,我是小多</div>
          <div className="text-[12px] opacity-90 mt-0.5">请选择您需要办理的业务,我来帮您快速处理</div>
        </div>

        {/* 功能九宫格 */}
        <div className="mx-3 mt-2 bg-white rounded-xl grid grid-cols-4 gap-y-4 py-4">
          {grid.map((g) => {
            const Icon = g.icon;
            return (
              <button key={g.label} {...g.bind} className="flex flex-col items-center gap-1.5">
                <span className="w-11 h-11 rounded-full bg-[#FFF0E8] flex items-center justify-center">
                  <Icon size={22} className="text-[#E22E1F]" />
                </span>
                <span className="text-[12px] text-[#333]">{g.label}</span>
              </button>
            );
          })}
        </div>

        {/* 订单卡装饰 */}
        {order && (
          <div className="mx-3 mt-2 mb-4 bg-white rounded-xl overflow-hidden">
            <div className="px-3 py-2 border-b border-[#F5F5F5] text-[12px] text-[#999]">最近订单 · {order.shopName}</div>
            <div className="p-3 flex gap-3">
              <Img src={order.lines[0].image} className="w-14 h-14 rounded object-cover bg-[#F5F5F5] shrink-0" alt={order.lines[0].title} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#333] line-clamp-2 leading-snug">{order.lines[0].title}</div>
                <PriceYuan value={order.itemTotal} className="text-[#E22E1F] text-[15px] mt-1 inline-block" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
