import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar, PriceYuan, FufeiTag, EmptyState, showToast } from '../components/ui';
import { IcChevronRight } from '../res/icons';

// 交易记录:由订单造流水条目
export function WalletTxnsPage() {
  const { bindTap } = usePinduoduoGestures();
  const orders = usePinduoduoStore((s) => s.orders);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="交易记录" />

      {orders.length === 0 ? (
        <EmptyState text="暂无交易记录" />
      ) : (
        <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
            {orders.map((o) => (
              <button
                key={o.id}
                {...bindTap({ kind: 'action', id: 'wallettxn.detail.show' }, { onTrigger: () => showToast('交易详情') })}
                className="w-full flex items-center px-4 py-3.5 text-left border-b border-[#F5F5F5] last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-[#333] truncate">{o.shopName}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <FufeiTag />
                    <span className="text-[12px] text-[#999]">先用后付 · 待付款</span>
                  </div>
                </div>
                <div className="ml-2 flex items-center gap-1 shrink-0">
                  <PriceYuan value={o.itemTotal} className="text-[#333] text-[16px]" symbolClass="text-[12px]" />
                  <IcChevronRight size={16} className="text-[#CCC]" />
                </div>
              </button>
            ))}
          </div>
          <div className="text-center text-[11px] text-[#BBB] py-4">仅展示近期交易</div>
        </div>
      )}
    </div>
  );
}
