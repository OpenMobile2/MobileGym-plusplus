import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { TopBar, C } from '../components/ui';
import { Img } from '../res/images';
import { IcClose, IcArrowRight, IcSend } from '../res/icons';

/** 系统账号静态详情文案(照 s092 造 3~5 条,锁定Q20A 只读) */
const SYS_EXTRA: Record<string, string[]> = {
  t_sys: ['恭喜达成「激励连动 1 天」,继续保持运动习惯吧。', '你的周报已生成:本周运动 0 分钟,点击查看详情。'],
  t_stranger: ['[58] Keep奖牌种草机:您于 7 月 08 日完成了运动,特为你推荐应季奖牌。', '对方请求关注你,同意后可互发消息。'],
  t_featured: ['HelloKitty 返场赛开跑,快来领取参赛资格。', '端午野练大作战报名开启,完赛即得限定徽章。'],
  t_member: ['连续包月特惠 ¥4/月,数量有限先到先得。', '会员专属:个性定制日程,快速达成目标。'],
  t_activity: ['你报名的凯蒂猫缤纷夏日线上跑已开赛,快去完成首跑吧。', '城市 K 马超跑赛,全民跑量新玩法,一起逐级解锁超大奖池。'],
  t_trade: ['你的订单已发货:Keep智能跳绳SR3,预计 3 日内送达。', '晒单赢运动币:上传使用体验最高得 200 币。'],
};

/** 私聊会话(可发消息,对方不回;系统账号=静态详情变体)—— 节点 chat.detail(证据 s093) */
export default function ChatDetailPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const current = useKeepStore((st) => st.current);
  const messages = useKeepStore((st) => st.messages);
  const user = useKeepStore((st) => st.user);
  const sendChat = useKeepStore((st) => st.sendChat);

  const threadId = current.threadId ?? messages.threads[0]?.id ?? '';
  const thread = messages.threads.find((t) => t.id === threadId) ?? messages.threads[0];
  const isSystem = thread?.kind === '系统';
  const chat = messages.chat[thread?.id ?? ''] ?? [];
  const fraudClosed = searchParams.get('fraud') === '0';

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat.length]);

  const doSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendChat(thread.id, text);
    setDraft('');
  };

  const sysCards = [thread?.preview ?? '', ...(SYS_EXTRA[thread?.id ?? ''] ?? [])].filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title={thread?.name ?? '会话'}
        right={
          <button
            {...bindTap({ kind: 'action', id: 'chat.detail.more.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-transparent border-none text-app-text text-[18px] px-1"
          >
            ···
          </button>
        }
      />

      {/* 防诈黄条(可关,searchParams) */}
      {!isSystem && !fraudClosed && (
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ background: '#FBF6E3' }}>
          <button
            {...bindTap(
              { kind: 'action', id: 'chat.detail.fraudBanner.close' },
              { onTrigger: () => setSearchParams((p) => { p.set('fraud', '0'); return p; }, { replace: true }) },
            )}
            className="p-0.5 bg-transparent border-none text-app-text-muted shrink-0"
            aria-label="关闭提示"
          >
            <IcClose size={14} />
          </button>
          <span className="flex-1 text-[12px] leading-snug" style={{ color: '#8A6D1F' }}>
            为避免财产和其他损失,请提防交友、交易和加群等风险信息!
          </span>
          <IcArrowRight size={14} className="text-app-text-muted shrink-0" />
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        {isSystem ? (
          /* 系统账号静态详情(只读) */
          <div className="flex flex-col gap-3">
            {sysCards.map((text, i) => (
              <div key={i} className="rounded-2xl bg-app-surface px-4 py-3.5">
                <div className="text-[12px] text-app-text-muted">{thread.name}</div>
                <div className="text-[14px] text-app-text mt-1.5 leading-relaxed">{text}</div>
                <button
                  {...bindTap({ kind: 'action', id: 'chat.detail.syscard.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
                  className="flex items-center gap-0.5 mt-2 bg-transparent border-none p-0 text-[13px]"
                  style={{ color: C.greenDeep }}
                >
                  查看详情 <IcArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="text-center text-[11px] text-app-text-muted mb-3">{thread?.time.slice(11, 16)}</div>
            <div className="flex flex-col gap-3">
              {chat.map((m) =>
                m.from === 'peer' ? (
                  <div key={m.id} className="flex items-start gap-2.5">
                    <button
                      {...bindTap({ kind: 'action', id: 'chat.detail.avatar.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
                      className="bg-transparent border-none p-0 shrink-0"
                      aria-label={thread.name}
                    >
                      <Img id={thread.avatar} className="w-9 h-9 rounded-full object-cover" alt={thread.name} />
                    </button>
                    <div className="max-w-[72%] px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-app-surface text-[14px] text-app-text leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex items-start gap-2.5 justify-end">
                    <div
                      className="max-w-[72%] px-3.5 py-2.5 rounded-2xl rounded-tr-md text-[14px] leading-relaxed"
                      style={{ background: '#C9F2E0', color: '#1A1A1A' }}
                    >
                      {m.content}
                    </div>
                    <Img id={user.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="我" />
                  </div>
                ),
              )}
            </div>
          </>
        )}
        <div className="h-4" />
      </div>

      {/* 底部输入(系统账号只读隐藏) */}
      {!isSystem && (
        <div className="flex items-center gap-2 px-3 py-2.5 shrink-0 bg-app-surface border-t border-app-border" data-keep-keyboard="true">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="请输入消息内容"
            className="flex-1 h-10 px-4 rounded-full bg-app-bg border-none outline-none text-[14px] text-app-text"
          />
          <button
            {...bindTap(
              { kind: 'action', id: 'chat.detail.message.send' },
              { params: { value: draft }, onTrigger: doSend },
            )}
            className="w-10 h-10 rounded-full border-none flex items-center justify-center text-white shrink-0"
            style={{ background: draft.trim() ? C.green : '#C6C9D0' }}
            aria-label="发送"
          >
            <IcSend size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
