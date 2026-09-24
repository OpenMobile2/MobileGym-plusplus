/** 美柚姐姐 AI 聊天页(qa:Q9=A 打字机)。spec: message.aiChat */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, MY, NOT_OPEN, useToast, usePanel, Img } from '../components/ui';
import { IcMenu2, IcMic, IcSend } from '../res/icons';

export default function AiChatPage() {
  const { bindTap, bindBack, back } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const { value: drawer, open: openDrawer } = usePanel('drawer');

  const sessions = useMeiyouStore((s) => s.aiSessions);
  const curId = useMeiyouStore((s) => s.aiCurrentSession);
  const suggested = useMeiyouStore((s) => s.aiSuggested);
  const aiAsk = useMeiyouStore((s) => s.aiAsk);
  const aiNewSession = useMeiyouStore((s) => s.aiNewSession);
  const aiSwitchSession = useMeiyouStore((s) => s.aiSwitchSession);
  const markRead = useMeiyouStore((s) => s.markRead);
  React.useEffect(() => { markRead('aiChat'); }, [markRead]);

  const session = sessions.find((s) => s.id === curId) ?? sessions[0];
  const messages = session?.messages ?? [];
  const [input, setInput] = React.useState('');
  const [typed, setTyped] = React.useState<Record<string, number>>({});
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // 打字机:对最后一条 ai 消息逐字显示
  const lastAi = [...messages].reverse().find((m) => m.role === 'ai');
  React.useEffect(() => {
    if (!lastAi) return;
    if (typed[lastAi.id] !== undefined && typed[lastAi.id] >= lastAi.text.length) return;
    const timer = setInterval(() => {
      setTyped((prev) => {
        const cur = prev[lastAi.id] ?? 0;
        if (cur >= lastAi.text.length) { clearInterval(timer); return prev; }
        return { ...prev, [lastAi.id]: Math.min(lastAi.text.length, cur + 3) };
      });
    }, 40);
    return () => clearInterval(timer);
  }, [lastAi?.id]);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, typed]);

  const isTyping = lastAi ? (typed[lastAi.id] ?? 0) < lastAi.text.length : false;
  const ask = (q: string) => { if (q.trim()) { aiAsk(q); setInput(''); } };

  return (
    <div className="flex flex-col h-full bg-[#F7F5FA] relative">
      <TopBar
        title="美柚姐姐"
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'aichat.drawer.open' }, { onTrigger: () => openDrawer('open') })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="会话"
          >
            <IcMenu2 size={20} className="text-[#1A1A1A]" />
          </button>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3" data-scroll-container="aichat-body" data-scroll-direction="vertical">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center">
            <Img src="/@app-assets/Meiyou/gen/ai_sister.png" className="w-24 h-24 rounded-full object-cover mt-4" />
            <div className="mt-3 bg-white rounded-2xl px-4 py-3 text-[14px] text-[#1A1A1A] max-w-[85%]">
              我是美柚姐姐,有任何问题,随时都可以和我说 🌸
            </div>
            <div className="mt-4 w-full flex flex-col gap-2">
              {suggested.map((q) => (
                <button
                  key={q}
                  {...bindTap({ kind: 'action', id: 'aichat.suggest.select.target' }, { params: { target: q }, onTrigger: () => ask(q) })}
                  className="bg-white rounded-full px-4 h-10 text-[13px] text-left border cursor-pointer"
                  style={{ borderColor: '#F0D5E4', color: MY.primary }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="self-end max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] text-white" style={{ background: MY.primary }}>
                    {m.text}
                  </div>
                );
              }
              const shown = m.id === lastAi?.id ? m.text.slice(0, typed[m.id] ?? 0) : m.text;
              return (
                <div key={m.id} className="self-start max-w-[88%]">
                  {m.refBadges && (
                    <div className="flex flex-col gap-1 mb-1">
                      {['本次回答结合你的健康档案', '参考资料5篇'].map((b) => (
                        <button
                          key={b}
                          {...bindTap({ kind: 'action', id: 'aichat.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                          className="self-start text-[11px] text-[#999] bg-white rounded-full px-2.5 py-1 border-none cursor-pointer"
                        >
                          {b} ›
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="bg-white rounded-2xl px-3.5 py-2.5 text-[14px] text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                    {shown}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 输入条 */}
      <div data-keep-keyboard="true" className="flex items-center gap-2 px-3 py-2 bg-white border-t border-[#EEE] shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'aichat.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="语音"
        >
          <IcMic size={20} className="text-[#999]" />
        </button>
        <input
          {...bindTap({ kind: 'action' as const, id: 'aichat.text.input' }, { onTrigger: () => {} })}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="有问题尽管问我…"
          className="flex-1 h-9 rounded-full bg-[#F2F2F4] px-4 border-none outline-none text-[14px]"
        />
        {isTyping ? (
          <button
            {...bindTap({ kind: 'action', id: 'aichat.gen.stop' }, { onTrigger: () => lastAi && setTyped((p) => ({ ...p, [lastAi.id]: lastAi.text.length })) })}
            className="px-3 h-9 rounded-full text-[13px] text-white border-none cursor-pointer"
            style={{ background: '#999' }}
          >
            停止
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'aichat.send.submit' }, { onTrigger: () => ask(input) })}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: MY.primary }}
            aria-label="发送"
          >
            <IcSend size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* 会话抽屉 */}
      {drawer === 'open' && (
        <div className="absolute inset-0 z-40 flex">
          <div className="flex-1" {...bindBack()} />
          <div className="w-64 bg-white h-full flex flex-col p-4">
            <button
              {...bindTap({ kind: 'action', id: 'aichat.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="text-left text-[14px] text-[#1A1A1A] py-2.5 border-b border-[#F2F2F4] bg-transparent border-x-0 border-t-0 cursor-pointer"
            >
              健康档案 / 家人健康管理
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'aichat.session.new' }, { onTrigger: () => { aiNewSession(); back(); } })}
              className="mt-3 h-9 rounded-full text-white text-[13px] border-none cursor-pointer"
              style={{ background: MY.primary }}
            >
              发起新对话
            </button>
            <div className="mt-4 text-[12px] text-[#999]">历史会话</div>
            <div className="flex-1 overflow-y-auto mt-1">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  {...bindTap({ kind: 'action', id: 'aichat.session.select.target' }, { params: { target: s.id }, onTrigger: () => { aiSwitchSession(s.id); back(); } })}
                  className="w-full text-left text-[13px] text-[#666] py-2 truncate bg-transparent border-none cursor-pointer"
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}
