import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';

const REASONS = [
  '不想买了',
  '商品选错了 / 信息填错了',
  '收货地址填错了',
  '价格有点贵',
  '暂时缺货 / 无货',
  '其他原因',
];

/** 取消订单页:选原因后提交 → 从订单列表移除 */
export function CancelOrderPage() {
  const { orderId = '' } = useParams();
  const { bindTap, go } = useJingdongGestures();
  const cancelOrder = useJingdongStore((s) => s.cancelOrder);
  const [reason, setReason] = useState('');

  const submit = () => {
    if (!reason) {
      showToast('请选择取消原因');
      return;
    }
    cancelOrder(orderId);
    showToast('订单已取消');
    go('ordercancel.done-to-orders');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="取消订单" className="pt-10" />
      <div className="px-3 py-3 text-[13px] text-[#888]">请选择取消原因</div>
      <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="cancel-order-scroll" data-scroll-direction="vertical">
        {REASONS.map((r) => {
          const on = reason === r;
          return (
            <button
              key={r}
              {...bindTap({ kind: 'action', id: 'ordercancel.reason.select' }, {
                params: { reason: r },
                onTrigger: () => setReason(r),
              })}
              className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F5F5F5] text-left"
            >
              <span className="text-[15px] text-[#1A1A1A]">{r}</span>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${on ? 'bg-[#E1251B]' : 'border border-[#CCC]'}`}>
                {on && <IcCheck size={13} className="text-white" />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="shrink-0 p-3 bg-white border-t border-[#EEE]">
        <button
          {...bindTap({ kind: 'action', id: 'ordercancel.submit' }, { onTrigger: submit })}
          disabled={!reason}
          className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-medium disabled:opacity-40"
        >
          提交
        </button>
      </div>
    </div>
  );
}
