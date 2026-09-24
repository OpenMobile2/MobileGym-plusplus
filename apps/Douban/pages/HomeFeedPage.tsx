// 首页动态流(home.feed,IMG_0209/0212/0213,frame:ac79b0@t0003/t0008):
// 顶栏(☰/胶囊搜索/耳机/信封角标)+ 动态/推荐 Tab + 播客横幅 + 广播卡/小组内容卡/话题聚合卡
// + 下拉刷新三种绿色胶囊 toast + 铅笔发布 FAB;转发编辑器(引用卡+n/350)落独立转发动态。
import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, Img, MarkBtn, MetaLine, RatingLine, Stars, fmtCount } from '../components/ui';
import type { DetailTargetType, DoubanBroadcast, DoubanGroupPost, DoubanSubject, DoubanTopic } from '../types';
import { setImageViewerPayload } from './MediaImageviewerPage';

type FeedTab = 'activity' | 'recommend';

/** 刷新时旋转数组:把前 k 项移到末尾,内容不变但顺序变,视觉上"刷新出新内容" */
function rotate<T>(arr: T[], k: number): T[] {
  if (arr.length < 2) return arr;
  const s = ((k % arr.length) + arr.length) % arr.length;
  return s === 0 ? arr : [...arr.slice(s), ...arr.slice(0, s)];
}

function relTime(ts: number, now: number): string {
  const min = Math.floor(Math.max(0, now - ts) / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return `${Math.floor(d / 30)}个月前`;
}

const LikeIcon = ({ filled }: { filled: boolean }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill={filled ? C.green : 'none'} stroke="currentColor" strokeWidth="1.8">
    <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" />
  </svg>
);
const ReplyIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);
const RepostIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </svg>
);

type RecommendItem =
  | { kind: 'group'; post: DoubanGroupPost }
  | { kind: 'topic'; topic: DoubanTopic }
  | { kind: 'bc'; b: DoubanBroadcast };

/** 想看/想读/想听 文案(条目收藏卡右侧 MarkBtn) */
const MARK_LABELS: Record<string, { label: string; marked: string }> = {
  movie: { label: '想看', marked: '已想看' },
  tv: { label: '想看', marked: '已想看' },
  book: { label: '想读', marked: '已想读' },
  music: { label: '想听', marked: '已想听' },
  podcast: { label: '想听', marked: '已想听' },
};

/** 活动类动态的附件卡(开始时间/地点/参加人数;原创虚构内容,seed 无活动实体故按广播 id 派生) */
const FEED_ACTIVITY_META: Record<string, { title: string; start: string; place: string; joined: number }> = {
  b_luli: { title: '坝上草原晨行漫步', start: '2026-07-18 09:00', place: '河北 · 丰宁坝上集合点', joined: 0 },
  b_yezi: { title: '城市奶茶隐藏菜单探店团', start: '2026-07-11 14:00', place: '重庆 · 观音桥步行街', joined: 0 },
};

/** 榜单行文案:top250Rank → 「豆瓣图书 Top250 NO.x」;hotLabel「NO.2|每月热门图书榜」→「豆瓣每月热门图书榜 NO.2」 */
function hotRowText(subject: DoubanSubject): string | null {
  if (subject.top250Rank) return `豆瓣图书 Top250 NO.${subject.top250Rank}`;
  if (!subject.hotLabel) return null;
  const [no, board] = subject.hotLabel.split('|');
  return board ? `豆瓣${board} ${no}` : subject.hotLabel;
}

/** 卡片右上角「···」更多按钮(占位,未实现功能不打标) */
const MoreDots = ({ stop }: { stop?: boolean }) => (
  <button
    onClick={stop ? (e) => e.stopPropagation() : undefined}
    className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0 text-lg leading-none"
    style={{ color: '#B9BEC6' }}
    aria-label="更多"
  >
    ···
  </button>
);

