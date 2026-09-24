import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img } from '../components/ui';
import { IcSettings, IcPlus } from '../res/icons';

/** 酒店客服(spec hotel.cs)。猜您想问/政策chip→模拟问答;发送输入;+面板;右上设置→csInfo。 */
const FAQS = ['有免费停车场吗?', '几点可以入住?', '含早餐吗?', '如何取消订单?', '酒店位置怎么走?', '可以开发票吗?'];
const PANEL_ITEMS = ['相册', '位置', '房型', '订单'];

export default function HotelCsPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((s) => s.hotels);
  const log = useCtripStore((s) => s._csLog);
  const csAsk = useCtripStore((s) => s.csAsk);
  const resetCs = useCtripStore((s) => s.resetCs);
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];
  const [input, setInput] = React.useState('');
  const [showPanel, setShowPanel] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => { resetCs(); }, [resetCs]);
  React.useEffect(() => { scrollRef.current?.scrollTo({ top: 9e9 }); }, [log]);

  const send = (text: string) => { if (text.trim()) { csAsk(text); setInput(''); } };

  return (
    <div className="flex flex-col h-full bg-[#F2F4F7]">
      <TopBar
        title="在线客服"
        rightContent={
          <button {...bindTap('hotelCs.toInfo', { params: { id: hotel.id } })} className="bg-transparent border-none cursor-pointer p-0"><IcSettings size={18} className="text-[#333333]" /></button>
        }
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 助手问候 */}
        <div className="flex gap-2 mb-3">
          <Img src="/@app-assets/Ctrip/gen/avatar_cs.png" className="w-8 h-8 rounded-full object-cover shrink-0" />
          <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 text-[13px] text-[#333333] max-w-[80%]">
            您好,我是{hotel.name}的智能助手,很高兴为您服务~您可以点下方问题快速咨询。
          </div>
        </div>

        {/* 猜您想问 */}
        {(!log || log.length === 0) && (
          <div className="bg-white rounded-xl p-3 mb-3">
            <div className="text-[12px] text-[#999999] mb-2">猜您想问</div>
            <div className="flex flex-col gap-2">
              {FAQS.map((q) => (
                <button
                  key={q}
                  {...bindTap({ kind: 'action', id: 'hotelCs.faq.select.parking' }, { params: { q }, onTrigger: () => send(q) })}
                  className="text-left text-[13px] text-[#0086F6] bg-[#F7FAFF] rounded-lg px-3 py-2 border-none cursor-pointer"
                >{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* 会话 */}
        {(log ?? []).map((m, i) => (
          <div key={i} className={`flex mb-3 ${m.role === 'user' ? 'justify-end' : 'gap-2'}`}>
            {m.role === 'assistant' && <Img src="/@app-assets/Ctrip/gen/avatar_cs.png" className="w-8 h-8 rounded-full object-cover shrink-0" />}
            <div className={`rounded-xl px-3 py-2 text-[13px] max-w-[80%] ${m.role === 'user' ? 'bg-[#0086F6] text-white rounded-tr-sm' : 'bg-white text-[#333333] rounded-tl-sm'}`}>{m.text}</div>
          </div>
        ))}
      </div>

      {/* 输入栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE]">
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            {...bindTap({ kind: 'action', id: 'hotelCs.send.value' }, { onTrigger: () => {} })}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
            placeholder="请输入您的问题"
            className="flex-1 bg-[#F2F4F7] rounded-full h-9 px-3 text-[14px] border-none outline-none"
          />
          <button
            {...bindTap({ kind: 'action', id: 'hotelCs.panel.toggle' }, { onTrigger: () => setShowPanel((v) => !v) })}
            className="w-8 h-8 rounded-full bg-[#F2F4F7] flex items-center justify-center border-none cursor-pointer"
          ><IcPlus size={18} className="text-[#666666]" /></button>
          <button onClick={() => send(input)} className="text-[13px] text-white bg-[#0086F6] rounded-full px-4 py-1.5 border-none cursor-pointer">发送</button>
        </div>
        {showPanel && (
          <div className="grid grid-cols-4 gap-2 px-3 pb-3">
            {PANEL_ITEMS.map((p) => (
              <button key={p} onClick={() => { setShowPanel(false); send(`我想了解${p}`); }} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                <span className="w-11 h-11 rounded-xl bg-[#F2F4F7] text-[#0086F6] flex items-center justify-center"><IcPlus size={18} /></span>
                <span className="text-[11px] text-[#666666]">{p}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
