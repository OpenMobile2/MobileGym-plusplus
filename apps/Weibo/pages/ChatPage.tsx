import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, TopBar } from '../components/ui';
import { IcSpeaker, IcEmoji, IcStar, IcPlus } from '../res/icons';
import * as TimeService from '@/os/TimeService';

function fmtClock(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatPage() {
  const s = useStrings();
  const { id = '' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  const chats = useWeiboStore((st) => st.chats);
  const users = useWeiboStore((st) => st.users);
  const me = useWeiboStore((st) => st.me);
  const sendChatMessage = useWeiboStore((st) => st.sendChatMessage);
  const openChatWith = useWeiboStore((st) => st.openChatWith);
  const markChatRead = useWeiboStore((st) => st.markChatRead);

  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 从他人主页私信进来时若会话不存在则建会话
  useEffect(() => { openChatWith(id); markChatRead(id); }, [id, openChatWith, markChatRead]);

  const chat = chats.find((c) => c.id === id);
  const peer = users.find((u) => u.id === id);
  const stranger = chat?.stranger ?? (peer ? !peer.followedByMe && !peer.followsMe : false);

  useEffect(() => { bottomRef.current?.scrollIntoView(); }, [chat?.messages.length]);

  const send = () => {
    if (!draft.trim()) return;
    sendChatMessage(id, draft.trim());
    setDraft('');
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7]">
      <TopBar
        backBinding={bindBack()}
        title={chat?.name ?? peer?.name ?? '会话'}
        right={<span className="text-[13px] text-[#5B5B5B]">设置</span>}
      />

      <div className="flex-1 overflow-y-auto px-3 py-2" data-scroll-container="chat-messages" data-scroll-direction="vertical">
        {/* 陌生人留言限制态 */}
        {stranger && (
          <>
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mb-2">
              <span className="text-[18px]">🛡️</span>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-[#1A1A1A]">谨防网络诈骗</div>
                <div className="text-[11px] text-[#9A9A9A]">陌生人消息,转账汇款不轻信</div>
              </div>
              <span className="text-[11px] text-[#5077BE]">本月留言额度:89</span>
            </div>
            <div className="text-center text-[11px] text-[#9A9A9A] leading-relaxed px-4 mb-2">
              在对方关注或主动回复你之前,你只能发送1条文字留言消息。
            </div>
          </>
        )}

        {(chat?.messages ?? []).map((m, i, arr) => {
          const showTime = i === 0 || m.timestamp - arr[i - 1].timestamp > 600_000;
          return (
            <React.Fragment key={m.id}>
              {showTime && <div className="text-center text-[11px] text-[#BBBBBB] my-2">{fmtClock(m.timestamp)}</div>}
              <div className={`flex gap-2 mb-2 ${m.fromMe ? 'flex-row-reverse' : ''}`}>
                <Img
                  src={m.fromMe ? me.avatar : chat?.avatar}
                  label={m.fromMe ? '我' : chat?.name?.[0] ?? '友'}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div
                  {...(!m.fromMe && chat?.verified === 'org'
                    ? bindTap({ kind: 'action', id: 'chat.card.stub' }, { onTrigger: () => toast(s.notOpen) })
                    : {})}
                  className={`max-w-[70%] rounded-xl px-3 py-2 text-[14px] leading-relaxed ${m.fromMe ? 'bg-[#4B87E8] text-white' : 'bg-white text-[#1A1A1A]'} ${!m.fromMe && chat?.verified === 'org' ? 'cursor-pointer' : ''}`}
                >
                  {m.text}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {!chat?.messages.length && !stranger && (
          <div className="text-center text-[12px] text-[#BBBBBB] py-8">{s.emptyChat}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入行 */}
      <div className="bg-white border-t border-[#F2F2F2] shrink-0" data-keep-keyboard="true">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            {...bindTap({ kind: 'action', id: 'chat.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-transparent border-none cursor-pointer text-[#7F7F7F] p-0"
          >
            <IcSpeaker size={20} />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            data-action="chat.text.input"
            data-action-type="input"
            className="flex-1 h-9 bg-[#F5F5F5] rounded-full px-3 text-[14px] border-none outline-none"
          />
          <button
            {...bindTap({ kind: 'action', id: 'chat.emoji.open' }, { onTrigger: () => setEmojiOpen((v) => !v) })}
            className="bg-transparent border-none cursor-pointer text-[#7F7F7F] p-0"
          >
            <IcEmoji size={20} />
          </button>
          {draft.trim() ? (
            <button
              {...bindTap({ kind: 'action', id: 'chat.message.send' }, { onTrigger: send })}
              className="h-8 px-3.5 rounded-full bg-[#FF8200] text-white text-[13px] border-none cursor-pointer shrink-0"
            >
              {s.send}
            </button>
          ) : (
            <>
              <button
                {...bindTap({ kind: 'action', id: 'chat.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
                className="bg-transparent border-none cursor-pointer text-[#7F7F7F] p-0 relative"
              >
                <IcStar size={20} />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF3852]" />
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'chat.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
                className="bg-transparent border-none cursor-pointer text-[#7F7F7F] p-0"
              >
                <IcPlus size={20} />
              </button>
            </>
          )}
        </div>
        {emojiOpen && (
          <div className="grid grid-cols-8 gap-2 px-3 pb-2">
            {['😀', '😂', '🥹', '😍', '😭', '👍', '❤️', '🎉'].map((e) => (
              <button key={e} onClick={() => setDraft((d) => d + e)} className="text-[22px] bg-transparent border-none cursor-pointer">
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
      {toastNode}
    </div>
  );
}
