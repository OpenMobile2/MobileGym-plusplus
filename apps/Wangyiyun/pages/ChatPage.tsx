import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, Cover, WY } from '../components/ui';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import type { ChatMessage } from '../types';

export default function ChatPage() {
  const { id = '' } = useParams();
  const { bindTap } = useWangyiyunGestures();
  const conv = useWangyiyunStore((s) => s.conversations.find((c) => c.id === id));
  const initial: ChatMessage[] = conv?.messages?.length
    ? conv.messages
    : conv ? [{ from: 'them', text: conv.summary }] : [];
  const [msgs, setMsgs] = React.useState<ChatMessage[]>(initial);
  const [text, setText] = React.useState('');
  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: 'me', text: text.trim() }]);
    setText('');
  };
  return (
    <Screen>
      <TopBar title={conv?.name || '会话'} />
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ background: WY.pageBg }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 max-w-[85%] ${m.from === 'me' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            {m.from === 'them' && <Cover seed={conv?.seed || 'cover1'} className="w-8 h-8 shrink-0" rounded={16} />}
            <div className={`px-3 py-2 rounded-2xl text-[14px] ${m.from === 'me' ? 'rounded-tr-sm' : 'rounded-tl-sm bg-white'}`}
              style={{ background: m.from === 'me' ? WY.primary : '#fff', color: m.from === 'me' ? '#fff' : WY.textPrimary }}>
              {m.imageSeed ? (
                <div>
                  <Cover seed={m.imageSeed} className="w-40 h-40 rounded-lg mb-1" />
                  {m.text !== '[图片]' && <div>{m.text}</div>}
                </div>
              ) : m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-t" style={{ borderColor: WY.divider }} data-keep-keyboard="true">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="发消息" className="flex-1 h-9 rounded-full px-3 text-[14px] border-none outline-none" style={{ background: WY.pageBg }} />
        <button {...bindTap({ kind: 'action', id: 'chat.message.send' }, { onTrigger: send })}
          className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>发送</button>
      </div>
    </Screen>
  );
}
