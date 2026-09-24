import React from 'react';
import { useParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { TopBar, EmptyState, showToast } from '../components/ui';
import { IcTruck, IcCopy } from '../res/icons';

export function LogisticsPage() {
  const { orderId } = useParams();
  const { bindTap } = usePinduoduoGestures();
  const order = usePinduoduoStore((s) => s.orders.find((o) => o.id === orderId));

  if (!order) {
    return <div className="h-full pt-10 flex items-center justify-center text-[#999]">订单不存在</div>;
  }

  const { logistics, status } = order;
  const nodes = logistics.nodes || [];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="物流详情" className="bg-white" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 顶部状态 */}
        <div className="bg-white px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF0E8] flex items-center justify-center shrink-0">
            <IcTruck size={22} className="text-[#E22E1F]" />
          </div>
          <div>
            <div className="text-[15px] font-medium text-[#333]">
              {status === 'completed' ? '已签收' : '运输中'}
            </div>
            <div className="text-[12px] text-[#999] mt-0.5">
              {status === 'completed' ? '包裹已送达,感谢使用拼多多' : '包裹正在路上,请耐心等待'}
            </div>
          </div>
        </div>

        {/* 快递公司 + 单号 */}
        {logistics.trackingNo && (
          <div className="mt-2 bg-white px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[13px] text-[#333]">{logistics.company || '快递'}</div>
              <div className="text-[13px] text-[#666] mt-1 truncate">运单号:{logistics.trackingNo}</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'logistics.copy.trackno' }, {
                onTrigger: () => showToast('已复制单号'),
              })}
              className="flex items-center gap-1 px-3 h-7 rounded-full border border-[#DDD] text-[12px] text-[#666] shrink-0"
            >
              <IcCopy size={13} /> 复制
            </button>
          </div>
        )}

        {/* 时间线 */}
        <div className="mt-2 bg-white px-4 py-3">
          {nodes.length === 0 ? (
            <EmptyState text="暂无物流轨迹" />
          ) : (
            nodes.map((n, i) => {
              const first = i === 0;
              return (
                <div key={i} className="flex gap-3">
                  {/* 圆点 + 竖线 */}
                  <div className="flex flex-col items-center">
                    <span className={`w-2.5 h-2.5 rounded-full mt-1.5 ${n.done ? 'bg-[#20B010]' : 'bg-[#CCC]'}`} />
                    {i < nodes.length - 1 && <span className="flex-1 w-px bg-[#EEE] my-1" />}
                  </div>
                  <div className={`flex-1 pb-4 ${first ? '' : ''}`}>
                    <div className={`text-[13px] leading-snug ${n.done && first ? 'text-[#20B010] font-medium' : 'text-[#333]'}`}>
                      {n.text}
                    </div>
                    <div className="text-[12px] text-[#999] mt-1">{n.time}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
