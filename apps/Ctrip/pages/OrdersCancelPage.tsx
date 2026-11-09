import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, useToast } from '../components/ui';

/** 取消订单：原因文案按品类区分。 */
export default function OrdersCancelPage() {
  const s = useCtripStrings();
  const { id = '' } = useParams();
  const { bindTap, go } = useCtripGestures();
  const [toast, showToast] = useToast();
  const orders = useCtripStore((st) => st.orders);
  const cancelOrder = useCtripStore((st) => st.cancelOrder);
  const order = orders.find((o) => o.id === id);
  const [reason, setReason] = React.useState('');

  const GROUPS = React.useMemo(() => {
    const cat = order?.category || 'hotel';
    if (cat === 'car') {
      return [
        { title: s.t('与商家有关'), reasons: [s.t('门店无法提供车辆'), s.t('车型与描述不符'), s.t('临时无车')] },
        { title: s.t('与自己有关'), reasons: [s.t('行程有变'), s.t('重复预订'), s.t('不想租了')] },
        { title: s.t('其它原因'), reasons: [s.t('价格问题'), s.t('其它')] },
      ];
    }
    if (cat === 'train' || cat === 'flight') {
      return [
        { title: s.t('与商家有关'), reasons: [s.t('航班/车次变动'), s.t('座席与描述不符'), s.t('临时无票')] },
        { title: s.t('与自己有关'), reasons: [s.t('行程有变'), s.t('重复预订'), s.t('不想去了')] },
        { title: s.t('其它原因'), reasons: [s.t('价格问题'), s.t('其它')] },
      ];
    }
    if (cat === 'ticket') {
      return [
        { title: s.t('与商家有关'), reasons: [s.t('景点无法接待'), s.t('票种与描述不符'), s.t('临时无票')] },
        { title: s.t('与自己有关'), reasons: [s.t('行程有变'), s.t('重复预订'), s.t('不想去了')] },
        { title: s.t('其它原因'), reasons: [s.t('价格问题'), s.t('其它')] },
      ];
    }
    return [
      { title: s.t('与商家有关'), reasons: [s.t('商家无法提供服务'), s.t('房型与描述不符'), s.t('临时无房')] },
      { title: s.t('与自己有关'), reasons: [s.t('行程有变'), s.t('重复预订'), s.t('不想去了')] },
      { title: s.t('其它原因'), reasons: [s.t('价格问题'), s.t('其它')] },
    ];
  }, [order?.category, s]);

  const submit = () => {
    if (!reason) { showToast(s.t('请选择取消原因')); return; }
    cancelOrder(id);
    showToast(s.t('已提交取消申请'));
    // 退款完成后回到订单列表，而不是依赖浏览器历史。订单可能来自收银台
    // 的“查看订单”，直接 back 会把用户重新带回已经失效的收银台。
    window.setTimeout(() => go('mine.toOrders', { state: 'refund' }), 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('取消订单')} backTo="/orders" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3 text-[13px] text-[#666666]">
          {order ? `${order.title} · ${order.statusText}` : s.t('请选择取消原因,我们会尽快为您处理退款。')}
        </div>
        {GROUPS.map((g) => (
          <div key={g.title} className="bg-white mt-2 px-4 py-2">
            <div className="text-[13px] text-[#999999] py-2">{g.title}</div>
            {g.reasons.map((r) => (
              <button
                key={r}
                {...bindTap({ kind: 'action', id: 'orderCancel.reason.select.changed' }, { params: { reason: r }, onTrigger: () => setReason(r) })}
                className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
              >
                <span className="text-[14px] text-[#333333]">{r}</span>
                <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${reason === r ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
        <button
          {...bindTap({ kind: 'action', id: 'orderCancel.apply.submit' }, { onTrigger: submit })}
          className="w-full py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer"
        >{s.t('提交申请')}</button>
      </div>
      {toast}
    </div>
  );
}
