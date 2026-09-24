// 消息中心。节点 msg.center(spec 7 条交互 / 4 个 uiState)。
// 视觉证据:860(5 个圆形浅青入口 + 3 条会话行)、862(预约提醒助手二级页:发信人卡 + 文案 + 剧照)、
// frame:467997@25(系统通知会话摘要)。
// 二级页按 spec 建模成本页 uiState(不另立路由);顶部返回先收起二级页,
// 再从消息主页返回上一层。进页时把上次残留的二级页态清掉。
import React, { useEffect, useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { EmptyState, TopBar } from '../components/ui';
import type { BindProps } from '../components/ui';
import { IcComment, IcHeart, IcSend, IcSparkle, IcTogether } from '../res/icons';

/** 当前展开的二级页(入口 id 或会话 id;空 = 消息主页) */
const VIEW_KEY = 'msg.center.view';

/** 5 个入口的图标(证据 860:评论/关注/赞/私信/AI 对话) */
const ENTRY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  msg_reply: IcComment,
  msg_follow: IcTogether,
  msg_like: IcHeart,
  msg_dm: IcSend,
  msg_ai: IcSparkle,
};

export default function MsgCenterPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const messages = useTencentvideoStore((s) => s.messages);
  const contents = useTencentvideoStore((s) => s.contents);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const openMsgEntry = useTencentvideoStore((s) => s.openMsgEntry);
  const openMsgConversation = useTencentvideoStore((s) => s.openMsgConversation);

  const view = typeof ui[VIEW_KEY] === 'string' ? (ui[VIEW_KEY] as string) : '';
  const secondaryBackBind = bindTap({ kind: 'action', id: 'msg.view.back' }, {
    onTrigger: () => setUi(VIEW_KEY, ''),
  });

  useEffect(() => {
    setUi(VIEW_KEY, '');
  }, [setUi]);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  const unread = useMemo(
    () =>
      messages.entries.reduce((n, e) => n + e.unread, 0) +
      messages.conversations.reduce((n, c) => n + c.unread, 0),
    [messages],
  );

  const entry = messages.entries.find((e) => e.id === view);
  const conversation = messages.conversations.find((c) => c.id === view);

  /** 会话行 → 各自申报的 actionId(字面量,不可用变量拼) */
  const conversationBind = (convId: string): BindProps => {
    const open = () => {
      openMsgConversation(convId);
      setUi(VIEW_KEY, convId);
    };
    if (convId === 'conv_sys') {
      return bindTap({ kind: 'action', id: 'msg.session.system.open' }, { onTrigger: open });
    }
    if (convId === 'conv_vip') {
      return bindTap({ kind: 'action', id: 'msg.session.vip.open' }, { onTrigger: open });
    }
    return bindTap({ kind: 'action', id: 'msg.session.remind.open' }, { onTrigger: open });
  };

  /* ---------- 二级页:入口列表(861 空态) ---------- */

  if (entry) {
    const entryMessages = entry.messages ?? [];
    return (
      <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
        <TopBar title={entry.label} backBind={secondaryBackBind} />
        <div
          className="flex-1 overflow-y-auto"
          style={{ background: C.pageBg }}
          data-scroll-container="main"
          data-scroll-direction="vertical"
        >
          {entryMessages.length === 0 ? (
            <EmptyState text={messages.emptyText} />
          ) : (
            <div className="px-3 pb-4">
              {entryMessages.map((message) => {
                const card = (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold" style={{ color: C.text }}>{message.title}</span>
                      <span className="text-[11px]" style={{ color: C.textTertiary }}>{message.time}</span>
                    </div>
                    <div className="text-[13px] leading-[20px] mt-1" style={{ color: C.textSub }}>{message.text}</div>
                    {message.action && <div className="text-[12px] mt-2" style={{ color: C.primary }}>{message.action}</div>}
                  </>
                );
                return message.contentId ? (
                  <button
                    key={message.id}
                    {...bindTap('detail.series.open.fromMsg', { params: { contentId: message.contentId } })}
                    className="block w-full rounded-xl border-none p-3 mt-3 text-left"
                    style={{ background: C.chipGray }}
                  >
                    {card}
                  </button>
                ) : (
                  <div key={message.id} className="rounded-xl p-3 mt-3" style={{ background: C.chipGray }}>{card}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------- 二级页:会话消息卡(862 / frame:467997@25) ---------- */

  if (conversation) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
        <TopBar title={conversation.name} backBind={secondaryBackBind} />
        <div
          className="flex-1 overflow-y-auto px-3 pb-4"
          data-scroll-container="main"
          data-scroll-direction="vertical"
        >
          {conversation.messages.map((m) => {
            const content = m.contentId ? byId.get(m.contentId) : undefined;
            const card = (
              <>
                <div className="flex items-center gap-2 pb-2">
                  <TvImg
                    id={conversation.avatar}
                    alt={conversation.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="flex-1 text-[14px] font-semibold truncate" style={{ color: C.text }}>
                    {conversation.name}
                  </span>
                  <span className="text-[12px]" style={{ color: C.textTertiary }}>
                    {m.time}
                  </span>
                </div>
                <div className="text-[14px] leading-[20px]" style={{ color: C.text }}>
                  {m.text}
                </div>
                {content && (
                  <div className="mt-2 w-[62%] aspect-video rounded-lg overflow-hidden">
                    <TvImg
                      id={content.still ?? content.poster}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </>
            );
            // 预约提醒卡指向剧集详情;系统通知卡按 spec 锁定为暂未开放;其余(VIP 消息)是纯通知
            if (m.contentId) {
              return (
                <button
                  key={m.id}
                  {...bindTap('detail.series.open.fromMsg', { params: { contentId: m.contentId } })}
                  className="block w-full mt-3 px-3 py-3 rounded-xl border-none text-left"
                  style={{ background: C.pageBg }}
                >
                  {card}
                  <div className="pt-1 text-[13px]" style={{ color: C.primary }}>
                    {m.action}
                  </div>
                </button>
              );
            }
            if (conversation.id === 'conv_sys') {
              return (
                <button
                  key={m.id}
                  {...bindTap({ kind: 'action', id: 'msg.system.card.wontfix' }, {
                    onTrigger: () => toast(s.notOpen),
                  })}
                  className="block w-full mt-3 px-3 py-3 rounded-xl border-none text-left"
                  style={{ background: C.pageBg }}
                >
                  {card}
                </button>
              );
            }
            return (
              <div
                key={m.id}
                className="mt-3 px-3 py-3 rounded-xl"
                style={{ background: C.pageBg }}
              >
                {card}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- 消息主页(860) ---------- */

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar
        title={
          <span className="relative inline-block">
            消息
            {unread > 0 && (
              <span
                className="absolute -top-0.5 -right-2 w-1.5 h-1.5 rounded-full"
                style={{ background: C.redDot }}
              />
            )}
          </span>
        }
      />

      <div
        className="flex-1 overflow-y-auto pb-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 入口行 5 项:进对应二级列表(均为空态) */}
        {messages.entries.map((e) => {
          const Icon = ENTRY_ICONS[e.id] ?? IcComment;
          return (
            <button
              key={e.id}
              {...bindTap({ kind: 'action', id: 'msg.entry.open' }, {
                params: { entryId: e.id },
                onTrigger: () => {
                  openMsgEntry(e.id);
                  setUi(VIEW_KEY, e.id);
                },
              })}
              className="flex items-center gap-3 w-full h-[68px] px-4 bg-transparent border-none border-b"
              style={{ borderBottom: `1px solid ${C.chipGray}` }}
            >
              <span
                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: C.primaryBg, color: C.primary }}
              >
                <Icon size={20} />
              </span>
              <span className="flex-1 text-left text-[15px]" style={{ color: C.text }}>
                {e.label}
              </span>
              {e.unread > 0 && (
                <span
                  className="shrink-0 min-w-[16px] px-1 rounded-full text-[10px] leading-4 text-center text-white"
                  style={{ background: C.redDot }}
                >
                  {e.unread}
                </span>
              )}
            </button>
          );
        })}

        {/* 会话列表 3 条 */}
        {messages.conversations.map((conv) => (
          <button
            key={conv.id}
            {...conversationBind(conv.id)}
            className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none"
            style={{ borderBottom: `1px solid ${C.chipGray}` }}
          >
            <TvImg
              id={conv.avatar}
              alt={conv.name}
              className="shrink-0 w-11 h-11 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
                {conv.name}
              </div>
              <div className="text-[12px] truncate mt-0.5" style={{ color: C.textSub }}>
                {conv.lastText}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-[11px]" style={{ color: C.textTertiary }}>
                {conv.time}
              </span>
              {conv.unread > 0 && (
                <span className="w-2 h-2 rounded-full" style={{ background: C.redDot }} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
