import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img } from '../components/ui';

/** 客服(spec cs.main)。铂金问候/选订单/常见问题chip→模拟回答/在线客服→模拟对话(用户要求非stub)。 */
const FAQS = ['如何申请退款?', '订单如何改签?', '发票怎么开?', '积分有什么用?', '会员权益是什么?', '如何联系酒店?'];

export default function CsMainPage() {
  const { bindTap } = useCtripGestures();
  const user = useCtripStore((s) => s.user);
  const orders = useCtripStore((s) => s.orders);
  const log = useCtripStore((s) => s._csLog);
  const csAsk = useCtripStore((s) => s.csAsk);
  const resetCs = useCtripStore((s) => s.resetCs);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { resetCs(); }, [resetCs]);
  React.useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9 }); }, [log]);

  return (
    <div className="flex flex-col h-full bg-[#F2F4F7]">
      <TopBar title="客服中心" />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 问候 */}
        <div className="flex gap-2 mb-3">
          <Img src="/@app-assets/Ctrip/gen/avatar_cs.png" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-[#333333] max-w-[85%]">
            {user.name},您好!您是我们尊贵的{user.memberLevel},很高兴为您服务。请问有什么可以帮您?
          </div>
        </div>

        {/* 选订单 */}
        <div className="bg-white rounded-xl p-3 mb-3">
          <div className="text-[12px] text-[#999999] mb-2">选择咨询订单</div>
          <div className="flex gap-2 overflow-x-auto">
            {orders.slice(0, 3).map((o) => (
              <button key={o.id} {...bindTap({ kind: 'action', id: 'cs.faq.select.refund' }, { params: { order: o.id }, onTrigger: () => csAsk(`我想咨询订单「${o.title}」的${o.statusText}问题`) })} className="shrink-0 text-left bg-[#F7FAFF] rounded-lg px-3 py-2 border border-[#E5EEF7] cursor-pointer w-40">
                <div className="text-[12px] text-[#222222] line-clamp-1">{o.title}</div>
                <div className="text-[11px] text-[#999999] mt-0.5">{o.statusText}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 常见问题 */}
        {(!log || log.length === 0) && (
          <div className="bg-white rounded-xl p-3 mb-3">
            <div className="text-[12px] text-[#999999] mb-2">常见问题</div>
            <div className="grid grid-cols-1 gap-2">
              {FAQS.map((q) => (
                <button key={q} {...bindTap({ kind: 'action', id: 'cs.faq.select.refund' }, { params: { q }, onTrigger: () => csAsk(q) })} className="text-left text-[13px] text-[#0086F6] bg-[#F7FAFF] rounded-lg px-3 py-2 border-none cursor-pointer">{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* 会话 */}
        {(log ?? []).map((m, i) => (
          <div key={i} className={`flex mb-3 ${m.role === 'user' ? 'justify-end' : 'gap-2'}`}>
            {m.role === 'assistant' && <Img src="/@app-assets/Ctrip/gen/avatar_cs.png" className="w-8 h-8 rounded-full object-cover shrink-0" />}
            <div className={`rounded-xl px-3 py-2 text-[13px] max-w-[85%] ${m.role === 'user' ? 'bg-[#0086F6] text-white rounded-tr-sm' : 'bg-white text-[#333333] rounded-tl-sm'}`}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* 底部入口 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex gap-3 px-3 py-2.5">
        <button {...bindTap({ kind: 'action', id: 'cs.online.open' }, { onTrigger: () => csAsk('我要转人工在线客服') })} className="flex-1 py-2.5 rounded-full bg-[#0086F6] text-white text-[14px] border-none cursor-pointer">在线客服</button>
        <button className="flex-1 py-2.5 rounded-full border border-[#0086F6] text-[#0086F6] text-[14px] bg-white cursor-pointer">电话客服</button>
      </div>
    </div>
  );
}
