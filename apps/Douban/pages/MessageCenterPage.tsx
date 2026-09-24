// 消息中心(message.center,IMG_0210/0211/0464,frame:ac79b0@t0015/t0017):
// 提醒/私信 双 Tab(?tab=remind|chat);提醒=全部已读/书影音消息入口/关注类提醒行/推送引导条;
// 私信(IMG_0464)=「N条」计数 + 全部已读(灰)/发私信/设置(绿) + 会话列表:
// 官方号行(豆瓣通知喇叭头像、豆瓣绿logo带认证勾)固定置顶,个人私信在下;行右侧「N天前 ⋯」。
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, EmptyState, TopBar } from '../components/ui';
import { Sheet, SheetRow } from '../components/Sheet';
import { NOTICE_PEER_ID, OFFICIAL_PEER_ID, OfficialLogo } from './ChatSessionPage';
import type { DoubanUser } from '../types';

type MsgTab = 'remind' | 'chat';

/** 未读提醒/会话整行浅绿底(frame:ac79b0@t0012) */
const UNREAD_ROW_BG = '#EDF6EC';

/** 灰色默认人形剪影头像(IMG_0464 豆瓣通知行) */
function SilhouetteAvatar({ size = 46 }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-end justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size, background: '#E8EAEC' }}
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="#C4C9CF">
        <circle cx="12" cy="9" r="4.4" />
        <path d="M2.8 24c1-5 4.8-7.6 9.2-7.6s8.2 2.6 9.2 7.6z" />
      </svg>
    </span>
  );
}

/** 私信未读绿标(官方号 seed 的「1」)清除态 —— store 无 per-message read 字段,模块级易失兜底 */
let chatBadgeClearedFlag = false;

