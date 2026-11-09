import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { ItemImage, Avatar } from '../components/ItemImage';
import { IcNavBack, IcPlus } from '../res/icons';

export default function ChatPage() {
  const { chatId = '' } = useParams();
  const [sp] = useSearchParams();
  const { bindTap, bindBack } = useXianyuGestures();

  const chats = useXianyuStore((s) => s.chats);
  const items = useXianyuStore((s) => s.items);
  const ensureChat = useXianyuStore((s) => s.ensureChat);
  const sendChatMessage = useXianyuStore((s) => s.sendChatMessage);
  const markChatRead = useXianyuStore((s) => s.markChatRead);
  const coupons = useXianyuStore((s) => s.coupons);
  const claimCoupon = useXianyuStore((s) => s.claimCoupon);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const sellerId = chatId.startsWith('ch_') ? chatId.slice(3) : chatId;
  const itemId = sp.get('itemId') ?? '';

  // 只依赖路由参数:ensureChat/markChatRead 会改写 chats,若把 chats 放进依赖会无限重渲染。
  // ensureChat 幂等(已存在则返回原会话),markChatRead 幂等置 0。
  useEffect(() => {
    if (!chatId) return;
    ensureChat(sellerId, itemId || undefined);
    markChatRead(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, sellerId, itemId]);

  const chat = chats.find((c) => c.id === chatId);
  const item = items.find((i) => i.id === (chat?.itemId ?? itemId));

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [chat?.messages.length]);

  const send = () => { if (draft.trim()) { sendChatMessage(chatId, draft); setDraft(''); } };

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <div className="h-11 flex items-center px-2 shrink-0 bg-white border-b border-[#EEE]">
        <button {...bindBack()} aria-label="返回" className="bg-transparent border-none cursor-pointer"><IcNavBack size={26} className="text-[#111]" /></button>
        <div className="flex-1 text-center font-semibold text-[15px] text-[#111] truncate">{chat?.name ?? '聊天'}</div>
        <div className="w-8" />
      </div>

      {/* 顶部商品条 */}
      {item && (
        <div className="bg-white flex items-center gap-2 px-3 py-2 border-b border-[#F2F2F2] shrink-0">
          <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-11 h-11 rounded-md" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-[#333] truncate">{item.title}</div>
            <div className="text-[#FF3B30] font-bold text-[14px]"><span className="text-[11px]">¥</span>{item.price}</div>
          </div>
          <button
            {...bindTap('detail.buy-open', { params: { itemId: item.id } })}
            className="text-[13px] text-white font-semibold px-4 h-8 rounded-full border-none cursor-pointer"
            style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
          >立即购买</button>
        </div>
      )}

      {/* 对话 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3" data-scroll-container="ChatPage-main" data-scroll-direction="vertical">
        <div className="text-center text-[11px] text-[#999]">和卖家友好沟通,理性砍价~</div>
        {chat?.messages.map((m) => m.type === 'system' && m.content.startsWith('优惠券:') ? (() => {
          const couponId = m.content.slice('优惠券:'.length);
          const coupon = coupons.find((c) => c.id === couponId);
          if (!coupon) return null;
          return (
            <div key={m.id} className="mx-8 rounded-xl bg-[#FFF3E0] border border-[#FFD19A] px-3 py-3 flex items-center gap-2">
              <div className="flex-1"><div className="text-[14px] font-semibold text-[#FF6A00]">¥{coupon.amount} {coupon.title}</div><div className="text-[11px] text-[#999]">{coupon.thresholdText}</div></div>
              <button {...bindTap({ kind: 'action', id: 'chat.coupon.claim' }, { params: { couponId }, onTrigger: () => claimCoupon(couponId) })} disabled={coupon.claimed} className="px-3 h-8 rounded-full border-none bg-[#FF6A00] text-white text-[12px] disabled:bg-[#CCC]">{coupon.claimed ? '已领取' : '领取'}</button>
            </div>
          );
        })() : (
          m.sender === 'me' ? (
            <div key={m.id} className="flex justify-end items-start gap-2">
              <div className="max-w-[70%] bg-[#FFE411] text-[#111] text-[14px] px-3 py-2 rounded-2xl rounded-tr-sm">{m.content}</div>
              <Avatar seed="me" name="我" size={32} />
            </div>
          ) : (
            <div key={m.id} className="flex items-start gap-2">
              <Avatar seed={chat.sellerId} name={chat.name} size={32} />
              <div className="max-w-[70%] bg-white text-[#1A1A1A] text-[14px] px-3 py-2 rounded-2xl rounded-tl-sm">{m.content}</div>
            </div>
          ))
        )}
      </div>

      {/* 输入栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] flex items-center gap-2 px-2 py-2" data-keep-keyboard="true">
        <input
          {...bindTap({ kind: 'action', id: 'chat.message.input' }, { onTrigger: () => {} })}
          value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="发消息…" className="flex-1 h-9 rounded-full bg-[#F4F4F4] px-3 text-[14px] border-none outline-none"
        />
        <button aria-label="更多" className="bg-transparent border-none cursor-pointer text-[#666]"><IcPlus size={22} /></button>
        <button
          {...bindTap({ kind: 'action', id: 'chat.message.send' }, { onTrigger: send })}
          className="text-[14px] text-[#111] font-semibold bg-[#FFE411] px-4 h-9 rounded-full border-none cursor-pointer"
        >发送</button>
      </div>
    </div>
  );
}
