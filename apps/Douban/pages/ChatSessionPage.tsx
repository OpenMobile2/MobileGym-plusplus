// 私信会话(chat.session,IMG_0465/0466,qa:Q8=A 私信可真发):
// 顶栏 ‹ + 对方头像 + 名字居中 + ⋯;居中灰色日期标签;
// 对方浅灰气泡居左带头像 / 己方绿色气泡居右带我的头像;
// 底部输入条 = 圆角「发送消息」输入框(框内右侧 ⤢ 展开角标)+ 😊 + 🖼(输入后追加发送钮);
// 官方号变体(IMG_0466):豆瓣通知的消息渲染为大号浅灰卡片(多段落 + 绿色链接行 + ——豆瓣落款)。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, TopBar } from '../components/ui';
import type { DoubanMessage } from '../types';
import { pickImagesFromAlbum } from '../capabilities';

/** 官方号会话(消息中心 seed 行,无真实 user 记录) */
export const OFFICIAL_PEER_ID = 'douban_official';
const OFFICIAL_NAME = '豆瓣';
/** 官方通知号会话(小组审核类系统通知,IMG_0466) */
export const NOTICE_PEER_ID = 'douban_notice';
const NOTICE_NAME = '豆瓣通知';

/** 己方气泡绿(IMG_0465:比品牌绿浅、深色文字) */
const MY_BUBBLE_GREEN = '#6FD98A';
/** 对方气泡/官方卡片浅灰 */
const PEER_BUBBLE_GRAY = '#F5F6F7';

/** 豆瓣通知头像:绿色圆底 + 白色喇叭(IMG_0466 顶栏/气泡侧) */
export function NoticeAvatar({ size = 34 }: { size?: number }) {
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size, background: C.green }}
    >
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="#fff">
        <path d="M4 9.5v5a1 1 0 001 1h2.2l6.8 3.8V4.7L7.2 8.5H5a1 1 0 00-1 1z" />
        <path
          d="M17.3 8.6a4.8 4.8 0 010 6.8"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** 豆瓣官方号头像:绿色圆角方「豆」logo + 右下角认证对勾(IMG_0464) */
export function OfficialLogo({ size = 46 }: { size?: number }) {
  return (
    <span className="relative inline-flex shrink-0">
      <span
        className="flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, background: C.green, borderRadius: size * 0.24, fontSize: size * 0.46 }}
      >
        豆
      </span>
      <span
        className="absolute flex items-center justify-center rounded-full"
        style={{
          right: -2,
          bottom: -2,
          width: size * 0.36,
          height: size * 0.36,
          background: C.green,
          border: '1.5px solid #fff',
        }}
      >
        <svg
          width={size * 0.2}
          height={size * 0.2}
          viewBox="0 0 12 12"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 6.5l2.5 2.5 4.5-5" />
        </svg>
      </span>
    </span>
  );
}

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

