import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, Img, showToast, wontfix } from '../components/ui';
import { useJingdongStore } from '../state';
import { IcStore, IcSettings, IcPlus } from '../res/icons';
import type { ChatMessage } from '../types';

export function ConversationPage() {
  const { bindTap } = useJingdongGestures();
  const { chatId = '' } = useParams();

  const chats = useJingdongStore((s) => s.chats);
  const items = useJingdongStore((s) => s.items);
  const sendMessage = useJingdongStore((s) => s.sendMessage);
  const quickAsk = useJingdongStore((s) => s.quickAsk);
  const markChatRead = useJingdongStore((s) => s.markChatRead);
  const ensureShopChat = useJingdongStore((s) => s.ensureShopChat);

  // 约定 chatId = ch_<shopId>;但既有会话的 id 可能不同(如 ch_rider 的 shopId 也是 shop_hema),
  // 故先按 id、再按 shopId 解析,与 store.ensureShopChat 的查找口径一致。
  const shopIdFromChat = chatId.startsWith('ch_') ? chatId.slice(3) : '';
  const chat = chats.find((c) => c.id === chatId) || (shopIdFromChat ? chats.find((c) => c.shopId === shopIdFromChat) : undefined);
  // 发送/已读等必须打到「解析后的真实会话 id」,否则 sendMessage 匹配不到会静默失效。
  const activeChatId = chat?.id ?? chatId;
  const [text, setText] = useState('');
  const [plusOpen, setPlusOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 会话缺失兜底:进入 /message/ch_<shopId> 而该 shop 尚无任何会话时,惰性建店铺客服会话,
  // 避免出现「会话不存在」且发送按钮静默无效。
  useEffect(() => {
    if (!chat && shopIdFromChat && shopIdFromChat !== 'cs') ensureShopChat(shopIdFromChat);
  }, [chat, shopIdFromChat, ensureShopChat]);

  useEffect(() => {
    if (activeChatId) markChatRead(activeChatId);
  }, [activeChatId, markChatRead]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.messages.length]);

  // 底部商品卡:按会话店铺区分;客服会话不展示统一商品
  const shopItems = chat?.shopId ? items.filter((i) => i.shopId === chat.shopId) : [];
  const card =
    chat?.kind === 'cs'
      ? undefined
      : shopItems[0] ??
        (chat?.id
          ? items[Math.abs(chat.id.split('').reduce((n, c) => n + c.charCodeAt(0), 0)) % Math.max(items.length, 1)]
          : undefined);

  const doSend = (value: string) => {
    const v = value.trim();
    if (!v || !activeChatId) return;
    sendMessage(activeChatId, v);
    setText('');
  };

  const renderBubble = (m: ChatMessage) => {
    const me = m.sender === 'me';
    if (m.content === '[图片]') {
      return (
        <div className={`flex ${me ? 'justify-end' : 'justify-start'} px-3 mb-3`}>
          {!me && <Img src={chat!.avatar} className="w-9 h-9 rounded-full object-cover bg-[#F0F0F0] mr-2 shrink-0" />}
          <div className="w-32 h-32 rounded-lg bg-[#E9E9E9] flex items-center justify-center text-[#BBB] text-[12px]">[图片]</div>
        </div>
      );
    }
    return (
      <div className={`flex ${me ? 'justify-end' : 'justify-start'} px-3 mb-3`}>
        {!me && <Img src={chat!.avatar} className="w-9 h-9 rounded-full object-cover bg-[#F0F0F0] mr-2 shrink-0" />}
        <div
          className={`max-w-[70%] px-3.5 py-2.5 text-[15px] leading-relaxed rounded-2xl ${
            me ? 'bg-[#E1251B] text-white rounded-tr-md' : 'bg-white text-[#1A1A1A] rounded-tl-md'
          }`}
        >
          {m.content}
        </div>
      </div>
    );
  };

  const shopId = chat?.shopId;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar
        title={chat?.name ?? '会话'}
        className="pt-10 bg-white"
        right={
          <div className="flex items-center gap-3 text-[#333]">
            {shopId ? (
              <button {...bindTap('chat.shop-open', { params: { shopId } })} aria-label="进店">
                <IcStore size={22} />
              </button>
            ) : (
              <button {...bindTap({ kind: 'action', id: 'chat.settings.wontfix' }, { onTrigger: wontfix })} aria-label="店铺">
                <IcStore size={22} className="opacity-40" />
              </button>
            )}
            <button {...bindTap({ kind: 'action', id: 'chat.settings.wontfix' }, { onTrigger: wontfix })} aria-label="设置">
              <IcSettings size={20} />
            </button>
          </div>
        }
      />
      {chat && chat.kind === 'shop' && (
        <div className="shrink-0 flex gap-1.5 px-4 pb-2 bg-white">
          {['五星店铺', '高关注数', '本周上新'].map((t) => (
            <span key={t} className="text-[11px] leading-[16px] px-1.5 rounded-sm bg-[#FFF3E6] text-[#C8853A]">{t}</span>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-3" data-scroll-container="conversation-scroll" data-scroll-direction="vertical">
        <div className="text-center text-[12px] text-[#B5B5B5] mb-3">{chat?.time ?? ''}</div>
        {chat ? chat.messages.map((m) => <React.Fragment key={m.id}>{renderBubble(m)}</React.Fragment>) : (
          <div className="text-center text-[13px] text-[#BBB] py-10">会话不存在</div>
        )}
      </div>

      {/* 快捷问题气泡 */}
      {chat && chat.quickQuestions.length > 0 && (
        <div className="shrink-0 flex gap-2 px-3 py-2 overflow-x-auto" data-hide-on-keyboard>
          {chat.quickQuestions.map((q) => (
            <button
              key={q}
              {...bindTap({ kind: 'action', id: 'chat.quick.ask' }, { onTrigger: () => quickAsk(activeChatId, q) })}
              className="shrink-0 h-8 px-3 rounded-full bg-white border border-[#EEE] text-[13px] text-[#555]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 底部商品卡 + 发送 */}
      {card && (
        <div className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 bg-white border-t border-[#F0F0F0]" data-hide-on-keyboard>
          <button {...bindTap('chat.item-open', { params: { itemId: card.id } })} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <Img src={card.image} className="w-14 h-14 rounded object-cover bg-[#F5F5F5] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#1A1A1A] truncate">{card.title}</div>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[10px] leading-[15px] px-1 rounded-sm text-[#E1251B] border border-[#E1251B]/40">7天价保</span>
                <span className="text-[#E1251B] text-[14px] font-bold">¥{card.price}</span>
                <span className="text-[11px] text-[#999]">到手价</span>
              </div>
            </div>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'chat.message.send' }, { params: { value: card.title }, onTrigger: () => doSend(card.title) })}
            className="shrink-0 h-9 px-5 rounded-full bg-[#E1251B] text-white text-[14px] font-medium"
          >
            发送
          </button>
        </div>
      )}

      {plusOpen && (
        <div className="shrink-0 grid grid-cols-4 gap-2 px-3 py-3 bg-white border-t border-[#F0F0F0]">
          {[
            { label: '相册', tip: '请从相册选择图片' },
            { label: '拍照', tip: '相机暂未开放' },
            { label: '订单', tip: '请在「我的订单」中查看' },
            { label: '红包', tip: '红包功能暂未开放' },
          ].map((x) => (
            <button
              key={x.label}
              {...bindTap({ kind: 'action', id: 'chat.plus.panel' }, { onTrigger: () => { showToast(x.tip); setPlusOpen(false); } })}
              className="flex flex-col items-center gap-1 py-2"
            >
              <span className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[20px]">＋</span>
              <span className="text-[12px] text-[#666]">{x.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 输入框 + 发送 */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-t border-[#F0F0F0]" data-keep-keyboard="true">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入..."
          className="flex-1 h-9 px-3 rounded-full bg-[#F5F5F5] text-[14px] text-[#1A1A1A] outline-none"
        />
        {text.trim() ? (
          <button
            {...bindTap({ kind: 'action', id: 'chat.message.send' }, { params: { value: text }, onTrigger: () => doSend(text) })}
            className="shrink-0 h-9 px-5 rounded-full bg-[#E1251B] text-white text-[14px] font-medium"
          >
            发送
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'chat.plus.panel' }, { onTrigger: () => setPlusOpen((v) => !v) })}
            className="shrink-0 w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#666]"
          >
            <IcPlus size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
