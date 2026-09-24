import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C, driverAvatar, imgFallback, MissingData } from '../components/ui';

/** 司机对话详情 —— 证据 m01/m02:温馨提示卡+通知横幅+行程结束置灰态 */

const PHRASES = ['我马上到', '好的,谢谢师傅', '请稍等两分钟', '我在路口等您'];

export default function ChatDetailPage() {
  const { bindTap } = useDidiGestures();
  const sendChat = useDidiStore((s) => s.sendChat);
  const chats = useDidiStore((s) => s.driverChats);
  const currentChatId = useDidiStore((s) => s.currentChatId);
  const tripPhase = useDidiStore((s) => s.trip.phase);
  const toast = useDidiStore((s) => s.toast);
  const [text, setText] = React.useState('');
  const [notifyBar, setNotifyBar] = React.useState(true);

  const chat = chats.find((c) => c.id === currentChatId);
  if (!chat) {
    return (
      <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
        <TopBar title="对话详情" />
        <MissingData message="该对话已结束或被删除，请返回对话列表重新选择。" />
      </div>
    );
  }
  // 行程进行中才可发消息;从历史会话进入=已结束态(m02)
  const active = tripPhase === 'driver' || tripPhase === 'ongoing';

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={chat.driver} />

      {/* 消息流 */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 温馨提示卡(m02) */}
        <div className="bg-app-surface rounded-xl px-3.5 py-3 mb-3 text-[13px] leading-relaxed text-app-text">
          <div className="font-semibold mb-0.5">温馨提示</div>
          您好,欢迎使用滴滴出行,我正马不停蹄的赶来接您,如需沟通可发送消息,或在行程中主动与司机沟通。
        </div>
        {chat.msgs.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 mb-3 ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            {m.from === 'driver' && (
              <img src={driverAvatar(chat.driver)} {...imgFallback(chat.driver)} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
            )}
            <div
              className="max-w-[70%] rounded-xl px-3 py-2 text-[14px] leading-relaxed"
              style={
                m.from === 'me'
                  ? { background: C.orange, color: '#fff', borderBottomRightRadius: 4 }
                  : { background: '#fff', color: C.dark, borderBottomLeftRadius: 4 }
              }
            >
              {m.text}
              <div
                className="text-[10px] mt-1 text-right"
                style={{ color: m.from === 'me' ? 'rgba(255,255,255,.75)' : '#B0B4BD' }}
              >
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 开启消息通知横幅(m01) */}
      {notifyBar && (
        <div className="flex items-center px-3 py-2 shrink-0" style={{ background: '#FFF4EA' }}>
          <span className="flex-1 text-[12px]" style={{ color: '#B26A2F' }}>
            开启消息通知,及时获取回复
          </span>
          <button
            {...bindTap({ kind: 'action', id: 'chat.detail.notify' }, { onTrigger: () => { toast('消息通知已开启'); setNotifyBar(false); } })}
            className="text-[12px] px-2.5 py-1 rounded-full border-none text-white shrink-0"
            style={{ background: C.orange }}
          >
            去开启
          </button>
          <button onClick={() => setNotifyBar(false)} className="ml-1.5 text-app-text-muted bg-transparent border-none text-[13px]">✕</button>
        </div>
      )}

      {active ? (
        <>
          {/* 快捷短语(行程中) */}
          <div className="flex gap-2 px-3 pb-2 pt-2 overflow-x-auto shrink-0 bg-app-surface">
            {PHRASES.map((p) => (
              <button
                key={p}
                {...bindTap({ kind: 'action', id: 'chat.detail.phrase' }, { onTrigger: () => sendChat(chat.id, p) })}
                className="shrink-0 text-[13px] text-app-text rounded-full px-3 py-1.5 border border-app-border"
                style={{ background: '#F5F6FA' }}
              >
                {p}
              </button>
            ))}
          </div>
          {/* 底部输入条(flex,非 fixed) */}
          <div className="flex items-center gap-2 px-3 py-2 bg-app-surface shrink-0" data-keep-keyboard="true">
            <input
              data-action="chat.detail.input"
              data-action-type="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="发消息…"
              className="flex-1 h-9 rounded-full px-4 text-[14px] text-app-text outline-none border border-app-border"
              style={{ background: '#F5F6FA' }}
              data-keep-keyboard="true"
            />
            <button
              {...bindTap({ kind: 'action', id: 'chat.detail.send' }, {
                onTrigger: () => {
                  sendChat(chat.id, text.trim());
                  setText('');
                },
              })}
              disabled={!text.trim()}
              className="shrink-0 h-9 px-4 rounded-full text-white text-[14px] border-none"
              style={{ background: text.trim() ? C.orange : '#C9CCD4' }}
              data-keep-keyboard="true"
            >
              发送
            </button>
          </div>
        </>
      ) : (
        /* 行程已结束态(m02):输入区置灰不可用 */
        <div className="px-3 py-3.5 text-center text-[13px] shrink-0 bg-app-surface text-app-text-muted">
          行程已结束,不能继续发消息
        </div>
      )}
    </div>
  );
}
