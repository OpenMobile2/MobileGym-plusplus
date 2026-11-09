import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, TopBar, fmtTime } from '../components/common';
import { IcDown, IcRight, IcUp } from '../res/icons';
import type { OrderStatus } from '../types';

const STATUS_TEXT: Record<OrderStatus, string> = {
  unpaid: '待支付',
  preparing: '商家接单中',
  delivering: '配送中',
  delivered: '订单已送达',
  canceled: '已取消',
  refunding: '退款中',
  refunded: '退款成功',
};

/** 骑手聊天页(spec chat.rider,证据 IMG_6028) */
export default function RiderChatPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const { orderId = '' } = useParams();

  const order = useTbsgStore((st) => st.orders.find((o) => o.id === orderId));
  const shop = useTbsgStore((st) => st.shops.find((x) => x.id === order?.shopId));
  const chats = useTbsgStore((st) => st.chats);
  const sendChat = useTbsgStore((st) => st.sendChat);

  const chatKey = `rider:${orderId}`;
  const msgs = chats[chatKey] ?? [];

  const [text, setText] = useState('');
  const [cardOpen, setCardOpen] = useState(true);
  const [viewImg, setViewImg] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const doSend = () => {
    const t = text.trim();
    if (!t) return;
    sendChat(chatKey, t);
    setText('');
  };

  const riderAvatar = '/@app-assets/TaobaoShangou/avatars/rider.jpg';

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar
        titleLeft
        title={(
          <div className="leading-tight">
            <div className="text-[16px] font-semibold text-[#1A1A1A]">{order?.riderName || '骑士'}</div>
            <div className="text-[11px] font-normal text-[#999999]">当前订单</div>
          </div>
        )}
      />

      {/* 订单状态卡 */}
      <div className="bg-white shrink-0">
        {cardOpen && (
          <div
            {...bindTap<HTMLDivElement>('riderchat.order-open', { params: { orderId } })}
            className="flex items-center px-4 py-2.5 cursor-pointer"
          >
            <AppImg src={shop?.logo ?? ''} className="w-12 h-12 rounded-lg object-cover shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-[16px] font-semibold text-[#1A1A1A]">{order ? STATUS_TEXT[order.status] : '订单'}</div>
              <div className="text-[13px] text-[#999999] truncate mt-0.5">{shop?.fullName}</div>
            </div>
            <IcRight size={16} className="text-[#BBBBBB] shrink-0" />
          </div>
        )}
        <button
          onClick={() => setCardOpen((v) => !v)}
          aria-label={cardOpen ? '收起订单卡' : '展开订单卡'}
          className="w-full h-6 flex items-center justify-center bg-transparent border-none cursor-pointer"
        >
          {cardOpen ? <IcUp size={16} className="text-[#BBBBBB]" /> : <IcDown size={16} className="text-[#BBBBBB]" />}
        </button>
      </div>

      {/* 消息流 */}
      <div ref={listRef} data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3">
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const showTs = !prev || m.ts - prev.ts > 5 * 60_000;
          return (
            <div key={m.id}>
              {showTs && <div className="text-center text-[12px] text-[#BBBBBB] my-2.5">{fmtTime(m.ts)}</div>}
              {m.from === 'me' ? (
                <div className="flex justify-end mb-3">
                  <div className="max-w-[72%] bg-[#ED6C2C] text-white text-[15px] leading-relaxed rounded-xl rounded-tr-sm px-3 py-2 break-all">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div className="flex items-start mb-3">
                  <AppImg src={riderAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  {m.image ? (
                    <button
                      {...bindTap<HTMLButtonElement>(
                        { kind: 'action', id: 'riderchat.photo.view' },
                        { onTrigger: () => setViewImg(m.image ?? null) },
                      )}
                      className="ml-2 p-0 bg-transparent border-none cursor-pointer"
                    >
                      <AppImg src={m.image} className="w-44 h-56 rounded-xl object-cover" />
                    </button>
                  ) : (
                    <div className="ml-2 max-w-[72%] bg-white text-[#1A1A1A] text-[15px] leading-relaxed rounded-xl rounded-tl-sm px-3 py-2 break-all">
                      {m.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 输入条 */}
      <div data-keep-keyboard="true" className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] border-t border-[#EEEEEE]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={s.inputPlaceholder}
          className="flex-1 min-w-0 h-10 rounded-lg bg-white border-none outline-none px-3 text-[15px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
        />
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'riderchat.message.send' },
            { onTrigger: doSend },
          )}
          className="h-9 px-4 rounded-full bg-[#ED6C2C] text-white text-[14px] font-semibold border-none cursor-pointer shrink-0"
        >
          {s.sendBtn}
        </button>
      </div>

      {/* 凭证大图查看 */}
      {viewImg && (
        <div
          onClick={() => setViewImg(null)}
          className="absolute inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
        >
          <AppImg src={viewImg} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
