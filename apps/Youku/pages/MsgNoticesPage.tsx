import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useYoukuStore } from '../state';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { YOUKU_CONFIG } from '../data';
import { fmtMdHm } from '../utils/appTime';
import { contentCase, contentNavParams } from '../utils/openContent';
import type { NoticeEntry } from '../types';
import Img from '../components/Img';
import EmptyState from '../components/msgpub/EmptyState';
import { IcBack, IcMore, IcHeart, IcPlayRing } from '../components/msgpub/icons';

type NoticeType = 'like' | 'danmu' | 'comment';

/** URL type → unread/notices key */
const KEY_BY_TYPE = { like: 'likes', comment: 'comments', danmu: 'danmu' } as const;

interface ContentLite {
  id: string;
  type: string;
  title: string;
  cover: string;
}

/** contentId → 内容条目(片库/短视频/短剧/本人动态,产出通用路由参数与缩略图) */
function findContent(id: string): ContentLite | null {
  if (id.startsWith('mm_')) {
    const moments = (YOUKU_CONFIG as { seedMoments?: Array<{ id: string; text: string; image?: string | null; showId?: string | null }> }).seedMoments ?? [];
    const m = moments.find((x) => x.id === id);
    if (!m) return { id, type: 'moment', title: '我的动态', cover: '' };
    const show = m.showId
      ? (YOUKU_CONFIG.catalog as Array<{ id: string; still: string }>).find((x) => x.id === m.showId)
      : undefined;
    return {
      id: m.id,
      type: 'moment',
      title: m.text.slice(0, 24) || '我的动态',
      cover: m.image || show?.still || '',
    };
  }
  const c = (YOUKU_CONFIG.catalog as Array<{ id: string; type: string; title: string; still: string }>)
    .find((x) => x.id === id);
  if (c) return { id: c.id, type: c.type, title: c.title, cover: c.still };
  const sv = (YOUKU_CONFIG.shorts as Array<{ id: string; type: string; title: string; cover: string }>)
    .find((x) => x.id === id);
  if (sv) return { id: sv.id, type: sv.type, title: sv.title, cover: sv.cover };
  const dr = (YOUKU_CONFIG.shortDramas as Array<{ id: string; type: string; title: string; cover: string }>)
    .find((x) => x.id === id);
  if (dr) return { id: dr.id, type: dr.type, title: dr.title, cover: dr.cover };
  return null;
}

/** 通知发送者头像:『你』=本人;其余按创作者名匹配 */
function noticeAvatar(user: string, myAvatar: string): string {
  if (user === '你') return myAvatar;
  const c = (YOUKU_CONFIG.creators as Array<{ name: string; avatar: string }>).find((x) => x.name === user);
  return c?.avatar ?? '';
}

/** spec 节点 msg.likes(route /messages/notices/:type)—— 通用通知页(s254,type=like/danmu/comment) */
export default function MsgNoticesPage() {
  const { type: rawType } = useParams();
  const type: NoticeType = rawType === 'danmu' ? 'danmu' : rawType === 'comment' ? 'comment' : 'like';
  const storeKey = KEY_BY_TYPE[type];

  const { bindTap, action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const notices = useYoukuStore((s) => s.notices);
  const myAvatar = useYoukuStore((s) => s.user.avatar);
  const markRead = useYoukuStore((s) => s.markRead);
  const showToast = useYoukuStore((s) => s.showToast);

  // 进入清零未读(幂等,StrictMode 安全)
  useEffect(() => {
    markRead(storeKey);
  }, [markRead, storeKey]);

  const list: NoticeEntry[] = [...notices[storeKey]].sort((a, b) => b.ts - a.ts);

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶部氛围水印(s254 右上暗红心形) */}
      <IcHeart
        size={200}
        strokeWidth={0}
        fill="#3A1220"
        className="pointer-events-none absolute -right-10 -top-4 opacity-60"
        aria-hidden
      />

      <div className="relative flex h-11 shrink-0 items-center justify-between px-3">
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcBack size={24} strokeWidth={2.5} />
        </button>
        <button
          {...action('msg.likes.more.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcMore size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="relative px-4 pb-2 pt-1 text-[26px] font-bold">
        {t(`msg.notices.title.${type}`)}
      </div>

      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="relative min-h-0 flex-1 overflow-y-auto pb-6"
      >
        {list.length === 0 && <EmptyState text={t(`msg.notices.empty.${type}`)} />}

        {list.map((n, i) => {
          const content = findContent(n.contentId);
          const prev = list[i - 1];
          const showTime = !prev || fmtMdHm(prev.ts) !== fmtMdHm(n.ts);
          const avatar = noticeAvatar(n.user, myAvatar);
          const card = (
            <div className="rounded-2xl bg-(--app-c-card-bg)/90 p-3.5">
              <div className="flex items-center gap-2.5">
                <Img
                  src={avatar}
                  label={n.user}
                  ratio="square"
                  className="h-10 w-10 shrink-0 rounded-full bg-(--app-c-chip-bg) object-cover"
                />
                <span className="text-[15px] font-medium">{n.user}</span>
              </div>
              <div className="mt-2.5 text-[15px]">{n.action}</div>
              {n.text && <div className="mt-1.5 text-[14px] text-[#CCCCCC]">{n.text}</div>}
              {n.quote && (
                <div className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-(--app-c-chip-bg) p-2">
                  <div className="relative shrink-0">
                    <Img
                      src={content?.cover}
                      label={content?.title ?? ''}
                      ratio="landscape"
                      className="h-10 w-[68px] rounded-lg object-cover"
                    />
                    <IcPlayRing
                      size={16}
                      strokeWidth={2}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/90"
                    />
                  </div>
                  <div className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-[18px] text-[#999999]">
                    {n.quote}
                  </div>
                </div>
              )}
            </div>
          );
          return (
            <div key={n.id} className="px-3">
              {showTime && (
                <div className="px-1 pb-2 pt-3 text-[13px] text-[#999999]">{fmtMdHm(n.ts)}</div>
              )}
              {content ? (
                <div
                  {...bindTap('msg.likes.player.open', {
                    params:
                      content.type === 'moment'
                        ? { ctype: 'moment', momentId: content.id }
                        : contentNavParams(content, {
                            ...(contentCase(content.type) === 'series' ? { ep: n.episode ?? 1 } : {}),
                            ...(n.commentId ? { commentId: n.commentId } : {}),
                          }),
                  })}
                  className="cursor-pointer"
                >
                  {card}
                </div>
              ) : (
                card
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
