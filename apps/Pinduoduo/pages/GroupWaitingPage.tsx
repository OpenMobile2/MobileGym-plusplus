import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { showToast } from '../components/ui';
import { IcCheck, IcUsers, IcNavBack } from '../res/icons';

export function GroupWaitingPage() {
  const { bindTap, bindBack } = usePinduoduoGestures();
  const orders = usePinduoduoStore((s) => s.orders);
  const soloFinishGroup = usePinduoduoStore((s) => s.soloFinishGroup);

  const order = orders.find((o) => o.status === 'grouping') || orders[0];
  if (!order) {
    return <div className="h-full pt-10 flex items-center justify-center text-[#999]">暂无拼单</div>;
  }

  const need = order.groupNeed || 1;
  const slots = Math.min(Math.max(need + 1, 2), 5);

  return (
    <div className="h-full flex flex-col pt-10 bg-white overflow-hidden" data-status-bar-foreground="dark">
      <div className="shrink-0 h-11 flex items-center px-2">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center text-[16px] font-medium">拼单详情</div>
        <div className="w-9" />
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 下单成功头 */}
        <div className="flex flex-col items-center pt-8 pb-6 px-4 bg-gradient-to-b from-[#FFF3EF] to-white">
          <IcCheck size={52} className="text-[#20B010]" />
          <div className="mt-3 text-[18px] font-bold text-[#333]">下单成功</div>
          <div className="mt-1 text-[13px] text-[#20B010]">
            确认收货后自动付款 ¥{order.autoPayAmount}
          </div>
        </div>

        {/* 还差 N 人成团 */}
        <div className="px-4">
          <div className="text-center text-[22px] font-bold text-[#E22E1F]">
            还差 {need} 人成团
          </div>
          <div className="mt-5 flex items-center justify-center gap-4">
            {Array.from({ length: slots }).map((_, i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  i === 0 ? 'bg-[#E22E1F] text-white' : 'border-2 border-dashed border-[#E4A69E] text-[#E4A69E]'
                }`}
              >
                {i === 0 ? <span className="text-[12px]">团长</span> : <IcUsers size={22} />}
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-[12px] text-[#999]">
            邀请好友一起拼,人满自动成团
          </div>
        </div>

        {/* 按钮组 */}
        <div className="px-4 mt-8 flex flex-col gap-3">
          <button
            {...bindTap({ kind: 'action', id: 'group.invite.share' }, { onTrigger: () => showToast('已唤起分享') })}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[16px] font-medium"
          >
            邀请好友拼单
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'group.solo.finish' },
              { onTrigger: () => { soloFinishGroup(order.id); showToast('拼单成功'); } },
            )}
            className="w-full h-12 rounded-full border border-[#E22E1F] text-[#E22E1F] text-[16px] font-medium"
          >
            直接免拼
          </button>
          <div className="flex gap-6 justify-center mt-2 text-[13px]">
            <button
              {...bindTap('group.orderdetail-open', { params: { orderId: order.id } })}
              className="text-[#666]"
            >
              查看订单详情
            </button>
            <button {...bindTap('group.home-open')} className="text-[#666]">
              前往拼多多首页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
