import React, { useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { MascotCat, TopTabs } from '../components/ui';
import { toast } from '../components/toast';
import { IcBulb, IcWand, IcVoice, IcSend, IcLike, IcDislike, IcRefresh, IcCopy } from '../res/icons';

const ANALYSIS = ['复盘我昨日的消费', '本周消费分析', '6月账单总结'];
const FUN = ['测测我的消费MBTI', '分析我的消费性格', '今日手账'];

export default function AiChatPage() {
  const { bindTap, bindAction } = useKapiGestures();
  const messages = useKapiStore((s) => s.aiMessages);
  const sendAiMessage = useKapiStore((s) => s.sendAiMessage);
  const [text, setText] = useState('');
  const [suggest, setSuggest] = useState<'analysis' | 'fun' | null>(null);
  const prompts = suggest === 'analysis' ? ANALYSIS : suggest === 'fun' ? FUN : [];

  const send = (t: string) => {
    sendAiMessage(t);
    setText('');
    setSuggest(null);
  };

  return (
    <div className="flex flex-col h-full animate-[fade-in_.15s_ease]">
      {/* 顶栏:与首页共用切换器,绝对居中,切 tab 不跳动(F8) */}
      <div className="relative flex items-center justify-center h-11 shrink-0">
        <TopTabs active="ai" recordBind={bindTap('ai.home.open')} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-4" data-scroll-container="ai-chat" data-scroll-direction="vertical">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="self-end max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-md bg-[#E8ECF5] text-[15px] text-[#1A1D26]">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="self-start max-w-[88%] flex gap-2">
              <MascotCat size={28} />
              <div className="min-w-0 flex-1">
                <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-white text-[15px] text-[#1A1D26] break-words">{m.text}</div>
                {m.calendarCard && (
                  <div className="mt-2 bg-white rounded-xl p-2 flex gap-2 overflow-x-auto" data-scroll-container="ai-cal" data-scroll-direction="horizontal">
                    {['8', '9', '10', '11', '12', '13', '14'].map((d, i) => (
                      <div key={d} className={`shrink-0 w-12 rounded-lg p-1 text-center text-[11px] ${i === 4 ? 'bg-[#EAF0FE]' : ''}`}>
                        <div className="text-[#8A92A6]">{d}</div>
                        <div className="text-[#3D6CF0]">-{(294 - i * 30).toFixed(0)}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[#B3B9C6]">
                  <button {...bindAction('ai.reply.feedback.react', () => toast('已复制'))} className="bg-transparent border-none cursor-pointer"><IcCopy size={14} /></button>
                  <button {...bindAction('ai.reply.feedback.react', () => toast('已刷新'))} className="bg-transparent border-none cursor-pointer"><IcRefresh size={14} /></button>
                  <button {...bindAction('ai.reply.feedback.react', () => toast('已反馈'))} className="bg-transparent border-none cursor-pointer"><IcLike size={14} /></button>
                  <button {...bindAction('ai.reply.feedback.react', () => toast('已反馈'))} className="bg-transparent border-none cursor-pointer"><IcDislike size={14} /></button>
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {prompts.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-2 shrink-0" data-hide-on-keyboard>
          {prompts.map((p) => (
            <button
              key={p}
              {...bindAction('ai.suggest.submit.pick', () => send(p), { value: p })}
              className="px-3 py-1.5 rounded-full bg-white text-[13px] text-[#4B6EF5] border border-[#E3E6EE] cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="shrink-0 px-3 py-2 bg-[#EEF1F9]" data-keep-keyboard="true">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2">
          <input
            data-action="ai.message.submit.send"
            data-action-type="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="有什么想问我的吗"
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#1A1D26] placeholder:text-[#B3B9C6]"
          />
          <button {...bindAction('ai.suggest.toggle.analysis', () => setSuggest((s) => (s === 'analysis' ? null : 'analysis')))} className="bg-transparent border-none cursor-pointer"><IcBulb size={20} className="text-[#FFB23E]" /></button>
          <button {...bindAction('ai.suggest.toggle.fun', () => setSuggest((s) => (s === 'fun' ? null : 'fun')))} className="bg-transparent border-none cursor-pointer"><IcWand size={20} className="text-[#C58BFF]" /></button>
          <button {...bindAction('ai.voice.input.noop', () => toast('该功能暂未开放'))} className="bg-transparent border-none cursor-pointer"><IcVoice size={20} className="text-[#8A92A6]" /></button>
          <button
            {...bindAction('ai.message.submit.send', () => text.trim() && send(text))}
            className="w-8 h-8 rounded-full bg-[#4B6EF5] flex items-center justify-center border-none cursor-pointer"
          >
            <IcSend size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
