import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, useToast } from '../components/ui';

/** 取消订单申请(spec orders.cancel)。原因分组单选;提交→cancelOrder+toast+返回。 */
const GROUPS = [
  { title: '与商家有关', reasons: ['商家无法提供服务', '房型/车次与描述不符', '临时无房/无票'] },
  { title: '与自己有关', reasons: ['行程有变', '重复预订', '不想去了'] },
  { title: '其它原因', reasons: ['价格问题', '其它'] },
];

export default function OrdersCancelPage() {
  const { id = '' } = useParams();
  const { bindTap, back } = useCtripGestures();
  const [toast, showToast] = useToast();
  const cancelOrder = useCtripStore((s) => s.cancelOrder);
  const [reason, setReason] = React.useState('');

  const submit = () => {
    cancelOrder(id);
    showToast('已提交取消申请');
    window.setTimeout(() => back(), 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="取消订单" />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 py-3 text-[13px] text-[#666666]">请选择取消原因,我们会尽快为您处理退款。</div>
        {GROUPS.map((g) => (
          <div key={g.title} className="bg-white mt-2 px-4 py-2">
            <div className="text-[13px] text-[#999999] py-2">{g.title}</div>
            {g.reasons.map((r) => (
              <button
                key={r}
                {...bindTap({ kind: 'action', id: 'orderCancel.reason.select.changed' }, { params: { reason: r }, onTrigger: () => setReason(r) })}
                className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
              >
                <span className="text-[14px] text-[#222222]">{r}</span>
                <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${reason === r ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
        <button
          {...bindTap({ kind: 'action', id: 'orderCancel.apply.submit' }, { onTrigger: submit })}
          disabled={!reason}
          className="w-full py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer disabled:opacity-50"
        >提交申请</button>
      </div>
      {toast}
    </div>
  );
}
