import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, PriceYuan } from '../components/ui';
import type { ChatMessage } from '../types';

// 会话页
export function ConversationPage() {
  const { chatId } = useParams();
  const { bindTap } = usePinduoduoGestures();
  const chat = usePinduoduoStore((s) => s.chats.find((c) => c.id === chatId));
  const items = usePinduoduoStore((s) => s.items);
  const markChatRead = usePinduoduoStore((s) => s.markChatRead);
  const quickAsk = usePinduoduoStore((s) => s.quickAsk);
  const sendMessage = usePinduoduoStore((s) => s.sendMessage);

  const [text, setText] = useState('');

  useEffect(() => {
    if (chatId) markChatRead(chatId);
  }, [chatId, markChatRead]);

  if (!chat) {
    return (
      <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
        <TopBar title="会话" />
        <div className="flex-1 flex items-center justify-center text-[#999]">会话不存在</div>
      </div>
    );
  }

  const renderCard = (m: ChatMessage) => {
    const item = items.find((i) => i.id === m.itemId);
    if (!item) return null;
    return (
      <div className="bg-white rounded-lg overflow-hidden w-56 border border-[#F0F0F0]">
        <div className="flex gap-2 p-2">
          <Img src={item.image} className="w-16 h-16 rounded object-cover bg-[#F5F5F5]" alt={item.title} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#333] line-clamp-2 leading-snug">{item.title}</div>
            <PriceYuan value={item.pinPrice} className="text-[#E22E1F] text-[15px] mt-1 inline-block" />
          </div>
        </div>
        <button
          {...bindTap('conversation.item-open', { params: { itemId: item.id } })}
          className="w-full h-9 bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[13px] font-medium"
        >
          发起拼单
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title={chat.name} />

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" data-scroll-container data-scroll-direction="vertical">
        {chat.messages.map((m) => {
          const me = m.sender === 'me';
          return (
            <div key={m.id} className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
              {!me && <Img src={chat.avatar} className="w-8 h-8 rounded-full object-cover bg-[#F2F2F2] mr-2 shrink-0" alt="" />}
              <div className="max-w-[70%]">
                {m.type === 'itemCard' ? (
                  renderCard(m)
                ) : (
                  <div
                    className={`px-3 py-2 rounded-lg text-[14px] leading-snug break-words ${
                      me ? 'bg-[#E22E1F] text-white' : 'bg-white text-[#333]'
                    }`}
                  >
                    {m.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 快捷问题 */}
      {chat.quickQuestions.length > 0 && (
        <div className="shrink-0 px-3 pb-1 flex flex-wrap gap-2" data-hide-on-keyboard>
          {chat.quickQuestions.map((q) => (
            <button
              key={q}
              {...bindTap(
                { kind: 'action', id: 'conversation.quick.ask' },
                { params: { question: q }, onTrigger: () => quickAsk(chat.id, q) },
              )}
              className="px-3 h-7 rounded-full bg-white border border-[#EEE] text-[12px] text-[#666]"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 输入栏 */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-t border-[#EEE]" data-keep-keyboard>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请输入消息…"
          className="flex-1 h-9 px-3 rounded-full bg-[#F5F5F5] text-[14px] text-[#333] outline-none"
        />
        <button
          {...bindTap(
            { kind: 'action', id: 'conversation.message.send' },
            {
              params: { value: text },
              onTrigger: () => {
                if (text.trim()) {
                  sendMessage(chat.id, text);
                  setText('');
                }
              },
            },
          )}
          className="shrink-0 px-4 h-9 rounded-full bg-[#E22E1F] text-white text-[14px] font-medium"
        >
          发送
        </button>
      </div>
    </div>
  );
}