export default function ChatSessionPage() {
  const { bindTap } = useDoubanGestures();
  const { userId = '' } = useParams();
  const toast = useDoubanStore((s) => s.toast);
  const users = useDoubanStore((s) => s.users);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const messages = useDoubanStore((s) => s.messages);
  const sendMessage = useDoubanStore((s) => s.sendMessage);
  const [text, setText] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const isOfficial = userId === OFFICIAL_PEER_ID;
  const isNotice = userId === NOTICE_PEER_ID;
  const peer = useMemo(() => users.find((u) => u.id === userId), [users, userId]);
  const peerName = isNotice ? NOTICE_NAME : isOfficial ? OFFICIAL_NAME : peer?.name ?? '豆友';

  const thread: DoubanMessage[] = useMemo(() => {
    const own = messages.filter((m) => m.peerId === userId);
    if (isNotice) {
      // 官方通知 seed(IMG_0466 小组审核未通过通知;小组名/称呼均为虚构数据)
      return [
        {
          id: 'msg_notice_group_audit',
          peerId: NOTICE_PEER_ID,
          fromSelf: false,
          text: `${currentUser.name},你好:\n\n很抱歉,你申请创建的小组「随便聊聊」未能创建成功,理由:定位和主题不符合社区指导原则。\n\n小组是供对特定主题感兴趣的人友善讨论、交流的平台,申请创建小组时请明确小组的讨论主题或用法规则,并确保其符合豆瓣《社区指导原则》:\n\nhttps://www.douban.com/about/guideline\n\n——豆瓣`,
          createdAt: TimeService.now() - 3 * 24 * 3600 * 1000,
        },
        ...own,
      ];
    }
    if (isOfficial) {
      // 官方欢迎语(seed 级静态首条,IMG_0210「欢迎使用豆瓣。」)+ 播客推荐(IMG_0464 预览「[播客推荐]」)
      return [
        {
          id: 'msg_official_welcome',
          peerId: OFFICIAL_PEER_ID,
          fromSelf: false,
          text: '欢迎使用豆瓣。',
          createdAt: TimeService.now() - 3 * 365 * 24 * 3600 * 1000,
        },
        {
          id: 'msg_official_podcast',
          peerId: OFFICIAL_PEER_ID,
          fromSelf: false,
          text: '[播客推荐]',
          createdAt: TimeService.now() - 4 * 24 * 3600 * 1000,
        },
        ...own,
      ];
    }
    return own;
  }, [messages, userId, isOfficial, isNotice, currentUser.name]);

  const now = TimeService.now();

  // 新消息自动滚到底
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread.length]);

  const doSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(userId, t);
    setText('');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.surface }} data-status-bar-foreground="dark">
      <TopBar
        borderless
        title={
          <span className="inline-flex items-center gap-1.5 max-w-full align-middle">
            {isNotice ? (
              <NoticeAvatar size={26} />
            ) : isOfficial ? (
              <OfficialLogo size={26} />
            ) : (
              <Avatar src={peer?.avatar ?? ''} size={26} />
            )}
            <span className="truncate">{peerName}</span>
          </span>
        }
        right={
          /* 豆瓣通知会话顶栏右侧为空(IMG_0466) */
          isNotice ? undefined : (
            <button
              {...bindTap({ kind: 'action', id: 'chat.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-lg tracking-widest"
              style={{ color: C.text }}
            >
              …
            </button>
          )
        }
      />

      {/* 气泡列表 */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {thread.map((m, i) => {
          const prev = thread[i - 1];
          const showTime = !prev || m.createdAt - prev.createdAt > 10 * 60 * 1000;
          return (
            <div key={m.id}>
              {showTime && (
                <div className="text-center py-2">
                  <span className="text-[12px]" style={{ color: '#B9BEC6' }}>
                    {relTime(m.createdAt, now)}
                  </span>
                </div>
              )}
              {m.fromSelf ? (
                <div className="flex justify-end items-start gap-2 mb-3">
                  <div
                    className="max-w-[70%] px-3.5 py-2.5 rounded-xl text-[15px] leading-relaxed break-words"
                    style={{ background: MY_BUBBLE_GREEN, color: C.text }}
                  >
                    {m.text}
                  </div>
                  <Avatar src={currentUser.avatar} size={34} />
                </div>
              ) : (
                <div className="flex items-start gap-2 mb-3">
                  {isNotice ? (
                    <NoticeAvatar size={34} />
                  ) : isOfficial ? (
                    <span
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-base font-bold shrink-0"
                      style={{ background: C.green }}
                    >
                      豆
                    </span>
                  ) : (
                    <span {...bindTap('chat.user-open', { params: { userId } })} className="cursor-pointer shrink-0">
                      <Avatar src={peer?.avatar ?? ''} size={34} />
                    </span>
                  )}
                  {isNotice ? (
                    /* 官方通知大卡片(IMG_0466):多段落 + 绿色链接行 + ——豆瓣落款 */
                    <div
                      className="max-w-[88%] px-4 py-4 rounded-xl text-[15px] leading-relaxed break-words"
                      style={{ background: PEER_BUBBLE_GRAY, color: C.text }}
                    >
                      {m.text.split('\n').map((ln, idx) =>
                        ln.startsWith('https://') || ln.startsWith('http://') ? (
                          <div key={idx} className="break-all" style={{ color: C.link }}>
                            {ln}
                          </div>
                        ) : ln ? (
                          <div key={idx}>{ln}</div>
                        ) : (
                          <div key={idx} className="h-4" />
                        ),
                      )}
                    </div>
                  ) : (
                    <div
                      className="max-w-[70%] px-3.5 py-2.5 rounded-xl text-[15px] leading-relaxed break-words"
                      style={{ background: PEER_BUBBLE_GRAY, color: C.text }}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部输入条(IMG_0465:近全圆角输入框内置 ⤢ 展开角标,框外 😊/🖼;输入后追加发送钮)。
          豆瓣通知会话不可回复,无输入条(IMG_0466) */}
      {!isNotice && (
      <div
        className="shrink-0 flex items-center gap-3 px-3 py-2.5 bg-white"
        data-keep-keyboard="true"
      >
        <div className="relative flex-1 min-w-0">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doSend();
            }}
            placeholder="发送消息"
            className="w-full h-11 rounded-full pl-4 pr-10 text-[15px] outline-none border-none"
            style={{ background: '#F2F3F5', color: C.text }}
          />
          {/* 展开为全屏编辑的角标(纯装饰,未实现入口不打标) */}
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center"
            style={{ color: '#B9BEC6' }}
            aria-hidden
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M14 10l6-6M20 4v5M20 4h-5" />
              <path d="M10 14l-6 6M4 20v-5M4 20h5" />
            </svg>
          </span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'chat.emoji.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: '#5A5F66' }}
          aria-label="表情"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <circle cx="9" cy="10" r="0.5" fill="currentColor" />
            <circle cx="15" cy="10" r="0.5" fill="currentColor" />
          </svg>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'chat.image.wontfix' }, { onTrigger: () => {
            void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((result) => {
              if (result.cancelled || !result.selected[0]) return;
              sendMessage(userId, `[图片] ${result.selected[0].uri}`);
              toast('图片已发送');
            });
          } })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: '#5A5F66' }}
          aria-label="图片"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
        {text.trim() && (
          <button
            {...bindTap({ kind: 'action', id: 'chat.message.send' }, {
              params: { value: text },
              onTrigger: doSend,
            })}
            className="px-4 h-9 rounded-full text-sm border-none cursor-pointer text-white shrink-0"
            style={{ background: C.green }}
          >
            发送
          </button>
        )}
      </div>
      )}
    </div>
  );
}