function relTime(ts: number, now: number): string {
  const min = Math.floor(Math.max(0, now - ts) / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}天前`;
  return `${Math.floor(d / 365)}年前`;
}

export default function MessageCenterPage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const users = useDoubanStore((s) => s.users);
  const messages = useDoubanStore((s) => s.messages);
  const notifications = useDoubanStore((s) => s.notifications);
  const followUserIds = useDoubanStore((s) => s.follows.users);
  const markNotificationsRead = useDoubanStore((s) => s.markNotificationsRead);

  const tab: MsgTab = searchParams.get('tab') === 'chat' ? 'chat' : 'remind';
  const pickOpen = searchParams.get('pick') === 'open';
  const [pushGuideHidden, setPushGuideHidden] = useState(false);
  const [badgeCleared, setBadgeCleared] = useState(chatBadgeClearedFlag);
  const now = TimeService.now();

  const userOf = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u]));
    return (uid: string) => m.get(uid);
  }, [users]);

  /** 会话列表:官方号 seed 行固定置顶(IMG_0464 豆瓣通知/豆瓣在个人私信之上)+ 按 peerId 聚合真实消息 */
  const conversations = useMemo(() => {
    const byPeer = new Map<string, { peerId: string; lastText: string; lastAt: number }>();
    for (const m of messages) {
      const cur = byPeer.get(m.peerId);
      if (!cur || m.createdAt >= cur.lastAt) {
        byPeer.set(m.peerId, { peerId: m.peerId, lastText: m.text, lastAt: m.createdAt });
      }
    }
    const officialSeeds = [
      // 豆瓣通知(IMG_0464/0466:预览为通知问候行「XX,你好:」,3天前)
      { peerId: NOTICE_PEER_ID, lastText: `${currentUser.name},你好:`, lastAt: now - 3 * 24 * 3600 * 1000 },
      // 豆瓣官方号(IMG_0464:预览「[播客推荐]」,4天前)
      { peerId: OFFICIAL_PEER_ID, lastText: '[播客推荐]', lastAt: now - 4 * 24 * 3600 * 1000 },
    ];
    const officials = officialSeeds.map((seed) => byPeer.get(seed.peerId) ?? seed);
    const personal = [...byPeer.values()]
      .filter((r) => r.peerId !== NOTICE_PEER_ID && r.peerId !== OFFICIAL_PEER_ID)
      .sort((a, b) => b.lastAt - a.lastAt);
    return [...officials, ...personal];
  }, [messages, now, currentUser.name]);

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );
  const chatUnread = badgeCleared ? 0 : 1;

  const switchTab = (t: MsgTab) =>
    setSearchParams(
      (p) => {
        p.set('tab', t);
        return p;
      },
      { replace: true },
    );

  const readAll = () => {
    markNotificationsRead();
    chatBadgeClearedFlag = true;
    setBadgeCleared(true);
    toast('已全部标为已读');
  };

  const followedUsers = useMemo(
    () => followUserIds.map(userOf).filter((u): u is DoubanUser => Boolean(u)),
    [followUserIds, userOf],
  );

  const tabBtn = (t: MsgTab, label: string, badge: number) => {
    const active = tab === t;
    return (
      <button
        {...bindTap({ kind: 'action', id: 'message.tab.select.target' }, {
          params: { target: t },
          onTrigger: () => switchTab(t),
        })}
        className="relative px-6 py-2 bg-transparent border-none cursor-pointer text-base"
        style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
      >
        {label}
        {badge > 0 && (
          <span
            className="absolute top-0.5 right-1 min-w-4 h-4 px-0.5 rounded-full text-[10px] text-white flex items-center justify-center"
            style={{ background: '#F0453E' }}
          >
            {badge}
          </span>
        )}
        {active && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full" style={{ background: C.text }} />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.surface }} data-status-bar-foreground="dark">
      <TopBar
        borderless
        title={
          <span className="inline-flex items-center gap-10">
            {tabBtn('remind', '提醒', unreadNotifCount)}
            {tabBtn('chat', '私信', chatUnread)}
          </span>
        }
      />
      <div className="h-px shrink-0" style={{ background: C.border }} />

      <div className="flex-1 overflow-y-auto flex flex-col" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'remind' ? (
          <>
            {/* 工具行 */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px]" style={{ color: C.sub }}>全部提醒</span>
              <button
                {...bindTap({ kind: 'action', id: 'message.readAll.clear' }, { onTrigger: readAll })}
                className="px-3 h-8 rounded-lg text-sm border-none cursor-pointer"
                style={
                  unreadNotifCount > 0
                    ? { background: C.greenSoft, color: C.green }
                    : { background: '#F2F3F5', color: '#B9BEC6' }
                }
              >
                全部已读
              </button>
            </div>
            {/* 书影音消息入口 */}
            <button
              {...bindTap({ kind: 'action', id: 'message.bmNotice.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-[calc(100%-32px)] mx-4 flex items-center justify-between px-4 h-13 rounded-xl border-none cursor-pointer"
              style={{ background: '#F7F7F7' }}
            >
              <span className="text-[15px] font-semibold" style={{ color: C.text }}>书影音消息</span>
              <span className="text-lg" style={{ color: '#B9BEC6' }}>›</span>
            </button>
            {/* 推送开启引导条 */}
            {!pushGuideHidden && (
              <div
                className="mx-4 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: C.greenSoft }}
              >
                <button
                  onClick={() => setPushGuideHidden(true)}
                  className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer text-base"
                  style={{ color: C.green }}
                  aria-label="关闭引导"
                >
                  ×
                </button>
                <span className="flex-1 text-[13px] leading-snug" style={{ color: C.green }}>
                  打开推送,及时收到回复提醒
                </span>
                <button
                  {...bindTap({ kind: 'action', id: 'message.pushGuide.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="px-4 h-8 rounded-lg text-sm text-white border-none cursor-pointer shrink-0"
                  style={{ background: C.green }}
                >
                  去开启
                </button>
              </div>
            )}
            {/* 提醒列表:关注类提醒=纯文字两行(无头像,「N小时前更新」);未读=整行浅绿底 */}
            {notifications.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center">
                <EmptyState text="暂无提醒" icon="cat" />
              </div>
            ) : (
              <div className="mt-2">
                {notifications.map((n) => {
                  const u = n.userId ? userOf(n.userId) : undefined;
                  const rowBg = n.read ? 'transparent' : UNREAD_ROW_BG;
                  if (n.kind === 'follow') {
                    // 关注提醒行(frame:ac79b0@t0012):「{name}(粗) 关注了你」+「8小时前更新」,无头像;点击→他人主页
                    const boldName = u && n.text.startsWith(u.name) ? u.name : null;
                    return (
                      <div
                        key={n.id}
                        {...(n.userId ? bindTap('message.notif.user-open', { params: { userId: n.userId } }) : {})}
                        className="px-4 py-3 cursor-pointer"
                        style={{ background: rowBg }}
                      >
                        <div className="text-sm leading-snug" style={{ color: C.text }}>
                          {boldName ? (
                            <>
                              <span className="font-semibold">{boldName}</span>
                              {n.text.slice(boldName.length)}
                            </>
                          ) : (
                            n.text
                          )}
                        </div>
                        <div className="mt-1 text-[12px]" style={{ color: '#B9BEC6' }}>
                          {relTime(n.createdAt, now)}更新
                        </div>
                      </div>
                    );
                  }
                  // 回复/赞类:点击→内容详情(回复默认落回复tab,即那条帖子的回复楼);system 无跳转
                  const goProps = (n.targetId && n.targetType === 'broadcast') ? bindTap('message.notif.post-open', { params: { id: n.targetId } }) : {};
                  return (
                    <div
                      key={n.id}
                      {...goProps}
                      className={`flex items-center gap-3 px-4 py-3 ${n.targetId ? 'cursor-pointer' : ''}`}
                      style={{ background: rowBg }}
                    >
                      {u ? <Avatar src={u.avatar} size={40} /> : <SilhouetteAvatar size={40} />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm leading-snug" style={{ color: C.text }}>{n.text}</div>
                        <div className="mt-0.5 text-[11px]" style={{ color: '#B9BEC6' }}>{relTime(n.createdAt, now)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* 私信工具行(IMG_0464/0210):N条(灰) + 全部已读(有未读=浅绿底绿字)/发私信(绿)/设置(绿) */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[15px]" style={{ color: C.sub }}>{conversations.length}条</span>
              <div className="flex items-center gap-2">
                <button
                  {...bindTap({ kind: 'action', id: 'message.readAll.clear' }, { onTrigger: readAll })}
                  className="px-3 h-8 rounded-lg text-sm border-none cursor-pointer"
                  style={
                    chatUnread > 0
                      ? { background: C.greenSoft, color: C.green }
                      : { background: '#F2F3F5', color: '#B9BEC6' }
                  }
                >
                  全部已读
                </button>
                <button
                  onClick={() =>
                    setSearchParams((p) => {
                      p.set('pick', 'open');
                      return p;
                    })
                  }
                  className="px-3 h-8 rounded-lg text-sm border-none cursor-pointer"
                  style={{ background: C.greenSoft, color: C.green }}
                >
                  发私信
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'message.settings.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="px-3 h-8 rounded-lg text-sm border-none cursor-pointer"
                  style={{ background: C.greenSoft, color: C.green }}
                >
                  设置
                </button>
              </div>
            </div>
            {/* 会话列表(IMG_0464/0210):头像(未读=右上红色数字气泡)+ 加粗名字 + 单行预览;
                右侧「N天前 ⋯」;分隔线从头像右侧文字区起始;豆瓣通知=灰色人形剪影头像 */}
            {conversations.map((cv) => {
              const isNotice = cv.peerId === NOTICE_PEER_ID;
              const isOfficial = cv.peerId === OFFICIAL_PEER_ID;
              const peer = userOf(cv.peerId);
              const name = isNotice ? '豆瓣通知' : isOfficial ? '豆瓣' : peer?.name ?? '豆友';
              /** per-row 未读角标:官方号 seed 未读(store 侧 chatUnread)挂在「豆瓣」行(IMG_0210) */
              const rowUnread = isOfficial ? chatUnread : 0;
              return (
                <div key={cv.peerId}>
                  <div
                    {...bindTap('message.chat-open', { params: { userId: cv.peerId } })}
                    className="flex items-start gap-3 px-4 py-3.5 cursor-pointer"
                  >
                    <span className="relative shrink-0">
                      {isNotice ? (
                        <SilhouetteAvatar size={46} />
                      ) : isOfficial ? (
                        <OfficialLogo size={46} />
                      ) : (
                        <Avatar src={peer?.avatar ?? ''} size={46} />
                      )}
                      {rowUnread > 0 && (
                        <span
                          className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full text-[10px] text-white flex items-center justify-center"
                          style={{ background: '#F0453E', border: '1.5px solid #fff' }}
                        >
                          {rowUnread}
                        </span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[16px] font-semibold truncate" style={{ color: C.text }}>{name}</div>
                      <div className="mt-1 text-[14px] truncate" style={{ color: C.sub }}>{cv.lastText}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pt-1">
                      <span className="text-[12px]" style={{ color: '#B9BEC6' }}>{relTime(cv.lastAt, now)}</span>
                      {/* 溢出菜单为占位视觉(未实现入口不打标) */}
                      <span className="text-base leading-none tracking-wider" style={{ color: '#B9BEC6' }} aria-hidden>
                        ⋯
                      </span>
                    </div>
                  </div>
                  <div className="h-px" style={{ background: '#F5F5F5', marginLeft: 74 }} />
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 发私信:选择联系人弹层(选人后直入会话,message.compose-open) */}
      {pickOpen && (
        <Sheet title="发私信给…">
          <div className="overflow-y-auto min-h-0" data-scroll-container="pick-sheet" data-scroll-direction="vertical">
            {followedUsers.map((u) => (
              <SheetRow
                key={u.id}
                label={u.name}
                bind={bindTap('message.compose-open', { params: { userId: u.id } })}
                icon={<Avatar src={u.avatar} size={30} />}
              />
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
