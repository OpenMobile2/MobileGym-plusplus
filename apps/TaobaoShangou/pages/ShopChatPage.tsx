import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, TopBar, fmtTime, showToast } from '../components/common';
import { IcMic, IcOrders, IcPlus, IcSmile } from '../res/icons';

const EMOJIS = [
  '😀', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '😊', '😇', '🙂', '😉', '😍', '🥰',
  '😘', '😋', '🤔', '🤗', '😭', '😤', '😡', '👍', '👏', '🙏', '💪', '🎉', '❤️', '🔥',
];

const QUICK_QUESTIONS = ['索要发票', '食安售后'];

/** 商家聊天页(spec shop.chat,证据 IMG_6023/6024) */
export default function ShopChatPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, back } = useTbsgGestures();
  const { shopId = '' } = useParams();
  const [sp, setSp] = useSearchParams();

  const shop = useTbsgStore((st) => st.shops.find((x) => x.id === shopId));
  const chats = useTbsgStore((st) => st.chats);
  const sendChat = useTbsgStore((st) => st.sendChat);

  const chatKey = `shop:${shopId}`;
  const msgs = chats[chatKey] ?? [];
  const emojiOpen = sp.get('panel') === 'emoji';

  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, emojiOpen]);

  const doSend = () => {
    const t = text.trim();
    if (!t) return;
    sendChat(chatKey, t);
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar
        title={shop?.fullName ?? '商家'}
        right={(
          <button
            {...bindTap<HTMLButtonElement>('shopchat.shop-open', { params: { shopId } })}
            aria-label="进店"
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          >
            <AppImg src={shop?.logo ?? ''} className="w-7 h-7 rounded-full object-cover" />
          </button>
        )}
      />

      {/* 消息流(空=浅灰空白区) */}
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
                  <AppImg src={shop?.logo ?? ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <div className="ml-2 max-w-[72%] bg-white text-[#1A1A1A] text-[15px] leading-relaxed rounded-xl rounded-tl-sm px-3 py-2 break-all">
                    {m.text}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 快捷问题 + 输入条 + 表情面板 */}
      <div data-keep-keyboard="true" className="shrink-0">
        <div className="flex gap-2.5 px-3 pb-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shopchat.quickq.send' },
                { params: { q }, onTrigger: () => sendChat(chatKey, q) },
              )}
              className="h-9 px-4 rounded-lg bg-white text-[14px] text-[#1A1A1A] border-none cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F7F8FA] border-t border-[#EEEEEE]">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shopchat.misc.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            aria-label="语音"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] cursor-pointer shrink-0"
          >
            <IcMic size={18} className="text-[#1A1A1A]" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={s.inputPlaceholder}
            className="flex-1 min-w-0 h-10 rounded-lg bg-white border-none outline-none px-3 text-[15px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
          />
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shopchat.emoji.toggle' },
              {
                onTrigger: () => {
                  if (emojiOpen) back();
                  else setSp((p) => { p.set('panel', 'emoji'); return p; });
                },
              },
            )}
            aria-label="表情"
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          >
            <IcSmile size={22} className="text-[#1A1A1A]" />
          </button>
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'shopchat.misc.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            aria-label="清单"
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          >
            <IcOrders size={22} className="text-[#1A1A1A]" />
          </button>
          {text.trim() ? (
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shopchat.message.send' },
                { onTrigger: doSend },
              )}
              className="h-9 px-4 rounded-full bg-[#ED6C2C] text-white text-[14px] font-semibold border-none cursor-pointer shrink-0"
            >
              {s.sendBtn}
            </button>
          ) : (
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shopchat.misc.stub' },
                { onTrigger: () => showToast(s.notOpen) },
              )}
              aria-label="更多"
              className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            >
              <IcPlus size={22} className="text-[#1A1A1A]" />
            </button>
          )}
        </div>

        {/* 表情面板(panel=emoji) */}
        {emojiOpen && (
          <div className="h-60 bg-[#F7F8FA] flex">
            <div data-scroll-container="emoji" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
              <div className="text-[13px] text-[#999999] mb-2">全部表情</div>
              <div className="grid grid-cols-7 gap-y-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    {...bindTap<HTMLButtonElement>(
                      { kind: 'action', id: 'shopchat.emoji.pick' },
                      { params: { emoji }, onTrigger: () => setText((prev) => prev + emoji) },
                    )}
                    className="h-10 flex items-center justify-center text-[24px] bg-transparent border-none cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-18 shrink-0 flex flex-col gap-2 px-2 pt-8 pb-3">
              <button
                onClick={() => setText((prev) => Array.from(prev).slice(0, -1).join(''))}
                aria-label="退格"
                className="h-12 rounded-xl bg-white text-[20px] text-[#1A1A1A] border-none cursor-pointer"
              >
                ⌫
              </button>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shopchat.emoji.send' },
                  { onTrigger: () => { doSend(); back(); } },
                )}
                className="flex-1 rounded-xl bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
              >
                {s.sendBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
