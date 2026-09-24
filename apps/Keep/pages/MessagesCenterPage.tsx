import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { TopBar, C } from '../components/ui';
import { Img } from '../res/images';
import { IcCheck, IcBell, IcGift, IcCrown, IcComment } from '../res/icons';

const TABS = ['私信', '评论', '互动', '加油', '粉丝'];

const SYS_ICON: Record<string, { icon: React.ReactNode; bg: string }> = {
  t_sys: { icon: <IcBell size={20} />, bg: '#7A5AF8' },
  t_stranger: { icon: <IcComment size={20} />, bg: '#3B3A44' },
  t_featured: { icon: <IcGift size={20} />, bg: '#24C789' },
  t_member: { icon: <IcCrown size={20} />, bg: '#26202E' },
  t_activity: { icon: <IcBell size={20} />, bg: '#24C789' },
  t_trade: { icon: <IcGift size={20} />, bg: '#5BC24C' },
};

/** 消息中心(私信/评论/互动/加油/粉丝)—— 节点 messages.center(证据 s091/s092) */
export default function MessagesCenterPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const messages = useKeepStore((st) => st.messages);
  const readAllMessages = useKeepStore((st) => st.readAllMessages);

  const tab = searchParams.get('tab') ?? '私信';
  const friendThreads = messages.threads.filter((t) => t.kind === '好友');
  const sysThreads = messages.threads.filter((t) => t.kind === '系统');
  const totalUnread = messages.threads.reduce((acc, t) => acc + t.unread, 0);

  const unreadBadge = (n: number) =>
    n > 0 ? (
      <span
        className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] text-white flex items-center justify-center"
        style={{ background: C.red }}
      >
        {n > 99 ? '99+' : n}
      </span>
    ) : null;

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      <TopBar
        title="消息"
        right={
          <button
            {...bindTap(
              { kind: 'action', id: 'messages.center.readall' },
              { onTrigger: () => readAllMessages() },
            )}
            className="p-1 bg-transparent border-none text-app-text"
            aria-label="全部已读"
          >
            <IcCheck size={20} />
          </button>
        }
      />
      {/* 五 tab */}
      <div className="flex px-2 pt-1 shrink-0 border-b border-app-border">
        {TABS.map((t) => {
          const sel = tab === t;
          return (
            <button
              key={t}
              {...bindTap(
                { kind: 'action', id: 'messages.center.tab.switch' },
                {
                  params: { tab: t },
                  onTrigger: () =>
                    setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
                },
              )}
              className="flex-1 bg-transparent border-none pb-2.5 pt-1 relative"
            >
              <span className="text-[15px] relative" style={{ color: sel ? '#1A1A1A' : '#9AA0A8', fontWeight: sel ? 700 : 400 }}>
                {t}
                {t === '私信' && totalUnread > 0 && (
                  <span
                    className="absolute -top-2 -right-7 px-1.5 py-0.5 rounded-full text-[9px] text-white"
                    style={{ background: C.red }}
                  >
                    99+
                  </span>
                )}
              </span>
              {sel && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded-full" style={{ background: C.dark }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === '私信' ? (
          <>
            {/* 好友会话 */}
            {friendThreads.map((t) => (
              <button
                key={t.id}
                {...bindTap('chat.detail.open', {
                  params: { threadId: t.id },
                  beforeTrigger: () => setCurrent('threadId', t.id),
                })}
                className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-left"
              >
                <span className="relative shrink-0">
                  <Img id={t.avatar} className="w-12 h-12 rounded-full object-cover" alt={t.name} />
                  {unreadBadge(t.unread)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-app-text truncate">{t.name}</div>
                  <div className="text-[13px] text-app-text-muted truncate mt-0.5">{t.preview}</div>
                </div>
                <span className="text-[11px] text-app-text-muted shrink-0 self-start mt-1">{t.time.slice(5, 16)}</span>
              </button>
            ))}
            {/* 系统账号会话 */}
            {sysThreads.map((t) => {
              const ic = SYS_ICON[t.id] ?? SYS_ICON.t_sys;
              return (
                <button
                  key={t.id}
                  {...bindTap('chat.detail.open.fromSystem', {
                    params: { threadId: t.id },
                    beforeTrigger: () => setCurrent('threadId', t.id),
                  })}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-left"
                >
                  <span className="relative shrink-0">
                    <span
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ background: ic.bg }}
                    >
                      {ic.icon}
                    </span>
                    {unreadBadge(t.unread)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-app-text truncate">{t.name}</div>
                    <div className="text-[13px] text-app-text-muted truncate mt-0.5">{t.preview}</div>
                  </div>
                  <span className="text-[11px] text-app-text-muted shrink-0 self-start mt-1">{t.time.slice(5, 16)}</span>
                </button>
              );
            })}
          </>
        ) : (
          /* 评论/互动/加油/粉丝空态(锁定Q5A) */
          <div className="flex flex-col items-center pt-24">
            <span className="w-16 h-16 rounded-xl flex items-center justify-center text-[26px]" style={{ background: '#F0F3F7' }}>
              💬
            </span>
            <div className="text-[13px] text-app-text-muted mt-3">{s.emptyNoContent}</div>
          </div>
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}
