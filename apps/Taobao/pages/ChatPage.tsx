import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, useToast } from '../components/ui';
import { IcSmile, IcCirclePlus, IcMic } from '../res/icons';

/**
 * 会话页(spec: message.chat / message.aiChat,IMG_8744/8713)
 * 机器人地址确认卡、商品浮卡、文字消息;AI 会话脚本化回复。
 */
export default function ChatPage() {
  const { chatId = '' } = useParams();
  const { bindTap } = useTaobaoGestures();
  const chat = useTaobaoStore((s) => s.chats.find((c) => c.id === chatId));
  const shop = useTaobaoStore((s) => s.shops.find((x) => x.id === chat?.shopId));
  const items = useTaobaoStore((s) => s.items);
  const orders = useTaobaoStore((s) => s.orders);
  const footprints = useTaobaoStore((s) => s.footprints);
  const sendChatMessage = useTaobaoStore((s) => s.sendChatMessage);
  const sendChatItemCard = useTaobaoStore((s) => s.sendChatItemCard);
  const confirmChatAddress = useTaobaoStore((s) => s.confirmChatAddress);
  const markChatRead = useTaobaoStore((s) => s.markChatRead);

  const [input, setInput] = useState('');
  const [floatCardVisible, setFloatCardVisible] = useState(true);
  const [toast, showToast] = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) markChatRead(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat?.messages.length]);

  if (!chat) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F7]">
        <TopBar title="会话" />
        <div className="flex-1 flex items-center justify-center text-[#999999]">会话不存在</div>
      </div>
    );
  }

  // 浮卡优先跟随"最近浏览的本店商品"(footprints 最新在前),
  // 其次回落到本店最近订单 —— 修复"咨询的永远是同一订单"
  const recentFp = footprints
    .map((f) => items.find((i) => i.id === f.itemId))
    .find((i) => i && i.shopId === chat.shopId);
  const relatedOrder = orders.find((o) => o.shopId === chat.shopId);
  const floatItem = recentFp
    ?? (relatedOrder ? items.find((i) => i.id === relatedOrder.lines[0].itemId) : undefined);
  const defaultAddr = useTaobaoStore.getState().addresses.find((a) => a.isDefault);

  const send = () => {
    if (!input.trim()) return;
    sendChatMessage(chat.id, input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar
        title={
          <span>
            {chat.name}
            {shop && <span className="block text-[10px] text-[#FFB800] font-normal">★★★★★ {shop.rating}</span>}
          </span>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2" data-scroll-container="chat-messages" data-scroll-direction="vertical">
        {chat.messages.map((m) => (
          <div key={m.id} className={`flex gap-2 mb-3 ${m.sender === 'me' ? 'flex-row-reverse' : ''}`}>
            <Img
              src={m.sender === 'me' ? '/@app-assets/Taobao/avatars/me.svg' : chat.avatar}
              className="w-8 h-8 rounded-lg shrink-0"
            />
            {m.type === 'addressConfirm' ? (
              <div className="bg-white rounded-xl p-3 max-w-[78%]">
                <div className="text-[11px] text-[#999999] mb-1">客服机器人</div>
                <div className="text-[14px] font-semibold">请确认收货地址</div>
                {relatedOrder && floatItem && (
                  <div className="flex gap-2 mt-2 bg-[#FAFAFA] rounded-lg p-2">
                    <Img src={floatItem.image} className="w-10 h-10 rounded" />
                    <div className="text-[11px] text-[#666666] flex-1 line-clamp-2">{floatItem.title}</div>
                  </div>
                )}
                <div className="text-[12px] text-[#666666] mt-2 leading-relaxed">
                  收件人:{defaultAddr?.name}<br />
                  手机号码:{defaultAddr ? `${defaultAddr.phone.slice(0, 3)}****${defaultAddr.phone.slice(-4)}(号码保护中)` : ''}<br />
                  详细地址:{defaultAddr ? defaultAddr.region.replace(/ /g, '') + defaultAddr.detail : ''}
                </div>
                {m.confirmed ? (
                  <div className="text-[12px] text-[#00B578] mt-2">✓ 已确认</div>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <button className="flex-1 text-[13px] rounded-full border border-[#FF5000] text-[#FF5000] bg-white py-1.5 cursor-pointer">
                      修改地址
                    </button>
                    <button
                      {...bindTap({ kind: 'action', id: 'chat.addressCard.confirm' }, {
                        params: { messageId: m.id },
                        onTrigger: () => confirmChatAddress(chat.id, m.id),
                      })}
                      className="flex-1 text-[13px] rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white border-none py-1.5 cursor-pointer"
                    >
                      确认
                    </button>
                  </div>
                )}
              </div>
            ) : m.type === 'itemCard' ? (
              <div className="bg-white rounded-xl p-2.5 max-w-[70%]">
                {(() => {
                  const it = items.find((i) => i.id === m.itemId);
                  return it ? (
                    <div className="flex gap-2">
                      <Img src={it.image} className="w-12 h-12 rounded" />
                      <div className="min-w-0">
                        <div className="text-[12px] line-clamp-2">{it.title}</div>
                        <Price value={it.price} size="s" />
                      </div>
                    </div>
                  ) : <span className="text-[12px]">[商品]</span>;
                })()}
              </div>
            ) : (
              <div className={`rounded-xl px-3 py-2 max-w-[70%] text-[14px] leading-relaxed ${
                m.sender === 'me' ? 'bg-[#CFE8FF]' : 'bg-white'
              }`}>
                {m.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 商品浮卡 */}
      {chat.kind === 'shop' && floatItem && floatCardVisible && (
        <div className="shrink-0 mx-3 mb-1.5 bg-white rounded-xl p-2.5 flex items-center gap-2 shadow">
          <Img src={floatItem.image} className="w-11 h-11 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] text-[#999999]">{recentFp ? '你可能想咨询该宝贝' : '你可能想咨询该订单'}</div>
            <div className="text-[12px] line-clamp-1">{floatItem.title}</div>
            {recentFp ? (
              <div className="text-[11px]"><Price value={floatItem.price} size="s" /></div>
            ) : (
              <div className="text-[11px]">共{relatedOrder!.lines.length}件商品 合计 <Price value={relatedOrder!.paidAmount} size="s" /></div>
            )}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'chat.itemCard.send' }, {
              params: { itemId: floatItem.id },
              onTrigger: () => { sendChatItemCard(chat.id, floatItem.id); setFloatCardVisible(false); },
            })}
            className="text-[12px] text-white bg-gradient-to-r from-[#FF9402] to-[#FF5000] rounded-full px-3 py-1.5 border-none cursor-pointer shrink-0"
          >
            发送
          </button>
          <button onClick={() => setFloatCardVisible(false)} className="text-[#BBBBBB] bg-transparent border-none cursor-pointer">✕</button>
        </div>
      )}

      {/* 输入栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center gap-2 px-3 py-2" data-keep-keyboard="true">
        <button onClick={() => showToast('语音输入暂未开放')} className="bg-transparent border-none cursor-pointer p-0 shrink-0">
          <IcMic size={20} className="text-[#666666]" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={chat.kind === 'ai' ? '发消息或按住说话…' : '输入消息…'}
          className="flex-1 bg-[#F5F5F5] rounded-full h-9 px-3 text-[14px] border-none outline-none"
          data-keep-keyboard="true"
        />
        <button onClick={() => showToast('表情暂未开放')} className="bg-transparent border-none cursor-pointer p-0 shrink-0">
          <IcSmile size={20} className="text-[#666666]" />
        </button>
        {input.trim() ? (
          chat.kind === 'ai' ? (
            <button
              {...bindTap({ kind: 'action', id: 'aiChat.message.send' }, { onTrigger: send })}
              className="text-[13px] text-white bg-gradient-to-r from-[#FF9402] to-[#FF5000] rounded-full px-3.5 py-1.5 border-none cursor-pointer shrink-0"
              data-keep-keyboard="true"
            >
              发送
            </button>
          ) : (
            <button
              {...bindTap({ kind: 'action', id: 'chat.message.send' }, { onTrigger: send })}
              className="text-[13px] text-white bg-gradient-to-r from-[#FF9402] to-[#FF5000] rounded-full px-3.5 py-1.5 border-none cursor-pointer shrink-0"
              data-keep-keyboard="true"
            >
              发送
            </button>
          )
        ) : (
          <button onClick={() => showToast('图片/文件发送暂未开放')} className="bg-transparent border-none cursor-pointer p-0 shrink-0">
            <IcCirclePlus size={20} className="text-[#666666]" />
          </button>
        )}
      </div>
      {toast}
    </div>
  );
}
