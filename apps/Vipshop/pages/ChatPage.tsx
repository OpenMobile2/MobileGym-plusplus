import React, { useEffect, useRef, useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';
import { CHAT_QUICK_MENU } from '../constants';
import { IcService, IcSend, IcTicket } from '../res/icons';

/** 猜你想问(结构性常量) */
const CHAT_FAQ = ['尺码怎么选', '怎么申请价保', '物流到哪了', '怎么退货'] as const;

export default function ChatPage() {
  const { bindTap } = useVipshopGestures();
  const chatMessages = useVipshopStore((s) => s.chatMessages);
  const botReply = useVipshopStore((s) => s.botReply);
  const sendChatMessage = useVipshopStore((s) => s.sendChatMessage);
  const claimCoupon = useVipshopStore((s) => s.claimCoupon);

  const [input, setInput] = useState('');
  const [couponClaimed, setCouponClaimed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1600);
  };

  // 自动滚到底部(nice-to-have)
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    sendChatMessage(text);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="唯小蜜" />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        data-scroll-container="chat-messages"
        data-scroll-direction="vertical"
      >
        {chatMessages.map((m) => {
          if (m.sender === 'bot') {
            return (
              <div key={m.id} className="flex items-start gap-2 mb-3">
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FDECF5' }}>
                  <IcService size={17} style={{ color: VIP.primary }} />
                </span>
                <div className="max-w-[72%] bg-white rounded-lg rounded-tl-none px-3 py-2 text-[13px] leading-relaxed text-[#222222]">
                  {m.content}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="flex justify-end mb-3">
              <div
                className="max-w-[72%] rounded-lg rounded-tr-none px-3 py-2 text-[13px] leading-relaxed text-white"
                style={{ background: VIP.primary }}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {/* 券卡 */}
        {!couponClaimed && (
          <div className="flex items-start gap-2 mb-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FDECF5' }}>
              <IcService size={17} style={{ color: VIP.primary }} />
            </span>
            <div className="max-w-[80%] rounded-lg rounded-tl-none overflow-hidden" style={{ background: 'linear-gradient(90deg,#FF1F91,#E4007F)' }}>
              <div className="flex items-center gap-3 px-3 py-2.5">
                <IcTicket size={22} className="text-white shrink-0" />
                <div className="flex-1 min-w-0 text-white">
                  <div className="text-[15px] font-bold">客服专享券 ¥20</div>
                  <div className="text-[11px] opacity-90">满199可用</div>
                </div>
                <button
                  {...bindTap({ kind: 'action', id: 'chat.coupon.submit' }, {
                    onTrigger: () => {
                      claimCoupon('客服专享券', 20, '满199可用');
                      setCouponClaimed(true);
                      showToast('领取成功');
                    },
                  })}
                  className="text-[12px] font-semibold rounded-full px-3 py-1 bg-white border-none cursor-pointer shrink-0"
                  style={{ color: VIP.primary }}
                >
                  领取
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 猜你想问 */}
      <div className="shrink-0 bg-white px-3 pt-2 border-t border-[#F5F5F5]">
        <div className="text-[11px] text-[#888888] mb-1.5">猜你想问</div>
        <div className="flex flex-wrap gap-2">
          {CHAT_FAQ.map((q) => (
            <button
              key={q}
              {...bindTap({ kind: 'action', id: 'chat.faq.select.target' }, {
                params: { target: q },
                onTrigger: () => botReply(q),
              })}
              className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white"
              style={{ color: VIP.primary, borderColor: '#FBD3E7' }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 快捷菜单 */}
      <div className="shrink-0 bg-white flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar">
        {CHAT_QUICK_MENU.map((m) => (
          <button
            key={m}
            {...bindTap({ kind: 'action', id: 'chat.menu.select.target' }, {
              params: { target: m },
              onTrigger: () => botReply(m),
            })}
            className="shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer"
            style={{ color: '#666', borderColor: '#EEE', background: '#F8F8F8' }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 底部输入栏(flex,非 fixed) */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center gap-2 px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          placeholder="请输入您的问题…"
          className="flex-1 h-9 rounded-full bg-[#F5F5F5] px-4 text-[13px] text-[#222222] border-none outline-none"
        />
        <button
          data-keep-keyboard="true"
          {...bindTap({ kind: 'action', id: 'chat.message.send' }, { onTrigger: handleSend })}
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer text-white"
          style={{ background: VIP.primary }}
          aria-label="发送"
        >
          <IcSend size={17} />
        </button>
      </div>

      {toast && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/70 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap max-w-[80%] text-center">
          {toast}
        </div>
      )}
    </div>
  );
}