export default function HomeFeedPage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const users = useDoubanStore((s) => s.users);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const discussions = useDoubanStore((s) => s.discussions);
  const reviews = useDoubanStore((s) => s.reviews);
  const groups = useDoubanStore((s) => s.groups);
  const topics = useDoubanStore((s) => s.topics);
  const subjects = useDoubanStore((s) => s.subjects);
  const rankings = useDoubanStore((s) => s.rankings);
  const marks = useDoubanStore((s) => s.marks);
  const comments = useDoubanStore((s) => s.comments);
  const replies = useDoubanStore((s) => s.replies);
  const likes = useDoubanStore((s) => s.likes);
  const notifications = useDoubanStore((s) => s.notifications);
  const followUserIds = useDoubanStore((s) => s.follows.users);
  const searchHistory = useDoubanStore((s) => s.searchHistory);
  const toggleLike = useDoubanStore((s) => s.toggleLike);
  const joinGroupDirect = useDoubanStore((s) => s.joinGroupDirect);
  const repostTarget = useDoubanStore((s) => s.repostTarget);

  const tab: FeedTab = searchParams.get('tab') === 'recommend' ? 'recommend' : 'activity';
  const repostId = searchParams.get('rp');
  const repostType = (searchParams.get('rpt') as DetailTargetType | null) ?? 'broadcast';
  const [repostText, setRepostText] = useState('');
  const now = TimeService.now();

  // 下拉刷新
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  // 刷新种子:每次刷新自增,用于旋转信息流顺序,让"刷新"真的看到内容变化
  const [refreshSeed, setRefreshSeed] = useState(0);
  const refreshCountRef = useRef<Record<FeedTab, number>>({ activity: 0, recommend: 0 });
  const pullRef = useRef<{ startY: number; startTop: number; fired: boolean; active: boolean }>({
    startY: 0,
    startTop: 0,
    fired: false,
    active: false,
  });
  const refreshTimerRef = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const doRefresh = () => {
    setRefreshSeed((s) => s + 1);
    const n = refreshCountRef.current[tab]++;
    let msg: string;
    if (tab === 'activity') {
      msg = n === 0 ? '为你更新了一组内容' : n === 1 ? '已更新3条' : '暂无更新,左滑看看推荐';
    } else {
      msg = n % 2 === 0 ? '为你更新了一组内容' : '已更新2条';
    }
    setRefreshMsg(msg);
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => setRefreshMsg(null), 1800);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pullRef.current = {
      startY: e.clientY,
      startTop: listRef.current?.scrollTop ?? 0,
      fired: false,
      active: true,
    };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pullRef.current;
    if (!p.active || p.fired) return;
    const dy = e.clientY - p.startY;
    if (p.startTop <= 0 && (listRef.current?.scrollTop ?? 0) <= 0 && dy > 70) {
      p.fired = true;
      doRefresh();
    }
  };
  const onPointerEnd = () => {
    pullRef.current.active = false;
  };

  const userOf = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u]));
    return (uid: string) => m.get(uid);
  }, [users]);
  const groupOf = useMemo(() => {
    const m = new Map(groups.map((g) => [g.id, g]));
    return (gid: string | null) => (gid ? m.get(gid) : undefined);
  }, [groups]);
  const bcById = useMemo(() => {
    const m = new Map(broadcasts.map((b) => [b.id, b]));
    return (bid: string) => m.get(bid);
  }, [broadcasts]);

  const myLikedKeys = useMemo(
    () => new Set(likes.filter((l) => l.userId === currentUser.id).map((l) => `${l.targetType}:${l.targetId}`)),
    [likes, currentUser.id],
  );
  /** 条目收藏卡:subjectCard 存条目 id */
  const subjById = useMemo(() => {
    const m = new Map<string, DoubanSubject>();
    subjects.forEach((s) => m.set(s.id, s));
    return (id: string) => m.get(id);
  }, [subjects]);
  /** 我对某条目的标记状态(done/doing/wish 均视为「已标记」;marks 即当前用户) */
  const myMarkedSubjects = useMemo(() => new Set(marks.map((mk) => mk.subjectId)), [marks]);

  /** 榜单出炉 banner(运营位):跳转每月热门图书榜。榜首条目取自 rankings。 */
  const bookRank = useMemo(() => rankings.find((r) => r.kind === 'book'), [rankings]);
  const rankTop = useMemo(() => {
    const id = bookRank?.items?.[0]?.subjectId;
    return id ? subjects.find((s) => s.id === id) : undefined;
  }, [bookRank, subjects]);
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  /** 动态 tab:关注的人 + 自己 */
  const activityFeed = useMemo(() => {
    const visible = new Set([currentUser.id, ...followUserIds]);
    const list = [...broadcasts]
      .filter((b) => visible.has(b.authorId))
      .sort((a, b) => b.createdAt - a.createdAt);
    return rotate(list, refreshSeed);
  }, [broadcasts, followUserIds, currentUser.id, refreshSeed]);

  /** 推荐 tab:小组内容卡 / 话题聚合卡 / 图文广播 混排 */
  const recommendFeed = useMemo<RecommendItem[]>(() => {
    const gp = groupPosts.filter((p) => p.groupId);
    const bc = [...broadcasts]
      .filter((b) => !b.isRepost)
      .sort((a, b) => b.likeCount - a.likeCount);
    const tp = topics.filter((t) => t.views > 100000);
    const items: RecommendItem[] = [];
    const maxLen = Math.max(gp.length, bc.length);
    for (let i = 0; i < maxLen; i++) {
      if (gp[i]) items.push({ kind: 'group', post: gp[i] });
      if (bc[i]) items.push({ kind: 'bc', b: bc[i] });
      if (tp[i]) items.push({ kind: 'topic', topic: tp[i] });
    }
    return rotate(items, refreshSeed);
  }, [groupPosts, broadcasts, topics, refreshSeed]);

  const switchTab = (t: FeedTab) =>
    setSearchParams(
      (p) => {
        p.set('tab', t);
        return p;
      },
      { replace: true },
    );

  const openRepost = (type: DetailTargetType, id: string) => {
    setRepostText('');
    setSearchParams((p) => {
      p.set('rp', id);
      p.set('rpt', type);
      return p;
    });
  };

  const repostTargetEntity = useMemo(() => {
    if (!repostId) return null;
    if (repostType === 'groupPost') {
      const p = groupPosts.find((gp) => gp.id === repostId);
      return p ? { authorId: p.authorId, text: p.title || p.content } : null;
    }
    const b = bcById(repostId);
    return b ? { authorId: b.authorId, text: b.text } : null;
  }, [repostId, repostType, groupPosts, bcById]);

  /** 广播卡(动态/推荐通用) */
  const renderBroadcastCard = (b: DoubanBroadcast) => {
    const author = userOf(b.authorId);
    const topic = b.topicId ? topics.find((t) => t.id === b.topicId) : undefined;
    const liked = myLikedKeys.has(`broadcast:${b.id}`);
    // 转发引用原文:按 origType 跨类型解析(广播/小组帖/讨论/影评)
    const orig = (() => {
      if (!b.isRepost || !b.origId) return undefined;
      if (b.origType === 'groupPost') {
        const p = groupPosts.find((x) => x.id === b.origId);
        return p ? { authorId: p.authorId, text: p.title || p.content } : undefined;
      }
      if (b.origType === 'discussion') {
        const d = discussions.find((x) => x.id === b.origId);
        return d ? { authorId: d.authorId, text: d.title || d.content } : undefined;
      }
      if (b.origType === 'review') {
        const r = reviews.find((x) => x.id === b.origId);
        return r ? { authorId: r.authorId, text: r.title || r.text } : undefined;
      }
      return bcById(b.origId);
    })();
    return (
      <div key={b.id} className="bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            {...bindTap('home.user-open', { params: { userId: b.authorId } })}
            className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1"
          >
            <Avatar src={author?.avatar ?? ''} size={38} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 min-w-0">
                <span className="text-[14px] font-medium truncate" style={{ color: C.text }}>
                  {author?.name ?? '豆友'}
                </span>
                {/* 用户名旁绿色等级小徽章 */}
                <span
                  className="shrink-0 px-1 rounded-sm text-[9px] leading-[14px] font-medium"
                  style={{ background: C.greenSoft, color: C.green }}
                >
                  Lv{(b.authorId.length % 5) + 4}
                </span>
              </span>
              <MetaLine time={relTime(b.createdAt, now)} extra={b.isRepost ? '转发动态' : undefined} />
            </span>
          </span>
          <MoreDots stop />
        </div>
        <div {...bindTap('home.broadcast-open', { params: { id: b.id } })} className="cursor-pointer">
          <div className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap break-words line-clamp-6" style={{ color: C.text }}>
            {b.text}
          </div>
          {b.text.length > 60 && (
            <span className="text-[15px]" style={{ color: C.sub }}>…全文</span>
          )}
          {/* 条目收藏卡:封面+标题+评分/暂无评分+右侧MarkBtn+榜单行(整卡落在 home.broadcast-open 点击区内) */}
          {(() => {
            const sub = b.subjectCard ? subjById(b.subjectCard) : undefined;
            if (!sub) return null;
            const marked = myMarkedSubjects.has(sub.id);
            const ml = MARK_LABELS[sub.type] ?? MARK_LABELS.movie;
            const row = hotRowText(sub);
            return (
              <div className="mt-2 rounded-lg border overflow-hidden" style={{ borderColor: C.border, background: '#FAFAFA' }}>
                <div className="flex gap-2.5 p-2.5">
                  <Img src={sub.cover} className="shrink-0 rounded object-cover" style={{ width: 44, height: 60 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: C.text }}>{sub.title}</div>
                    <div className="mt-1">
                      {sub.rating ? <RatingLine rating={sub.rating} count={sub.ratingCount} size={10} /> : <span className="text-xs" style={{ color: C.sub }}>暂无评分</span>}
                    </div>
                    <div className="mt-0.5 text-[11px] truncate" style={{ color: C.sub }}>{sub.info}</div>
                  </div>
                  <MarkBtn label={ml.label} marked={marked} markedLabel={ml.marked} size="sm" />
                </div>
                {row && (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 border-t text-[11px]" style={{ borderColor: C.border, color: C.gold, background: '#FFFBF2' }}>
                    🏆 {row} ›
                  </div>
                )}
              </div>
            );
          })()}
          {/* 活动类附件卡(开始时间/地点/参加人数) */}
          {FEED_ACTIVITY_META[b.id] && (
            <div className="mt-2 rounded-lg p-3 text-xs" style={{ background: '#F2F6F4', color: C.sub }}>
              <div className="text-sm font-medium mb-1" style={{ color: C.text }}>{FEED_ACTIVITY_META[b.id].title}</div>
              <div>开始时间:{FEED_ACTIVITY_META[b.id].start}</div>
              <div>地点:{FEED_ACTIVITY_META[b.id].place}</div>
              <div>参加人数:{FEED_ACTIVITY_META[b.id].joined}</div>
            </div>
          )}
          {orig && (
            <div className="mt-2 px-3 py-2 rounded-lg text-[13px] leading-snug" style={{ background: '#F7F7F7', color: C.sub }}>
              {userOf(orig.authorId)?.name ?? '豆友'}:{orig.text.slice(0, 60)}
            </div>
          )}
          {b.images.length > 0 && (
            <div className="mt-2 flex gap-1.5">
              {b.images.slice(0, 3).map((src, i) => (
                <span
                  key={i}
                  {...bindTap('home.image-open', {
                    stopPropagation: true,
                    beforeTrigger: () =>
                      setImageViewerPayload({
                        images: b.images,
                        index: i,
                        likeCount: b.likeCount,
                        replyCount: b.replyCount,
                      }),
                  })}
                  className="cursor-pointer"
                >
                  <Img src={src} className="w-26 h-26 rounded object-cover" style={{ width: 104, height: 104 }} />
                </span>
              ))}
            </div>
          )}
          {topic && (
            <span
              {...bindTap('home.topic-open', { params: { id: topic.id }, stopPropagation: true })}
              className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs cursor-pointer"
              style={{ background: C.greenSoft, color: C.green }}
            >
              # {topic.name}
            </span>
          )}
        </div>
        {/* 赞/回复/转发操作行 */}
        <div className="flex mt-2.5">
          <button
            {...bindTap({ kind: 'action', id: 'home.card.like.toggle' }, {
              params: { id: b.id },
              onTrigger: () => toggleLike('broadcast', b.id),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: liked ? C.green : C.sub }}
          >
            <LikeIcon filled={liked} />
            {b.likeCount > 0 ? fmtCount(b.likeCount) : '赞'}
          </button>
          <button
            {...bindTap('home.broadcast-open', { params: { id: b.id } })}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: C.sub }}
          >
            <ReplyIcon />
            {b.replyCount > 0 ? fmtCount(b.replyCount) : '回复'}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'home.card.repost.compose' }, {
              params: { id: b.id },
              onTrigger: () => openRepost('broadcast', b.id),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: C.sub }}
          >
            <RepostIcon />
            {b.repostCount > 0 ? fmtCount(b.repostCount) : '转发'}
          </button>
        </div>
      </div>
    );
  };

  /** 小组内容卡(推荐 tab) */
  const renderGroupCard = (post: DoubanGroupPost) => {
    const group = groupOf(post.groupId);
    const hot = replies.find((r) => r.targetType === 'groupPost' && r.targetId === post.id && r.isHot);
    const liked = myLikedKeys.has(`groupPost:${post.id}`);
    return (
      <div key={post.id} className="bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Img src={group?.icon ?? ''} className="w-6 h-6 rounded object-cover" />
          <span className="flex-1 text-[13px] truncate" style={{ color: C.sub }}>{group?.name ?? '小组'}</span>
          <button
            {...bindTap({ kind: 'action', id: 'home.groupCard.join' }, {
              params: { groupId: post.groupId ?? '' },
              onTrigger: () => {
                if (!group) return;
                if (group.joined) {
                  toast('已加入该小组');
                } else {
                  joinGroupDirect(group.id);
                  toast(`已加入「${group.name}」`);
                }
              },
            })}
            className="px-3 h-7 rounded-full text-xs cursor-pointer shrink-0"
            style={
              group?.joined
                ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
                : { background: C.greenSoft, color: C.green, border: 'none' }
            }
          >
            {group?.joined ? '已加入' : '+ 加入'}
          </button>
          <MoreDots stop />
        </div>
        <div {...bindTap('home.groupPost-open', { params: { topicId: post.id } })} className="cursor-pointer">
          <div className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.text }}>{post.title}</div>
          <div className="mt-1 text-sm leading-relaxed line-clamp-2" style={{ color: C.sub }}>{post.content}</div>
          {hot && (
            <div className="mt-2 flex items-start gap-1.5 pl-2 border-l-2" style={{ borderColor: C.border }}>
              <span className="text-xs shrink-0 leading-relaxed" style={{ color: C.text }}>
                <span style={{ color: '#F0453E' }}>🔥</span> 热门回复:
              </span>
              <span className="flex-1 min-w-0 flex items-start gap-1.5">
                <span className="text-xs line-clamp-1 flex-1 min-w-0" style={{ color: C.text }}>{hot.text}</span>
                {hot.images.length > 0 && (
                  <Img src={hot.images[0]} className="shrink-0 rounded object-cover" style={{ width: 28, height: 28 }} />
                )}
              </span>
            </div>
          )}
        </div>
        <div className="flex mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'home.card.like.toggle' }, {
              params: { id: post.id },
              onTrigger: () => toggleLike('groupPost', post.id),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: liked ? C.green : C.sub }}
          >
            <LikeIcon filled={liked} />
            {post.likeCount > 0 ? fmtCount(post.likeCount) : '赞'}
          </button>
          <button
            {...bindTap('home.groupPost-open', { params: { topicId: post.id } })}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: C.sub }}
          >
            <ReplyIcon />
            {fmtCount(post.replyCount)}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'home.card.repost.compose' }, {
              params: { id: post.id },
              onTrigger: () => openRepost('groupPost', post.id),
            })}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-transparent border-none cursor-pointer text-[13px]"
            style={{ color: C.sub }}
          >
            <RepostIcon />
            {post.repostCount > 0 ? fmtCount(post.repostCount) : '转发'}
          </button>
        </div>
      </div>
    );
  };

  /** 话题聚合卡(推荐 tab) */
  const renderTopicCard = (topic: DoubanTopic) => (
    <div
      key={topic.id}
      {...bindTap('home.topic-open', { params: { id: topic.id } })}
      className="bg-white px-4 py-3 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: C.green }}
        >
          #
        </span>
        <span className="flex-1 text-[15px] font-semibold truncate" style={{ color: C.text }}>{topic.name}</span>
        <MoreDots stop />
      </div>
      {topic.desc && <div className="mt-1.5 text-[13px] line-clamp-2" style={{ color: C.sub }}>{topic.desc}</div>}
      <div className="mt-1.5 text-xs" style={{ color: '#B9BEC6' }}>
        {fmtCount(topic.views)}次浏览 · {fmtCount(topic.postCount)}篇内容
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.surface }} data-status-bar-foreground="dark">
      {/* 顶部栏:☰ / 胶囊搜索 / 耳机 / 信封 */}
      <div className="flex items-center gap-2 px-3 h-12 shrink-0 bg-white">
        <button
          {...bindTap('home.drawer-open')}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: C.green }}
          aria-label="菜单"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          {...bindTap('home.search-open')}
          className="flex-1 flex items-center gap-2 h-9 rounded-full px-3.5 border-none cursor-pointer text-sm text-left min-w-0"
          style={{ background: '#F2F3F5', color: C.sub }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="truncate">{searchHistory[0] ?? '赤水长歌'}</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'home.headset.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: C.green }}
          aria-label="播放列表"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <path d="M3 18v-6a9 9 0 0118 0v6" />
            <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
          </svg>
        </button>
        <button
          {...bindTap('home.message-open')}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0 relative"
          style={{ color: C.green }}
          aria-label="消息"
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute top-0 right-0 min-w-4 h-4 px-0.5 rounded-full text-[10px] text-white flex items-center justify-center"
              style={{ background: '#F0453E' }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* 动态/推荐 Tab 条 */}
      <div className="flex gap-2 px-3 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        {([
          ['activity', '动态'],
          ['recommend', '推荐'],
        ] as [FeedTab, string][]).map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'home.feedTab.select.target' }, {
                params: { target: t },
                onTrigger: () => switchTab(t),
              })}
              className="px-4 py-2.5 bg-transparent border-none cursor-pointer text-[17px] relative"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {label}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-[3px] rounded-full" style={{ background: C.text }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 下拉刷新绿色胶囊 toast */}
      {refreshMsg && (
        <div className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none" style={{ top: 104 }}>
          <span className="px-4 py-1.5 rounded-full text-xs text-white whitespace-nowrap" style={{ background: C.green }}>
            {refreshMsg}
          </span>
        </div>
      )}

      {/* 流列表(pull-down 刷新,spec home.feed.refresh) */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto"
        style={{ background: C.bg }}
        data-scroll-container="feed"
        data-scroll-direction="vertical"
        data-action="home.feed.refresh"
        data-action-type="pull-down"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {/* 榜单出炉横幅(运营位):跳转每月热门图书榜(简易入口,不建活动页) */}
        <button
          {...bindTap('home.ranklist-open', { params: { listId: bookRank?.id ?? 'rank_book_monthly' } })}
          className="w-[calc(100%-24px)] mx-3 mt-2.5 mb-1 rounded-xl px-4 py-3 border-none cursor-pointer text-left flex items-center gap-3"
          style={{ background: 'linear-gradient(100deg,#E5484D,#F06A50)' }}
        >
          {/* 左侧奖杯徽章 */}
          <span className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-lg text-2xl" style={{ background: 'rgba(255,255,255,0.16)' }}>🏆</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[15px] font-bold text-white">{bookRank?.title ?? '每月热门图书榜'}出炉</span>
            <span className="block mt-0.5 text-xs text-white/85 truncate">
              {rankTop ? `本月第1名《${rankTop.title}》· 点击查看完整榜单` : '决选名单已公布 · 点击查看完整榜单'}
            </span>
          </span>
          <span className="shrink-0 text-white/85 text-lg">›</span>
        </button>

        {/* 卡片间约 8px 灰色厚带(非 1px 细线) */}
        <div className="mt-1.5 flex flex-col gap-2" style={{ background: C.bg }}>
          {tab === 'activity'
            ? activityFeed.map(renderBroadcastCard)
            : recommendFeed.map((item) =>
                item.kind === 'group'
                  ? renderGroupCard(item.post)
                  : item.kind === 'topic'
                    ? renderTopicCard(item.topic)
                    : renderBroadcastCard(item.b),
              )}
        </div>
      </div>

      {/* 铅笔发布悬浮按钮 */}
      <button
        {...bindTap('home.compose-open')}
        className="absolute right-4 bottom-6 w-13 h-13 rounded-full flex items-center justify-center border-none cursor-pointer z-20"
        style={{ background: '#1A1A1A', width: 52, height: 52, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        aria-label="发布"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      </button>

      {/* 转发编辑器(引用原文卡 + n/350) */}
      {repostId && repostTargetEntity && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div
            {...bindTap({ kind: 'action', id: 'home.card.repost.compose' }, {
              params: { close: 1 },
              onTrigger: () => {
                setSearchParams((p) => {
                  p.delete('rp');
                  p.delete('rpt');
                  return p;
                }, { replace: true });
              },
            })}
            className="flex-1"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          />
          <div className="rounded-t-2xl bg-white px-4 pt-4 pb-5 shrink-0" data-keep-keyboard="true">
            <div className="text-center text-sm font-semibold mb-3" style={{ color: C.text }}>转发</div>
            <textarea
              value={repostText}
              onChange={(e) => setRepostText(e.target.value.slice(0, 350))}
              placeholder="说点什么…"
              rows={3}
              className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none border-none"
              style={{ background: '#F2F3F5', color: C.text }}
            />
            {/* 引用原文卡 */}
            <div className="mt-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: '#F7F7F7' }}>
              <Avatar src={userOf(repostTargetEntity.authorId)?.avatar ?? ''} size={24} />
              <span className="text-xs line-clamp-2 flex-1" style={{ color: C.sub }}>
                {userOf(repostTargetEntity.authorId)?.name ?? '豆友'}:{repostTargetEntity.text.slice(0, 70)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs" style={{ color: repostText.length >= 350 ? C.danger : '#B9BEC6' }}>
                {repostText.length}/350
              </span>
              <button
                {...bindTap({ kind: 'action', id: 'home.card.repost.compose' }, {
                  params: { submit: 1 },
                  onTrigger: () => {
                    repostTarget(repostType, repostId, repostText.trim());
                    toast('转发成功');
                    setRepostText('');
                    setSearchParams((p) => {
                      p.delete('rp');
                      p.delete('rpt');
                      return p;
                    }, { replace: true });
                  },
                })}
                className="px-5 h-9 rounded-full text-sm text-white border-none cursor-pointer"
                style={{ background: C.green }}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
