import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, useToast, NOT_OPEN, VIP } from '../components/ui';
import { REFUND_TYPES } from '../constants';
import { IcRefresh, IcPackage, IcShield, IcArrowRight } from '../res/icons';

const EXCHANGE = REFUND_TYPES.find((t) => t.id === 'exchange')!;
const RETURN = REFUND_TYPES.find((t) => t.id === 'return')!;
const PRICE_GUARD = REFUND_TYPES.find((t) => t.id === 'priceGuard')!;

function CardBody({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <>
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-[#222222]">{label}</div>
        <div className="text-[12px] text-[#888888] mt-0.5">{desc}</div>
      </div>
    </>
  );
}

export default function RefundPage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();
  const [priceGuardOpen, setPriceGuardOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="选择服务类型" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="refund-body" data-scroll-direction="vertical">
        <div className="px-3 pt-3 text-[12px] text-[#888888]">请选择您需要的售后服务</div>

        <div className="mt-2 px-2 flex flex-col gap-2">
          {/* 免费换货 → 选款式尺寸 */}
          <button
            {...bindTap('refund.exchange-open', { params: { id } })}
            className="w-full bg-white rounded-lg px-3 py-3.5 flex items-center gap-3 border-none cursor-pointer text-left"
          >
            <CardBody icon={<IcPackage size={20} style={{ color: VIP.primary }} />} label={EXCHANGE.label} desc={EXCHANGE.desc} />
            <IcArrowRight size={16} className="text-[#BBBBBB]" />
          </button>

          {/* 退货退款 → 确认取件方式 */}
          <button
            {...bindTap('refund.return-open', { params: { id } })}
            className="w-full bg-white rounded-lg px-3 py-3.5 flex items-center gap-3 border-none cursor-pointer text-left"
          >
            <CardBody icon={<IcRefresh size={20} style={{ color: VIP.primary }} />} label={RETURN.label} desc={RETURN.desc} />
            <IcArrowRight size={16} className="text-[#BBBBBB]" />
          </button>

          {/* 价格保护(inline 展开) */}
          <div className="bg-white rounded-lg">
            <button
              {...bindTap({ kind: 'action', id: 'refund.priceGuard.open' }, { onTrigger: () => setPriceGuardOpen((v) => !v) })}
              className="w-full px-3 py-3.5 flex items-center gap-3 border-none cursor-pointer text-left bg-white rounded-lg"
            >
              <CardBody icon={<IcShield size={20} style={{ color: VIP.gold }} />} label={PRICE_GUARD.label} desc={PRICE_GUARD.desc} />
              <IcArrowRight size={16} className={`text-[#BBBBBB] transition-transform ${priceGuardOpen ? 'rotate-90' : ''}`} />
            </button>
            {priceGuardOpen && (
              <div className="px-3 pb-3 text-[12px] text-[#666666] border-t border-[#F5F5F5] pt-2">
                暂无可价保金额。下单后15天内,若商品降价可在此申请退还差价。
              </div>
            )}
          </div>
        </div>

        {/* 退换货流程说明(暂未开放) */}
        <button
          {...bindTap({ kind: 'action', id: 'refund.flow.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mt-4 mx-3 text-[12px] bg-transparent border-none cursor-pointer p-0"
          style={{ color: VIP.primary }}
        >
          查看退换货流程说明 ›
        </button>
      </div>
      {toast}
    </div>
  );
}
